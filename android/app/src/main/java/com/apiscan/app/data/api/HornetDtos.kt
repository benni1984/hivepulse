package com.apiscan.app.data.api

import com.google.gson.annotations.SerializedName

// MARK: - Stats

data class HornetStats(
    @SerializedName("total_caught")       val totalCaught: Int,
    @SerializedName("total_nests")        val totalNests: Int,
    @SerializedName("destroyed_nests")    val destroyedNests: Int,
    @SerializedName("pending_sightings")  val pendingSightings: Int,
    @SerializedName("confirmed_sightings") val confirmedSightings: Int,
    @SerializedName("total_traps")        val totalTraps: Int = 0
)

// MARK: - Catches

data class HornetCatchCreate(
    val latitude: Double?,
    val longitude: Double?,
    val count: Int,
    @SerializedName("reporter_name") val reporterName: String?
)

data class HornetCatchOut(
    val id: String,
    val count: Int,
    val latitude: Double?,
    val longitude: Double?,
    @SerializedName("created_at") val createdAt: String
)

// MARK: - Nests

data class HornetNestCreate(
    val latitude: Double,
    val longitude: Double,
    @SerializedName("reporter_name") val reporterName: String?,
    val notes: String?,
    @SerializedName("photo_url") val photoUrl: String?
)

data class HornetNestOut(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val status: String,
    @SerializedName("reporter_name") val reporterName: String?,
    val notes: String?,
    @SerializedName("photo_url") val photoUrl: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class HornetNestGeoJSON(
    val type: String,
    val features: List<HornetNestFeature>
)

data class HornetNestFeature(
    val type: String,
    val geometry: HornetNestGeometry,
    val properties: HornetNestProperties
)

data class HornetNestGeometry(
    val type: String,
    val coordinates: List<Double>   // [longitude, latitude]
)

data class HornetNestProperties(
    val id: String,
    val status: String,
    @SerializedName("reporter_name") val reporterName: String?,
    val notes: String?,
    @SerializedName("photo_url") val photoUrl: String?,
    @SerializedName("created_at") val createdAt: String
)

// MARK: - Sightings

data class HornetSightingCreate(
    @SerializedName("photo_url") val photoUrl: String,
    val description: String?,
    @SerializedName("reporter_name") val reporterName: String?,
    val latitude: Double?,
    val longitude: Double?
)

data class HornetSightingOut(
    val id: String,
    @SerializedName("photo_url") val photoUrl: String,
    val description: String?,
    @SerializedName("reporter_name") val reporterName: String?,
    val status: String,
    @SerializedName("yes_votes") val yesVotes: Int,
    @SerializedName("no_votes") val noVotes: Int,
    @SerializedName("created_at") val createdAt: String,
    val latitude: Double?,
    val longitude: Double?
)

data class HornetVoteRequest(val vote: String)

// MARK: - Traps

data class HornetTrapCreate(
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val notes: String?,
    @SerializedName("owner_name") val ownerName: String?
)

data class HornetTrapCatchCreate(
    val count: Int,
    @SerializedName("caught_on") val caughtOn: String   // YYYY-MM-DD
)

data class HornetTrapCatchOut(
    val id: String,
    @SerializedName("trap_id") val trapId: String,
    val count: Int,
    @SerializedName("caught_on") val caughtOn: String,
    @SerializedName("created_at") val createdAt: String
)

data class HornetTrapOut(
    val id: String,
    @SerializedName("access_code") val accessCode: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val notes: String?,
    @SerializedName("owner_name") val ownerName: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("total_caught") val totalCaught: Int,
    val catches: List<HornetTrapCatchOut>
)

data class HornetTrapNearbyOut(
    @SerializedName("access_code") val accessCode: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    @SerializedName("distance_m") val distanceM: Int,
    @SerializedName("total_caught") val totalCaught: Int
)

data class HornetTrapsGeoJSON(
    val type: String,
    val features: List<HornetTrapFeature>
)

data class HornetTrapFeature(
    val type: String,
    val geometry: HornetNestGeometry,
    val properties: HornetTrapProperties
)

data class HornetTrapProperties(
    @SerializedName("access_code") val accessCode: String,
    val name: String,
    @SerializedName("total_caught") val totalCaught: Int
)
