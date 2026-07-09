# iOS (Swift / SwiftUI)

- Minimum deployment: iOS 17
- UI: SwiftUI
- QR scanning: `AVFoundation` / `DataScannerViewController`
- Networking: `URLSession` async/await
- Local persistence: none — data is fetched live from the backend on each screen; only auth tokens are persisted, via `KeychainService` (`Services/KeychainService.swift`)
- Build: open `ios/HivePulse.xcodeproj` in Xcode (requires macOS)
- Run tests: Cmd+U in Xcode, or push to CI (see below)

## CI

- Job: `ios` in `.github/workflows/ci.yml` — path-filtered, runs on `macos-latest`
- XcodeGen regenerates `.xcodeproj` from `ios/project.yml` on the runner
- `xcodebuild test` runs `HivePulseTests` + `HivePulseUITests` on an iPhone 16 simulator, falling back to the newest available plain iPhone simulator if iPhone 16 isn't on the runner image
- Results: `ios-test-results.xcresult` artifact

You can write test files on any OS and let CI run them — no local macOS needed.

## Mock Infrastructure for UI Tests

`ios/HivePulse/Testing/MockURLProtocol.swift` (`#if DEBUG` only):
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

## Unit Tests (HivePulseTests/)

AuthViewModelTests, ApiaryViewModelTests, HiveViewModelTests, InspectionViewModelTests, AdminViewModelTests, HornetViewModelTests, HiveQRViewTests, DTOTests, APIClientTests — all passing in CI.

## UI Tests (HivePulseUITests/)

LoginUITests, RegisterUITests, ApiaryListUITests, HiveDetailUITests, InspectionFormUITests, SettingsUITests, QRBatchListUITests, HornetUITests, MembersUITests — all passing in CI.

Screens: Login, Register, ApiaryList, ApiaryDetail, ApiaryForm, HiveDetail, HiveInitialize, HiveQR, InspectionForm, InspectionDetail, QRScanner, QRBatchList, HiveStats, Settings.
