import SwiftUI

/// Word scales used when recording an inspection. The API stores numbers, beekeepers pick words:
/// varroa level 0 none, 1 low, 2 medium, 3 high; colony strength 1 weak, 2 medium, 3 strong.
enum InspectionScale {
    static let varroaLevels = [0, 1, 2, 3]
    static let strengthLevels = [1, 2, 3]

    static func varroaLabel(_ level: Int) -> String {
        NSLocalizedString("varroaLevel.\(level)", comment: "")
    }

    static func strengthLabel(_ level: Int) -> String {
        NSLocalizedString("strength.\(level)", comment: "")
    }
}

/// Glove-friendly number picker: every value of a small range is its own large button,
/// so a value is one tap away instead of many taps on the tiny system stepper.
/// Tapping the selected number again clears the field.
struct NumberChoiceGrid: View {
    let label: String
    let range: ClosedRange<Int>
    @Binding var value: Int?
    let identifierPrefix: String
    var perRow: Int = 4

    private var rows: [[Int]] {
        stride(from: range.lowerBound, through: range.upperBound, by: perRow).map { start in
            Array(start...min(start + perRow - 1, range.upperBound))
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
            ForEach(rows, id: \.first) { row in
                HStack(spacing: 8) {
                    ForEach(row, id: \.self) { number in
                        Button {
                            value = (value == number) ? nil : number
                        } label: {
                            Text("\(number)")
                                .font(.dmSans(20, weight: .bold, relativeTo: .title3))
                                .monospacedDigit()
                                .frame(maxWidth: .infinity, minHeight: 60)
                        }
                        .buttonStyle(.plain)
                        .background(value == number ? Color.hpAmber : Color.white)
                        .foregroundColor(.hpStone900)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(value == number ? Color.hpAmber : Color.hpStone200, lineWidth: 1.5)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .accessibilityIdentifier("\(identifierPrefix)\(number)")
                        .accessibilityAddTraits(value == number ? [.isSelected] : [])
                    }
                    // Keep the last row aligned with the rows above it
                    ForEach(0..<(perRow - row.count), id: \.self) { _ in
                        Color.clear.frame(maxWidth: .infinity, minHeight: 60)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

/// A segmented word choice for an optional value, with an explicit reset back to "not recorded".
struct ScaleChoice: View {
    let label: String
    let options: [Int]
    let title: (Int) -> String
    @Binding var value: Int?
    let identifier: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(label)
                Spacer()
                if value != nil {
                    Button { value = nil } label: {
                        Image(systemName: "xmark.circle").foregroundColor(.secondary)
                    }
                    .buttonStyle(.borderless)
                    .accessibilityLabel(NSLocalizedString("label.notRecorded", comment: ""))
                }
            }
            // -1 matches no segment, so nothing is highlighted until the beekeeper picks a word.
            Picker(label, selection: Binding(get: { value ?? -1 }, set: { value = $0 })) {
                ForEach(options, id: \.self) { option in
                    Text(title(option)).tag(option)
                }
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .accessibilityIdentifier(identifier)
        }
        .padding(.vertical, 4)
    }
}

/// Queen colour as tappable colour dots in the SICAMM year colours. Tapping the selected dot clears it.
struct QueenColorDots: View {
    static let options: [(key: String, color: Color)] = [
        ("white", Color.white),
        ("yellow", Color(hex: 0xFACC15)),
        ("red", Color(hex: 0xDC2626)),
        ("green", Color(hex: 0x16A34A)),
        ("blue", Color(hex: 0x2563EB)),
    ]

    @Binding var selection: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(NSLocalizedString("field.queenColor", comment: ""))
            HStack(spacing: 14) {
                ForEach(Self.options, id: \.key) { option in
                    dot(option.key, option.color)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func dot(_ key: String, _ color: Color) -> some View {
        let isSelected = selection == key
        return Button {
            selection = isSelected ? nil : key
        } label: {
            ZStack {
                Circle()
                    .fill(color)
                    .frame(width: 40, height: 40)
                Circle()
                    .strokeBorder(isSelected ? Color.hpAmber : Color(hex: 0xD6D3D1), lineWidth: isSelected ? 3 : 1)
                    .frame(width: 44, height: 44)
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(key == "white" || key == "yellow" ? .hpStone900 : .white)
                }
            }
            .frame(width: 44, height: 44)
        }
        .buttonStyle(.borderless)
        .accessibilityLabel(NSLocalizedString("queenColor.\(key)", comment: ""))
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .accessibilityIdentifier("queenColorDot.\(key)")
    }
}
