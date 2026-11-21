plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
    id("com.google.gms.google-services")
    id("io.sentry.android.gradle")
}

configurations.all {
    resolutionStrategy.force("androidx.tracing:tracing:1.3.0-alpha02")
}

// The token that lets a release upload its mapping file to Sentry. It exists only in the release
// workflow; CI and every local build run without one, and must keep building exactly as before.
val sentryAuthToken: String = (project.findProperty("SENTRY_AUTH_TOKEN") as? String)
    ?: System.getenv("SENTRY_AUTH_TOKEN") ?: ""

// Sentry gets the R8 mapping, so a crash from a release build reads as our own names instead of
// a.b.c.d(). Crash reporting has been on for the release since 2026-10-01 and every Kotlin frame
// has been unreadable since -- the reports existed, were counted, and said nothing, which is
// worse than no reports because the dashboard looks healthy (#452).
//
// Everything else this plugin can do is switched off on purpose. The SDK is declared by hand in
// `dependencies`, and bytecode instrumentation would change what is built; this is meant to add
// an upload step and nothing more.
sentry {
    org.set("multihead-9n")
    projectName.set("hivepulse-android")
    // The account is in Sentry's EU region. Without this the plugin talks to the US one and the
    // upload is refused for an organisation that does not exist there.
    url.set("https://de.sentry.io")

    includeProguardMapping.set(true)
    // No token, no upload -- and no failure either.
    autoUploadProguardMapping.set(sentryAuthToken.isNotBlank())
    authToken.set(sentryAuthToken)

    autoInstallation { enabled.set(false) }
    tracingInstrumentation { enabled.set(false) }
    includeSourceContext.set(false)
    // Not needed to read a stack trace, and it puts an 8 KB inventory of every dependency into
    // the bundle and sends it along. The UUID in assets/sentry-debug-meta.properties is the one
    // file that has to be there: it is what matches a crash to the mapping uploaded above.
    includeDependenciesReport.set(false)
    telemetry.set(false)
    ignoredBuildTypes.set(setOf("debug"))
}

