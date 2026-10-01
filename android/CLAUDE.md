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
- Signing out clears cache and queue — the next account must not see them.
- Tests: `OfflineInspectionQueueTest`, `OfflineFallbackTest` (unit) and `OfflineInspectionTest`
  (instrumented, real Room, network mocked as offline).
- Build: `./gradlew assembleDebug` (from `android/`)
- Unit tests: `./gradlew test`
- UI tests (emulator/device): `./gradlew connectedAndroidTest`
- Single UI test class: `./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.hivepulse.app.ui.LoginScreenTest`

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

After any visible UI change (screen layout, colours, new fields), retake the affected Android screenshots and update the `src` props in `app/[locale]/help/[slug]/content/*.tsx` for all 4 locales.

Capture via emulator (AVD: `Pixel_9_API_35`, logged in as `demo@apiscan.app` / `demo1234`):
```bash
adb -s emulator-5554 exec-out screencap -p > public/docs/screenshots/android-<screen>.png
```
Screenshots live in `public/docs/screenshots/android-*.png`.

## Unit Tests — all passing

AuthViewModelTest, AuthRepositoryTest, ApiaryViewModelTest, ApiaryRepositoryTest, HiveRepositoryTest, HiveDetailViewModelTest, InspectionRepositoryTest, InspectionFormViewModelTest, QrBatchRepositoryTest, StatsRepositoryTest, QRViewModelTest, SettingsViewModelTest, DtoTest

## UI / Instrumented Tests — all passing

LoginScreenTest, RegisterScreenTest, ApiaryScreenTest, ApiaryWithDataTest, HiveDetailScreenTest, InspectionFormScreenTest, QRBatchListScreenTest, SettingsScreenTest

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
