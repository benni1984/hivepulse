# Android (Kotlin / Jetpack Compose)

- Min SDK: 26 (Android 8), Target SDK: 35
- UI: Jetpack Compose + Material Design 3
- QR scanning: ML Kit Barcode Scanning
- Networking: Retrofit + OkHttp
- Local persistence: auth tokens in `TokenStore` (`data/local/TokenStore.kt`, Keystore-backed), plus the
  offline layer in `data/local/` (Room): a cache of apiaries, hives, inspections and custom fields, and a
  queue of inspections recorded without a connection

## Offline — IMPORTANT

At the apiary there is usually no signal, so the field path works without one:

- **Reads** (`ApiaryRepository`, `HiveRepository`, `InspectionRepository`) try the network first and
  fall back to `OfflineCache` **only** when the failure is an `IOException` (see `Throwable.isOffline()`).
  An HTTP error (401, 404, 422) must keep surfacing — stale data must never hide a real answer.
- **Recording an inspection** always goes through `OfflineInspectionQueue`: the entry is written to Room
  *before* the request, carries a `client_id` the server uses to ignore a repeated POST (api-contract.md),
  and is deleted only once the server confirmed it. `InspectionSyncWorker` (WorkManager, network
  constraint, exponential backoff) uploads what is waiting.
- Queued visits appear in the hive's list marked "Waiting to upload" (`offline_pending_upload`), cannot be
  opened or deleted, and carry the id prefix `pending:` (`InspectionOut.isPending()`).
