# iOS (Swift / SwiftUI)

- Minimum deployment: iOS 17
- UI: SwiftUI
- QR scanning: `AVFoundation` / `DataScannerViewController`
- Networking: `URLSession` async/await
- Local persistence: SwiftData
- Build: open `ios/ApiScan.xcodeproj` in Xcode (requires macOS)
- Run tests: Cmd+U in Xcode, or push to CI (see below)

## CI

- Job: `ios` in `.github/workflows/ci.yml` — path-filtered, runs on `macos-latest`
- XcodeGen regenerates `.xcodeproj` from `ios/project.yml` on the runner
- `xcodebuild test` runs `ApiScanTests` + `ApiScanUITests` on iPhone 16 simulator
- Results: `ios-test-results.xcresult` artifact

You can write test files on any OS and let CI run them — no local macOS needed.

## Mock Infrastructure for UI Tests

`ios/ApiScan/Testing/MockURLProtocol.swift` (`#if DEBUG` only):
- Intercepts all `URLSession` requests via `URLSessionConfiguration.protocolClasses`
- Handler sets: `authenticatedHandlers`, `apiaryWithHiveHandlers`, `unauthenticatedHandlers`

| Launch Arg | Effect |
|------------|--------|
| `-resetKeychain` | Clears tokens — app starts at Login |
| `-mockAuthenticated` | Clears keychain, sets fake token, empty-list mocks — starts at Apiaries |
| `-mockApiaryWithHive` | Same + returns one apiary with one hive |
| `-mockServer` | Mock only, no token — starts at Login, auth calls return real-looking responses |

Do NOT mix `-mockAuthenticated`/`-mockApiaryWithHive` with `-resetKeychain`.

## Pattern: Handler Order

Most-specific URL patterns must come first:
```swift
("hives/h-1/inspections", ...)  // before "hives/h-1"
("apiaries/a-1/hives",    ...)  // before "apiaries/a-1"
("apiaries/a-1",          ...)  // before "apiaries"
("apiaries",              ...)  // catch-all
```

## Unit Tests (ApiScanTests/)

AuthViewModelTests, ApiaryViewModelTests, HiveViewModelTests, InspectionViewModelTests, DTOTests — all passing in CI.

## UI Tests (ApiScanUITests/)

LoginUITests, RegisterUITests, ApiaryListUITests, HiveDetailUITests, InspectionFormUITests, SettingsUITests, QRBatchListUITests — all passing in CI.

Screens: Login, Register, ApiaryList, ApiaryDetail, ApiaryForm, HiveDetail, HiveInitialize, HiveQR, InspectionForm, InspectionDetail, QRScanner, QRBatchList, HiveStats, Settings.
