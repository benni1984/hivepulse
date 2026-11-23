import CoreLocation

/// One fix, once, with no subscription left running.
///
/// Lived in `ApiaryFormView.swift` until the hornet map needed it too (#555). Two copies of a
/// `CLLocationManager` wrapper would have been two places to get the delegate lifetime wrong.
final class OneTimeLocator: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<CLLocation?, Never>?

    /// Asks, prompting for permission if it has not been granted yet.
    ///
    /// For a screen where the beekeeper pressed a button that says "use my location" — the
    /// apiary form, the trap form. The prompt is the answer to what they asked for.
    func locate() async -> CLLocation? {
        await withCheckedContinuation { cont in
            continuation = cont
            manager.delegate = self
            manager.requestWhenInUseAuthorization()
            manager.requestLocation()
        }
    }

    /// Asks only if permission is already there, and answers `nil` otherwise without a prompt.
    ///
    /// For a screen that merely *benefits* from knowing — the hornet map centring itself on the
    /// beekeeper. A permission prompt that appears because somebody opened a map is a prompt
    /// they refuse, and a refusal is remembered app-wide, including for the report form where
    /// the location genuinely is the point.
    func locateIfAlreadyAllowed() async -> CLLocation? {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            break
        default:
            return nil
        }
        return await withCheckedContinuation { cont in
            continuation = cont
            manager.delegate = self
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        continuation?.resume(returning: locations.first)
        continuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        continuation?.resume(returning: nil)
        continuation = nil
    }
}
