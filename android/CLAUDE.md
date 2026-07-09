# Android (Kotlin / Jetpack Compose)

- Min SDK: 26 (Android 8), Target SDK: 35
- UI: Jetpack Compose + Material Design 3
- QR scanning: ML Kit Barcode Scanning
- Networking: Retrofit + OkHttp
- Local persistence: none — data is fetched live from the backend on each screen; only auth tokens are persisted, in `TokenStore` (`data/local/TokenStore.kt`, Keystore-backed encrypted storage)
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
- Glove-friendly UX: use `NumberStepper` and `ToggleButtonGroup` from `ui/common/Components.kt` instead of text fields and dropdowns for all integer and enum inputs

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

## UI Tests: No Backend Needed

Replace the entire network stack:
```kotlin
@UninstallModules(NetworkModule::class)
// ...
@BindValue val apiService: ApiService = mockk(relaxed = true)
```

## Waiting for Async Results

```kotlin
composeRule.waitUntil(timeoutMillis = 5_000) {
    onAllNodesWithText("...").fetchSemanticsNodes().isNotEmpty()
}
```

Do not rely on `waitForIdle()` alone for ViewModel coroutine results.
