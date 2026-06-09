# Android (Kotlin / Jetpack Compose)

- Min SDK: 26 (Android 8), Target SDK: 35
- UI: Jetpack Compose + Material Design 3
- QR scanning: ML Kit Barcode Scanning
- Networking: Retrofit + OkHttp
- Local persistence: Room
- Build: `./gradlew assembleDebug` (from `android/`)
- Unit tests: `./gradlew test`
- UI tests (emulator/device): `./gradlew connectedAndroidTest`
- Single UI test class: `./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.apiscan.app.screen.LoginScreenTest`

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
