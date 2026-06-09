---
paths:
  - "android/**/*.kt"
---

# Android Testing Rules

## MockK Exception Rule — IMPORTANT

Always throw `RuntimeException` (not plain `Exception`) in MockK stubs for instrumented tests.
Plain `Exception` gets wrapped in `UndeclaredThrowableException` → `e.message == null` → silent failure.

```kotlin
// CORRECT
coEvery { apiService.login(any()) } throws RuntimeException("Invalid credentials")
// WRONG
coEvery { apiService.login(any()) } throws Exception("Invalid credentials")
```

In ViewModels: use `e.message ?: e.cause?.message` for robustness.

## Hilt Rule Ordering

```kotlin
@get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
@get:Rule(order = 1) val clearStore  = object : ExternalResource() {
    override fun before() { hiltRule.inject(); tokenStore.clear() }
}
@get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()
```

## Waiting for Async Results

```kotlin
composeRule.waitUntil(timeoutMillis = 5_000) {
    onAllNodesWithText("...").fetchSemanticsNodes().isNotEmpty()
}
```

Do NOT rely on `waitForIdle()` alone.

## No Backend Needed for UI Tests

```kotlin
@UninstallModules(NetworkModule::class)
@BindValue val apiService: ApiService = mockk(relaxed = true)
```
