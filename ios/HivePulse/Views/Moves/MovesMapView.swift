import MapKit
import SwiftUI

/// The journeys of hives: a line per hive through the places it was taken to, numbered in order.
struct MovesMapView: View {
    let routes: [MoveRoute]
    @State private var position: MapCameraPosition

    private static let palette: [Color] = [.hpAmberDark, .teal, .purple, .red, .blue, .green, .orange, .cyan]

    init(routes: [MoveRoute]) {
        self.routes = routes
        _position = State(initialValue: MoveRoutes.region(fitting: routes).map { .region($0) } ?? .automatic)
    }

    static func color(for route: MoveRoute) -> Color {
        palette[route.colorIndex % palette.count]
    }

    var body: some View {
        Map(position: $position) {
            ForEach(routes) { route in
                if route.points.count > 1 {
                    MapPolyline(coordinates: route.points.map(\.coordinate))
                        .stroke(Self.color(for: route), style: StrokeStyle(lineWidth: 3, dash: [6, 6]))
                }
                ForEach(route.points, id: \.order) { point in
                    Annotation(point.name, coordinate: point.coordinate) {
                        MovePin(order: point.order, color: Self.color(for: route))
                    }
                }
            }
        }
        .frame(height: 320)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .accessibilityIdentifier("movesMap")
    }
}

private struct MovePin: View {
    let order: Int
    let color: Color

    var body: some View {
        Text(order == 0 ? "⌂" : String(order))
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(.white)
            .frame(width: 24, height: 24)
            .background(color)
            .clipShape(Circle())
            .overlay(Circle().stroke(Color.white, lineWidth: 2))
            .shadow(radius: 2)
    }
}

/// One move in a list: when, from where to where, for which forage, and a note.
struct MoveRow: View {
    let move: HiveMoveOut
    var showHive = false

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(move.movedOn).font(.dmSans(16, weight: .bold, relativeTo: .headline))
                if let forage = move.forage {
                    Text(Forage.label(for: forage))
                        .font(.caption)
                        .padding(.horizontal, 8).padding(.vertical, 2)
                        .background(Color.hpAmber.opacity(0.15))
                        .foregroundColor(.hpAmberDark)
                        .cornerRadius(6)
                }
            }
            if showHive {
                Text(move.hiveName).font(.subheadline)
            }
            Text(move.from.name + " → " + move.to.name)
                .font(.subheadline).foregroundColor(.secondary)
            if let note = move.note, !note.isEmpty {
                Text(note).font(.caption).foregroundColor(.secondary)
            }
            if move.to.latitude == nil || move.to.longitude == nil {
                Text(NSLocalizedString("moves.noPosition", comment: ""))
                    .font(.caption).foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}
