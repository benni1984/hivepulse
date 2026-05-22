package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HornetRepository @Inject constructor(private val api: ApiService) {

    suspend fun getStats(): HornetStats = api.hornetStats()

    suspend fun submitCatch(
        count: Int,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null
    ): HornetCatchOut = api.submitHornetCatch(
        HornetCatchCreate(latitude, longitude, count, reporterName)
    )

    suspend fun getNests(): HornetNestGeoJSON = api.hornetNests()

    suspend fun submitNest(
        latitude: Double,
        longitude: Double,
        notes: String? = null,
        photoUrl: String? = null,
        reporterName: String? = null
    ): HornetNestOut = api.submitHornetNest(
        HornetNestCreate(latitude, longitude, reporterName, notes, photoUrl)
    )

    suspend fun getSightings(page: Int = 1): PaginatedResponse<HornetSightingOut> =
        api.hornetSightings(page = page)

    suspend fun submitSighting(
        photoUrl: String,
        description: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null
    ): HornetSightingOut = api.submitHornetSighting(
        HornetSightingCreate(photoUrl, description, reporterName, latitude, longitude)
    )

    suspend fun vote(sightingId: String, vote: String) {
        api.voteOnSighting(sightingId, HornetVoteRequest(vote))
    }

    // MARK: - Traps

    suspend fun createTrap(
        name: String,
        latitude: Double,
        longitude: Double,
        notes: String? = null,
        ownerName: String? = null
    ): HornetTrapOut = api.createHornetTrap(
        HornetTrapCreate(name, latitude, longitude, notes, ownerName)
    )

    suspend fun getTrap(accessCode: String): HornetTrapOut =
        api.getHornetTrap(accessCode.uppercase())

    suspend fun addTrapCatch(accessCode: String, count: Int, caughtOn: String): HornetTrapCatchOut =
        api.addTrapCatch(accessCode.uppercase(), HornetTrapCatchCreate(count, caughtOn))

    suspend fun getNearbyTraps(lat: Double, lon: Double, radiusM: Int = 50): List<HornetTrapNearbyOut> =
        api.getNearbyTraps(lat, lon, radiusM)

    suspend fun getTrapsGeoJSON(): HornetTrapsGeoJSON = api.getTrapsGeoJSON()
}