android {
    namespace   = "com.hivepulse.app"
    // Google Play requires new submissions to target API 36 (Android 16).
    compileSdk  = 36

    val baseUrl: String = (project.findProperty("BASE_URL") as? String)
        ?: "http://10.0.2.2:8000/api/v1/"

    // Crash reporting is off unless a DSN is passed at build time
    // (-PSENTRY_DSN=… or the SENTRY_DSN_ANDROID environment variable).
    val sentryDsn: String = (project.findProperty("SENTRY_DSN") as? String)
        ?: System.getenv("SENTRY_DSN_ANDROID") ?: ""

    // Selling is off unless RevenueCat's **public** SDK key is passed at build time
    // (-PREVENUECAT_PUBLIC_KEY=… or REVENUECAT_PUBLIC_KEY_ANDROID). Without it the paywall says
    // it cannot be bought here rather than talking to an account that is not ours -- the same
    // position WEB_CHECKOUT_ENABLED holds on the website. It is not a secret by design, but this
    // repository is public, so it is not written down in it either.
    val revenueCatKey: String = (project.findProperty("REVENUECAT_PUBLIC_KEY") as? String)
        ?: System.getenv("REVENUECAT_PUBLIC_KEY_ANDROID") ?: ""

    // Google Play refuses an upload whose version code it has seen before, so the release
    // workflow passes a strictly increasing one. Local builds stay at 1.
    val buildVersionCode: Int = (project.findProperty("VERSION_CODE") as? String)?.toIntOrNull() ?: 1
    val buildVersionName: String = (project.findProperty("VERSION_NAME") as? String) ?: "1.0.0"

    // The upload keystore never lives in this repository. The release workflow writes it from
    // a secret and points at it; without it a release build is simply left unsigned, which is
    // enough for CI to prove it compiles.
    val keystorePath: String? = (project.findProperty("KEYSTORE_FILE") as? String)
        ?: System.getenv("ANDROID_KEYSTORE_FILE")
    val keystoreFile = keystorePath?.let(::File)?.takeIf { it.isFile }

    // AGP strips the native libraries and extracts their symbol tables with llvm-strip and
    // llvm-objcopy, which live in the NDK. Without one it prints "Unable to strip the following
    // libraries, packaging them as they are" and carries on, so `debugSymbolLevel` further down
    // cannot work at all (#451).
    //
    // Resolving it does not produce symbols here: the libraries are vendor-stripped and have
    // none to give (#455, and the comment on `debugSymbolLevel` below). What it does buy is a
    // build log that says what it means, and extraction that works by itself the moment
    // something extractable turns up.
    //
    // This project declares no NDK of its own because none of the native code is ours: it comes
    // from ML Kit, Sentry and CameraX. So use whichever NDK the machine already has — the GitHub
    // runner image points ANDROID_NDK_LATEST_HOME at one, and that directory's name IS the
    // version AGP wants — and leave AGP's default untouched when there is none, so a developer
    // machine without an NDK builds exactly as it did before. -PNDK_VERSION pins a specific one.
    val ndkFromEnvironment: String? =
        (System.getenv("ANDROID_NDK_LATEST_HOME") ?: System.getenv("ANDROID_NDK_HOME"))
            ?.let(::File)
            ?.takeIf { it.isDirectory }
            ?.name
            ?.takeIf { it.firstOrNull()?.isDigit() == true }
    ((project.findProperty("NDK_VERSION") as? String) ?: ndkFromEnvironment)
        ?.let { ndkVersion = it }

    defaultConfig {
        applicationId = "com.hivepulse.app"
        minSdk        = 26
        targetSdk     = 36
        versionCode   = buildVersionCode
        versionName   = buildVersionName
        testInstrumentationRunner = "com.hivepulse.app.HiltTestRunner"
        buildConfigField("String", "BASE_URL", "\"$baseUrl\"")
        buildConfigField("String", "SENTRY_DSN", "\"$sentryDsn\"")
        buildConfigField("String", "REVENUECAT_PUBLIC_KEY", "\"$revenueCatKey\"")
    }

    if (keystoreFile != null) {
        signingConfigs {
            create("release") {
                storeFile = keystoreFile
                storePassword = (project.findProperty("KEYSTORE_PASSWORD") as? String)
                    ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = (project.findProperty("KEY_ALIAS") as? String)
                    ?: System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = (project.findProperty("KEY_PASSWORD") as? String)
                    ?: System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // R8 shrinks and obfuscates the release build. Play Console flags a release without
            // it ("DEX code optimization below our threshold: obfuscation 0 %") and that can
            // limit visibility and publishing. The keep rules are in proguard-rules.pro; a rule
            // that is wrong breaks the release build only — never the debug build the tests run
            // against — so CI builds the release (assembleRelease) and the manual "Android
            // release smoke test" workflow runs it on an emulator before it goes anywhere.
            // Resource shrinking stays off: it is not what Play asked for, and it would need
            // its own look at strings that are only referenced by language.
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            signingConfig = signingConfigs.findByName("release")

            // Play warns that the bundle carries native code without debugging symbols, so a
            // crash or ANR inside it arrives as bare addresses. The native code is not ours --
            // ML Kit's barcode scanner, Sentry and CameraX ship the .so files -- but their stack
            // frames land in our crash reports all the same.
            //
            // This setting currently achieves nothing, and is kept deliberately: all six of those
            // libraries arrive already stripped from their vendors (.dynsym, no .symtab), so
            // there is nothing for AGP to extract and the warning cannot be cleared. Measured,
            // not assumed -- see #455 and android/CLAUDE.md. It stays because the day this app
            // ships native code of its own, or a dependency starts publishing unstripped
            // libraries, the symbols then travel without anybody remembering to ask for them.
            //
            // SYMBOL_TABLE, not FULL: the table gives function names, FULL adds files and line
            // numbers and a great deal of size. Line numbers in somebody else's source are of no
            // use without that source, so the larger file would buy nothing we could read.
            ndk {
                debugSymbolLevel = "SYMBOL_TABLE"
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions { jvmTarget = "17" }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += setOf(
                "META-INF/LICENSE.md",
                "META-INF/LICENSE-notice.md",
                "META-INF/AL2.0",
                "META-INF/LGPL2.1"
            )
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.04.01")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4")
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.8.5")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.51.1")
    ksp("com.google.dagger:hilt-android-compiler:2.51.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.google.code.gson:gson:2.11.0")

    // QR scanning (CameraX + ML Kit)
    // CameraX must stay >= 1.5: its libimage_processing_util_jni.so was aligned to 4 KB pages
    // up to 1.3.4, which Play reports as "does not support 16 KB". It was the only native
    // library in the bundle that failed — ML Kit and Sentry were already aligned.
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    implementation("androidx.camera:camera-camera2:1.5.3")
    implementation("androidx.camera:camera-lifecycle:1.5.3")
    implementation("androidx.camera:camera-view:1.5.3")

    // Sign in with Google. Credential Manager is the way in since the old Google Sign-In
    // SDK was retired; the googleid artifact is what turns a credential into an ID token.
    implementation("androidx.credentials:credentials:1.6.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.6.0")
    // 1.2.x is built against Kotlin 2.4 metadata and will not link against this project's 2.0.
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // In-app purchases (#17). The store sells, RevenueCat verifies the receipt and tells the
    // backend by webhook, and the backend stays the only thing that decides who has access.
    //
    // 10.30.5 and not 11.x, which is current: 11.x is compiled against Kotlin 2.2.21 and would
    // not link against this project's 2.0.21, the same way `googleid` 1.2.x does not. 10.30.5 is
    // the last release of the Kotlin-2.0 line -- its own bundled ProGuard rules say so
    // ("These rules target kotlinx.serialization 1.5.1 (Kotlin 2.0.21)"). Moving to 11.x is a
    // Kotlin upgrade first, which drags the Compose compiler plugin, KSP, Hilt and Room with it.
    //
    // No keep rules of ours: the AAR ships `proguard.txt` as consumer rules, covering the enum
    // names it reads reflectively and the Parcelable CREATOR fields. Checked in the published
    // artifact rather than assumed, because R8 runs in no test (see "R8" in CLAUDE.md).
    implementation("com.revenuecat.purchases:purchases:10.30.5")

    // Security (encrypted token storage)
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Image loading (QR image from backend)
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Runtime permissions helper
    implementation("com.google.accompanist:accompanist-permissions:0.37.0")

    // GPS / Location
    implementation("com.google.android.gms:play-services-location:21.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")

    // Map tiles for the community heatmap (OpenStreetMap, no API key)
    implementation("org.osmdroid:osmdroid-android:6.1.20")

    // Firebase (FCM push notifications — delivery activates when google-services.json has real credentials)
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Crash reporting (inert without a DSN)
    implementation("io.sentry:sentry-android:7.20.0")

    // Offline: local cache + queue for inspections recorded without a connection
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("androidx.hilt:hilt-work:1.2.0")
    ksp("androidx.hilt:hilt-compiler:1.2.0")

    debugImplementation("androidx.compose.ui:ui-tooling")

    // Unit testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("io.mockk:mockk:1.13.9")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("androidx.arch.core:core-testing:2.2.0")

    // Instrumented / screen tests
    androidTestImplementation(platform("androidx.compose:compose-bom:2025.04.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.51.1")
    kspAndroidTest("com.google.dagger:hilt-android-compiler:2.51.1")
    androidTestImplementation("io.mockk:mockk-android:1.13.9")
    androidTestImplementation("androidx.room:room-testing:2.6.1")
    androidTestImplementation("androidx.work:work-testing:2.9.1")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
