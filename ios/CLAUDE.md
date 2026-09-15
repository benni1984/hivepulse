# iOS (Swift / SwiftUI)

- Minimum deployment: iOS 17
- UI: SwiftUI
- QR scanning: `AVFoundation` / `DataScannerViewController`
- Networking: `URLSession` async/await
- Local persistence: none — data is fetched live from the backend on each screen; only auth tokens are persisted, via `KeychainService` (`Services/KeychainService.swift`)
- Build: open `ios/HivePulse.xcodeproj` in Xcode (requires macOS)
- Run tests: Cmd+U in Xcode, or push to CI (see below)

## Design System

Same tokens as web/Android (`hivepulse-redesign/bundle.html`), defined in `HivePulse/Theme/`:

- `Theme.swift` — `Color.hpAmber` / `hpAmberDark` / `hpForest` / `hpStone50…900` / `hpGreen` / `hpRed`; `Font.dmSans(size, weight:, relativeTo:)`; `HivePulseAppearance.apply()` styles the navigation bar (stone-50, DM Sans titles) and tab bar (forest green, amber selection)
- `Components.swift` — `HivePulseLogo`, `HivePulseWordmark`, `HPPrimaryButtonStyle`, `HPStatPill`, `.hpCard()`, `.hpInputField()`, `.hpScreenBackground()`
- DM Sans lives in `Resources/Fonts` and is registered via `UIAppFonts` in `Info.plist` (`ThemeTests` checks this)
- Use the tokens instead of `.orange` / system greys; keep semantic status colours (mood, hornet status, linked) as they are
- Amber text/icons on light backgrounds use `hpAmberDark` for contrast; `hpAmber` is for fills and the wordmark

## TestFlight

`.github/workflows/testflight.yml` imports our own **Apple Distribution certificate** from secrets into a temporary keychain, fetches the App Store profile with `fastlane sigh`, archives the Release build with **manual** distribution signing and uploads it via `xcodebuild -exportArchive` (`destination: upload`, manual style).

- Do not switch the archive back to automatic signing: every fresh runner would create another "Created via API" development certificate (Apple caps the number per team) and it requires a registered device

- Why not cloud-managed distribution signing: the cloud signer writes the account holder name ("Benjamin Müller") into the designated requirement in a different Unicode form than the certificate, so the signature fails its own requirement and App Store Connect rejects it with **ITMS-90035**. The workflow now runs `codesign --verify --strict` on an exported IPA before uploading and fails early if the requirement is not satisfied
- Extra secrets: `IOS_DIST_CERT_P12_BASE64`, `IOS_DIST_CERT_P12_PASSWORD` (certificate valid for one year — renew by creating a new CSR/certificate and replacing both secrets)

- Do not archive unsigned (`CODE_SIGNING_ALLOWED=NO`) — the upload is then rejected as "Invalid Signature"
- App Store validation requires `UISupportedInterfaceOrientations` in `Info.plist` (checked by `AppBundleTests`) It runs on manual dispatch and on pushes to `main` that touch `ios/HivePulse/**` or `ios/project.yml`.

- Secrets: `APPLE_TEAM_ID`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY_P8` (full `.p8` contents; key role Admin). Without them the job logs a notice and succeeds without building
- Build number = `github.run_number` via `CURRENT_PROJECT_VERSION` (Info.plist `CFBundleVersion` is `$(CURRENT_PROJECT_VERSION)`); bump `CFBundleShortVersionString` for a new marketing version
- The App Store Connect app record (bundle ID `com.hivepulse.app`) must exist before the first upload

## App icon & App Store metadata

- `Resources/Assets.xcassets/AppIcon.appiconset` holds a single opaque 1024×1024 PNG (HivePulse hex on stone-50, same as the Android launcher icon); `project.yml` sets `ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon`. The PNG must not have an alpha channel or App Store Connect rejects the upload
- `Info.plist` declares `ITSAppUsesNonExemptEncryption = false` (HTTPS only) plus the camera/location usage texts — `AppBundleTests` guards all of these
- Custom glyphs without a fitting SF Symbol are drawn in code as template images (e.g. `Theme/HornetIcon.swift`, mirrored by Android's `ic_hornet.xml`)

## Design screenshots from CI

`HivePulseUITests/ScreenshotUITests` navigates the main screens with mock data and writes PNGs to `$SCREENSHOT_DIR`. The `ios` CI job sets it and uploads them as the **`ios-screenshots`** artifact — download with `gh run download <run-id> -n ios-screenshots` to review the UI without a Mac.

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
| `-mockAuthenticatedSupporter` | Authenticated supporter; Members shows the community heatmap with two mock cells |
| `-mockQrBatch` | Authenticated + one QR batch (`b-1`) whose PDF can be downloaded |
| `-guidedTourSeen YES` / `NO` | Overrides the "guided tour already shown" flag for this launch (UserDefaults argument domain) |
| `-mockServer` | Mock only, no token — starts at Login, auth calls return real-looking responses |

`-resetKeychain` can be combined with the mock arguments — the keychain is cleared first, then the mock token is set (most UI tests do this).

## Guided Tour

After the first successful sign-in or registration on a device, `AuthViewModel.showGuidedTour` presents `GuidedTourView` as a full-screen cover over the tabs; `OnboardingStore` (UserDefaults) remembers it, and Settings has "Show guided tour again". **UI tests that sign in or register and expect the apiary list must pass `-guidedTourSeen YES`** (see `RegisterUITests`); `GuidedTourUITests` covers the tour.

## Pattern: Handler Order

Most-specific URL patterns must come first:
```swift
("hives/h-1/inspections", ...)  // before "hives/h-1"
("apiaries/a-1/hives",    ...)  // before "apiaries/a-1"
("apiaries/a-1",          ...)  // before "apiaries"
("apiaries",              ...)  // catch-all
```

## Unit Tests (HivePulseTests/)

AuthViewModelTests, ApiaryViewModelTests, HiveViewModelTests, InspectionViewModelTests, AdminViewModelTests, HornetViewModelTests, HiveQRViewTests, QRBatchDetailViewModelTests, OverviewStatsViewModelTests, ForgotPasswordViewModelTests, GuidedTourTests, CommunityHeatmapTests, FieldDefinitionsViewModelTests, HornetIconTests, AppBundleTests, ThemeTests, DTOTests, APIClientTests — all passing in CI.

## UI Tests (HivePulseUITests/)

LoginUITests, RegisterUITests, ApiaryListUITests, HiveDetailUITests, InspectionFormUITests, SettingsUITests, QRBatchListUITests, QRBatchDetailUITests, OverviewStatsUITests, ForgotPasswordUITests, GuidedTourUITests, FieldDefinitionsUITests, HornetUITests, MembersUITests, ScreenshotUITests — all passing in CI.

Screens: Login, Register, ApiaryList, ApiaryDetail, ApiaryForm, HiveDetail, HiveInitialize, HiveQR, InspectionForm, InspectionDetail, QRScanner, QRBatchList, QRBatchDetail, HiveStats, OverviewStats, ForgotPassword, GuidedTour, Members (community heatmap), FieldDefinitions (user scope from Settings, apiary scope from the apiary toolbar), Settings.
