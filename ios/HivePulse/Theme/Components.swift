import SwiftUI

// MARK: - Logo

/// Amber hex badge with honeycomb cells and a stats sparkline — same drawing as the web
/// `#s-hivepulse` symbol and Android's ic_hivepulse (44×44 viewBox).
struct HivePulseLogo: View {
    var size: CGFloat = 48

    var body: some View {
        Canvas { context, canvasSize in
            let s = canvasSize.width / 44

            func point(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

            func polygon(_ points: [(CGFloat, CGFloat)]) -> Path {
                var path = Path()
                path.move(to: point(points[0].0, points[0].1))
                for p in points.dropFirst() { path.addLine(to: point(p.0, p.1)) }
                path.closeSubpath()
                return path
            }

            context.fill(
                polygon([(22, 2), (39.12, 12), (39.12, 32), (22, 42), (4.88, 32), (4.88, 12)]),
                with: .color(Color.hpAmber)
            )
            context.stroke(
                polygon([(22, 4.5), (37, 13.5), (37, 30.5), (22, 39.5), (7, 30.5), (7, 13.5)]),
                with: .color(Color.white.opacity(0.12)),
                lineWidth: 1 * s
            )

            let cells: [[(CGFloat, CGFloat)]] = [
                [(22, 11), (26.76, 13.75), (26.76, 19.25), (22, 22), (17.24, 19.25), (17.24, 13.75)],
                [(17.24, 19.25), (22, 22), (22, 27.5), (17.24, 30.25), (12.48, 27.5), (12.48, 22)],
                [(26.76, 19.25), (31.52, 22), (31.52, 27.5), (26.76, 30.25), (22, 27.5), (22, 22)],
            ]
            for cell in cells {
                let path = polygon(cell)
                context.fill(path, with: .color(Color.white.opacity(0.18)))
                context.stroke(path, with: .color(Color.white), style: StrokeStyle(lineWidth: 1.4 * s, lineJoin: .round))
            }

            var spark = Path()
            spark.move(to: point(6, 27))
            spark.addCurve(to: point(20, 25), control1: point(12, 27), control2: point(15, 24))
            spark.addCurve(to: point(31, 15), control1: point(25, 26), control2: point(27, 17))
            spark.addCurve(to: point(36.5, 13.5), control1: point(34, 14), control2: point(36.5, 13.5))
            context.stroke(
                spark,
                with: .color(Color.white.opacity(0.9)),
                style: StrokeStyle(lineWidth: 1.5 * s, lineCap: .round, lineJoin: .round)
            )
            context.fill(
                Path(ellipseIn: CGRect(x: 4.5 * s, y: 25.5 * s, width: 3 * s, height: 3 * s)),
                with: .color(Color.white.opacity(0.55))
            )
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// "Hive" + amber "Pulse" — always one word, capital H and P.
struct HivePulseWordmark: View {
    var size: CGFloat = 28

    var body: some View {
        (Text("Hive").foregroundColor(.hpStone900) + Text("Pulse").foregroundColor(.hpAmber))
            .font(.dmSans(size, weight: .extraBold, relativeTo: .largeTitle))
            .accessibilityLabel("HivePulse")
    }
}

// MARK: - Buttons

/// Amber call-to-action, 52pt tall (glove-friendly), dark text for contrast on amber.
struct HPPrimaryButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.dmSans(16, weight: .bold, relativeTo: .headline))
            .foregroundColor(.hpStone900)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(configuration.isPressed ? Color.hpAmberDark : Color.hpAmber)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .opacity(isEnabled ? 1 : 0.45)
    }
}

// MARK: - Cards, inputs, backgrounds

extension View {
    /// White card with a stone-200 hairline border and 16pt corners.
    func hpCard(padding: CGFloat = 16, alignment: Alignment = .leading) -> some View {
        self
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: alignment)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.hpStone200, lineWidth: 1))
    }

    /// Text input look used on the auth screens.
    func hpInputField() -> some View {
        self
            .font(.dmSans(16))
            // Explicit text colour: the field background is always white, so system label colours
            // (white in Dark Mode) would make typed text invisible.
            .foregroundColor(.hpStone900)
            .tint(.hpAmberDark)
            .padding(.horizontal, 14)
            .frame(minHeight: 50)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).stroke(Color.hpStone200, lineWidth: 1))
    }

    /// Stone-50 page background behind lists, forms and scroll views.
    func hpScreenBackground() -> some View {
        self
            .scrollContentBackground(.hidden)
            .background(Color.hpStone50.ignoresSafeArea())
    }
}

// MARK: - Stat pill

/// Two-row stat pill: label + tinted icon, then the big number (same layout as web `.dash-stat-pill`).
struct HPStatPill: View {
    let label: String
    let value: String
    let systemImage: String
    var iconColor: Color = .hpAmberDark

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 4) {
                Text(label)
                    .font(.dmSans(12, weight: .medium, relativeTo: .caption))
                    .foregroundColor(.hpStone500)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                Spacer(minLength: 4)
                Image(systemName: systemImage)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(iconColor)
                    .frame(width: 24, height: 24)
                    .background(iconColor.opacity(0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                    .accessibilityHidden(true)
            }
            Text(value)
                .font(.dmSans(24, weight: .bold, relativeTo: .title2))
                .foregroundColor(.hpStone900)
        }
        .hpCard(padding: 12)
    }
}
