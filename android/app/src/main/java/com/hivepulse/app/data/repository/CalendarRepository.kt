package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.CalendarOut
import com.hivepulse.app.data.api.RegionOut
import com.hivepulse.app.data.api.RegionUpdateRequest
import com.hivepulse.app.data.api.withServerMessage
import javax.inject.Inject
import javax.inject.Singleton

/** The beekeeper's year and the region it is moved to. */
@Singleton
class CalendarRepository @Inject constructor(private val api: ApiService) {

    suspend fun region(): RegionOut = withServerMessage { api.region() }

    suspend fun updateRegion(request: RegionUpdateRequest): RegionOut = withServerMessage { api.updateRegion(request) }

    suspend fun calendar(from: String, days: Int, language: String): CalendarOut =
        withServerMessage { api.calendar(from, days, language) }
}