- **Signing out** clears cache and queue. **A session that ends by itself does not** (#467, #469):
  the refresh token simply ran out, the same beekeeper is about to sign back in, and a queued
  inspection exists nowhere else. What keeps one account's data from the next is `OfflineOwner`,
  checked in `AuthRepository.store()` on every way in — it clears both when a *different* user signs
  in. The owner has its own preferences file, never `TokenStore`, which is cleared the moment a
  session ends.
- `SessionAuthenticator` (its own class, so a test can reach it — the instrumented tests uninstall
  `NetworkModule`) renews the access token and tells a dead session apart from a bad connection: a
  **401 from the refresh call** clears the tokens and emits `SessionEvents.expired`, which
  `MainActivity` turns into a message and a return to the sign-in screen. Any other failure leaves
  the session alone, because at the apiary there is usually no signal.
- Tests: `OfflineInspectionQueueTest`, `OfflineFallbackTest` (unit) and `OfflineInspectionTest`
  (instrumented, real Room, network mocked as offline).
- Build: `./gradlew assembleDebug` (from `android/`)
- Unit tests: `./gradlew test`
- UI tests (emulator/device): `./gradlew connectedAndroidTest`
- Single UI test class: `./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.hivepulse.app.ui.LoginScreenTest`

## R8 (shrinking and obfuscation) — IMPORTANT

The release build runs R8 (`isMinifyEnabled = true`); Play Console flags a release with 0 %
obfuscation ("DEX code optimization below our threshold") and can limit visibility and
publishing for it. The debug build, the unit tests and the instrumented tests do **not** run R8,
so a wrong or missing keep rule is invisible to all of them.

- Rules are in `app/proguard-rules.pro`. Libraries bring their own; only ours go there.
- **Anything serialised with Gson lives in `data/api/`** (request and response classes, and the
  classes stored as JSON in Room). The rules keep the field names of that package, because Gson
  matches by field name and the offline cache and queue store the same JSON. A class somewhere
  else would have its fields renamed; `ProguardRulesTest` fails when that happens.
- A new library that reads classes by name or by field (reflection, protobuf, `Class.forName`) needs
  a rule or its consumer rules; check its README.
- CI builds the release variant (`assembleRelease` in the Android job) and the **"Android release
  smoke test"** workflow installs it on an emulator and walks the screens against staging. It
  starts by itself for changes to the rules, the build script and `data/api`, and by hand
  (Actions → Android release smoke test) before a release goes to a track.
- Stack traces: the mapping file travels inside the `.aab`, so Play Console deobfuscates crashes
  by itself. **Sentry needs its own copy**, and for six weeks it had none — crash reporting has
  been on for the release since 2026-10-01 and every Kotlin frame read `a.b.c.d()`. Since #452 the
  Sentry Gradle plugin (`io.sentry.android.gradle`) uploads the mapping, configured in
  `app/build.gradle.kts` for org `multihead-9n`, project `hivepulse-android`, region
  `https://de.sentry.io`.
  - **The upload is gated on `SENTRY_AUTH_TOKEN`**, which `android-release.yml` passes from a
    secret. Without it nothing is uploaded and nothing fails: CI builds the release variant on
    every push and has no token, and that build must stay byte-for-byte what it was.
  - Everything else the plugin can do is off on purpose — `autoInstallation` would pick its own
    SDK version over the one in `dependencies`, and `tracingInstrumentation` rewrites bytecode.
    This adds an upload step and nothing else. `backend/tests/test_sentry_symbolication.py`
    pins all of it, including that a failed upload is never silent.
  - The iPhone has the same arrangement in `testflight.yml`: the dSYMs go to `hivepulse-ios`
    after the App Store upload, so Sentry can never cost a release, and deliberately without
    `continue-on-error`, because a quiet failure is how this went unnoticed in the first place.
- **Play's "contains native code, and you've not uploaded debug symbols" warning cannot be
  cleared. Decided, not open (#455).** Three attempts went into it, so do not start a fourth:
  #418 set `debugSymbolLevel = "SYMBOL_TABLE"`, #451 found that AGP needs the NDK's `llvm-strip`
  and only *warns* when it cannot find one — and with the NDK resolved, the bundle still had no
  symbols. The reason is upstream: this app compiles no native code of its own, and all six
  libraries arrive **already stripped** from their vendors. Read from the published AARs and from
  the bundle Play received for 1.0.4, each of `libbarhopper_v3.so` (ML Kit), `libsentry.so` and
  `libsentry-android.so`, `libandroidx.graphics.path.so`, `libimage_processing_util_jni.so` and
  `libsurface_util_jni.so` (CameraX) carries `.dynsym` and no `.symtab`. `SYMBOL_TABLE` lifts
  `.symtab`; where there is none, nothing can be lifted, NDK or no NDK. A crash *inside* those
  six therefore reads as bare addresses in Play and in Sentry, and that is the end of it.
  - What the release still does: it resolves the runner's NDK (nothing is downloaded, the image
    ships one) so extraction works the moment there is anything to extract, and
    `scripts/check_native_debug_symbols.py` asks each packaged library whether it has a
    `.symtab` **before** demanding a symbol file for it. Add native code of our own, or take a
    dependency that publishes unstripped libraries, and the symbols either arrive or the release
    fails. Until then the check reports what it saw and lets the release through.
  - Our own Kotlin frames are a different matter and are *not* fine: see the mapping note above
    and #452.

## Design System Reference — IMPORTANT

HivePulse uses a consistent visual language across web and mobile. For colour and spacing reference, open **`hivepulse-redesign/bundle.html`** in a browser before implementing any new screen or component.

Key values — already seeded in `ui/theme/Color.kt` and `ui/theme/Theme.kt`:

| Token | Value | Compose name |
|-------|-------|-------------|
| Primary/amber | `#f59e0b` | `Amber500` |
| Pressed/hover | `#d97706` | `Amber600` |
| Nav background | `#0f2d1c` | `Forest900` |
| Page background | `#fafaf9` | `Stone50` |
| Card border | `#e7e5e4` | `Stone200` |
| Font | DM Sans | `DmSans` (in `Type.kt`) |

- Use `MaterialTheme.colorScheme.*` tokens, not hardcoded hex values
- Bottom nav: `Forest900` container, `Amber500` selected indicator (see `MainActivity.kt`)
- Glove-friendly UX: use `NumberChoiceGrid` (small fixed ranges such as 0–10 frames — one tap per value, 68dp buttons),
  `NumberStepper` (open-ended numbers) and `ToggleButtonGroup` from `ui/common/Components.kt` instead of text fields and dropdowns

## Help Page Screenshots — IMPORTANT

After a visible UI change the screenshots are retaken **by the "Update help page screenshots" workflow** (see the root `CLAUDE.md`, "Screenshots"); `scripts/android-screenshots.py` drives the app by its wording, so keep it in step when a label or the first screen changes. By hand, only for a new screen that is not captured yet: add it to the script (best effort), then reference it in the help pages for all 4 locales.

Capture via emulator (AVD: `Pixel_9_API_35`, logged in as `demo@apiscan.app` / `demo1234`):
```bash
adb -s emulator-5554 exec-out screencap -p > public/docs/screenshots/android-<screen>.png
```
Screenshots live in `public/docs/screenshots/android-*.png`.

## Unit Tests — all passing

AuthViewModelTest, AuthRepositoryTest, ApiaryViewModelTest, ApiaryRepositoryTest, HiveRepositoryTest, HiveDetailViewModelTest, InspectionRepositoryTest, InspectionFormViewModelTest, QrBatchRepositoryTest, StatsRepositoryTest, QRViewModelTest, SettingsViewModelTest, SupporterViewModelTest, FeedbackPromptRuleTest, HornetMapCameraTest, DtoTest

## UI / Instrumented Tests — all passing

LoginScreenTest, RegisterScreenTest, ApiaryScreenTest, ApiaryWithDataTest, HiveDetailScreenTest, InspectionFormScreenTest, QRBatchListScreenTest, SettingsScreenTest, SupporterScreenTest, FeedbackPromptScreenTest, FeedbackPromptEmptyScreenTest, HornetMapScreenTest

## IMPORTANT: MockK Exception Rule

Always throw `RuntimeException` (not plain `Exception`) in MockK stubs for instrumented tests.

Plain `Exception` gets wrapped in `UndeclaredThrowableException` by the Java proxy, causing `e.message == null` silently — no error banner, no error state.

```kotlin
// CORRECT
coEvery { apiService.login(any()) } throws RuntimeException("Invalid credentials")

// WRONG — wraps to UndeclaredThrowableException, message is null
coEvery { apiService.login(any()) } throws Exception("Invalid credentials")
```

In ViewModels use `e.message ?: e.cause?.message` for robustness.

## IMPORTANT: Hilt Test Rule Ordering

```kotlin
@get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
@get:Rule(order = 1) val clearStore  = object : ExternalResource() {
    override fun before() { hiltRule.inject(); tokenStore.clear() }
}
@get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()
```

Order 1 injects `@Inject` fields before the activity starts at order 2.

## IMPORTANT: Verifying the Hilt graph for instrumented tests

`./gradlew compileDebugAndroidTestKotlin` compiles the test sources but does **not** build the
Hilt component graph, so a missing binding only shows up in CI. Before pushing changes that add
an injected dependency, run:

```bash
./gradlew :app:hiltJavaCompileDebugAndroidTest
```

Anything the tests still need must live **outside** `NetworkModule` — instrumented tests uninstall
it (see below), so a provider placed there vanishes for every one of them. That is why `Gson` has
its own `SerializationModule`.

## UI Tests: No Backend Needed

Replace the entire network stack:
```kotlin
@UninstallModules(NetworkModule::class)
// ...
@BindValue val apiService: ApiService = mockk(relaxed = true)
```

## Guided Tour

The first successful sign-in or registration on a device routes to `GuidedTourScreen` (`guided_tour?fromSettings=false`) instead of the apiary list; `OnboardingStore.hasSeenGuidedTour` remembers it. Settings has "Show guided tour again". **UI tests that sign in and expect "My Apiaries" must set `onboardingStore.hasSeenGuidedTour = true` in their setup rule** (see `LoginScreenTest`); `GuidedTourScreenTest` covers the tour itself.

## Waiting for Async Results

```kotlin
composeRule.waitUntil(timeoutMillis = 5_000) {
    onAllNodesWithText("...").fetchSemanticsNodes().isNotEmpty()
}
```

Do not rely on `waitForIdle()` alone for ViewModel coroutine results.
