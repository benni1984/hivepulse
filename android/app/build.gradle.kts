plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
    id("com.google.gms.google-services")
}

configurations.all {
    resolutionStrategy.force("androidx.tracing:tracing:1.3.0-alpha02")
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

    // Google Play refuses an upload whose version code it has seen before, so the release
    // workflow passes a strictly increasing one. Local builds stay at 1.
    val buildVersionCode: Int = (project.findProperty("VERSION_CODE") as? String)?.toIntOrNull() ?: 1
    val buildVersionName: String = (project.findProperty("VERSION_NAME") as? String) ?: "1.0"

    // The upload keystore never lives in this repository. The release workflow writes it from
    // a secret and points at it; without it a release build is simply left unsigned, which is
    // enough for CI to prove it compiles.
    val keystorePath: String? = (project.findProperty("KEYSTORE_FILE") as? String)
        ?: System.getenv("ANDROID_KEYSTORE_FILE")
    val keystoreFile = keystorePath?.let(::File)?.takeIf { it.isFile }

    defaultConfig {
        applicationId = "com.hivepulse.app"
        minSdk        = 26
        targetSdk     = 36
        versionCode   = buildVersionCode
        versionName   = buildVersionName
        testInstrumentationRunner = "com.hivepulse.app.HiltTestRunner"
        buildConfigField("String", "BASE_URL", "\"$baseUrl\"")
        buildConfigField("String", "SENTRY_DSN", "\"$sentryDsn\"")
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
            // Shrinking is deliberately off for the first store release: Hilt, Room, Gson and
            // Sentry all need keep rules, and a rule that is wrong breaks the release build
            // only — never the debug build the tests run against. Worth turning on once there
            // is a device to smoke-test it on.
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release")

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
