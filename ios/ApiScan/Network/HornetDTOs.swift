import Foundation

// MARK: - Stats

struct HornetStats: Codable {
    let totalCaught: Int
    let totalNests: Int
    let destroyedNests: Int
    let pendingSightings: Int
    let confirmedSightings: Int
    let totalTraps: Int

    init(totalCaught: Int, totalNests: Int, destroyedNests: Int,
         pendingSightings: Int, confirmedSightings: Int, totalTraps: Int = 0) {
        self.totalCaught = totalCaught
        self.totalNests = totalNests
        self.destroyedNests = destroyedNests
        self.pendingSightings = pendingSightings
        self.confirmedSightings = confirmedSightings
        self.totalTraps = totalTraps
    }

    enum CodingKeys: String, CodingKey {
        case totalCaught = "total_caught"
        case totalNests = "total_nests"
        case destroyedNests = "destroyed_nests"
        case pendingSightings = "pending_sightings"
        case confirmedSightings = "confirmed_sightings"
        case totalTraps = "total_traps"
    }
}

// MARK: - Catches

struct HornetCatchCreate: Codable {
    let latitude: Double?
    let longitude: Double?
    let count: Int
    let reporterName: String?

    enum CodingKeys: String, CodingKey {
        case latitude, longitude, count
        case reporterName = "reporter_name"
    }
}

struct HornetCatchOut: Codable {
    let id: String
    let count: Int
    let latitude: Double?
    let longitude: Double?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, count, latitude, longitude
        case createdAt = "created_at"
    }
}

// MARK: - Nests

struct HornetNestCreate: Codable {
    let latitude: Double
    let longitude: Double
    let reporterName: String?
    let notes: String?
    let photoUrl: String?

    enum CodingKeys: String, CodingKey {
        case latitude, longitude, notes
        case reporterName = "reporter_name"
        case photoUrl = "photo_url"
    }
}

struct HornetNestOut: Codable, Identifiable {
    let id: String
    let latitude: Double
    let longitude: Double
    let status: String
    let reporterName: String?
    let notes: String?
    let photoUrl: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, status, notes
        case reporterName = "reporter_name"
        case photoUrl = "photo_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Nests GeoJSON

struct HornetNestGeoJSON: Codable {
    let type: String
    let features: [HornetNestFeature]
}

struct HornetNestFeature: Codable {
    let type: String
    let geometry: HornetNestGeometry
    let properties: HornetNestProperties
}

struct HornetNestGeometry: Codable {
    let type: String
    let coordinates: [Double] // [longitude, latitude]
}

struct HornetNestProperties: Codable, Identifiable {
    let id: String
    let status: String
    let reporterName: String?
    let notes: String?
    let photoUrl: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, status, notes
        case reporterName = "reporter_name"
        case photoUrl = "photo_url"
        case createdAt = "created_at"
    }
}

// MARK: - Sightings

struct HornetSightingCreate: Codable {
    let photoUrl: String
    let description: String?
    let reporterName: String?
    let latitude: Double?
    let longitude: Double?

    enum CodingKeys: String, CodingKey {
        case description, latitude, longitude
        case photoUrl = "photo_url"
        case reporterName = "reporter_name"
    }
}

struct HornetSightingOut: Codable, Identifiable {
    let id: String
    let photoUrl: String
    let description: String?
    let reporterName: String?
    let status: String
    let yesVotes: Int
    let noVotes: Int
    let createdAt: Date
    let latitude: Double?
    let longitude: Double?

    enum CodingKeys: String, CodingKey {
        case id, description, status, latitude, longitude
        case photoUrl = "photo_url"
        case reporterName = "reporter_name"
        case yesVotes = "yes_votes"
        case noVotes = "no_votes"
        case createdAt = "created_at"
    }
}

struct HornetVote: Codable {
    let vote: String
}

// MARK: - Traps

struct HornetTrapCreate: Codable {
    let name: String
    let latitude: Double
    let longitude: Double
    let notes: String?
    let ownerName: String?

    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude, notes
        case ownerName = "owner_name"
    }
}

struct HornetTrapCatchCreate: Codable {
    let count: Int
    let caughtOn: String  // ISO date string YYYY-MM-DD

    enum CodingKeys: String, CodingKey {
        case count
        case caughtOn = "caught_on"
    }
}

struct HornetTrapCatchOut: Codable, Identifiable {
    let id: String
    let trapId: String
    let count: Int
    let caughtOn: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, count
        case trapId = "trap_id"
        case caughtOn = "caught_on"
        case createdAt = "created_at"
    }
}

struct HornetTrapOut: Codable, Identifiable {
    let id: String
    let accessCode: String
    let name: String
    let latitude: Double
    let longitude: Double
    let notes: String?
    let ownerName: String?
    let createdAt: Date
    let totalCaught: Int
    let catches: [HornetTrapCatchOut]

    enum CodingKeys: String, CodingKey {
        case id, name, latitude, longitude, notes, catches
        case accessCode = "access_code"
        case ownerName = "owner_name"
        case createdAt = "created_at"
        case totalCaught = "total_caught"
    }
}

struct HornetTrapNearbyOut: Codable {
    let accessCode: String
    let name: String
    let latitude: Double
    let longitude: Double
    let distanceM: Int
    let totalCaught: Int

    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude
        case accessCode = "access_code"
        case distanceM = "distance_m"
        case totalCaught = "total_caught"
    }
}

struct HornetTrapsGeoJSON: Codable {
    let type: String
    let features: [HornetTrapFeature]
}

struct HornetTrapFeature: Codable {
    let type: String
    let geometry: HornetNestGeometry      // same shape: Point + [lon, lat]
    let properties: HornetTrapProperties
}

struct HornetTrapProperties: Codable {
    let accessCode: String
    let name: String
    let totalCaught: Int

    enum CodingKeys: String, CodingKey {
        case name
        case accessCode = "access_code"
        case totalCaught = "total_caught"
    }
}
