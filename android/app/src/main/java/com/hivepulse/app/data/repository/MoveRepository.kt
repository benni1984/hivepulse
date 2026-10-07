package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.HiveMoveOut
import com.hivepulse.app.data.api.MoveCreateRequest
import com.hivepulse.app.data.api.MoveResultOut
import com.hivepulse.app.data.api.withServerMessage
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Moving hives between apiaries, and the history of it.
 *
 * A move needs a connection: unlike an inspection it is not queued while offline. A refusal carries the
 * server's own message, which is already in the user's language.
 */
@Singleton
class MoveRepository @Inject constructor(private val api: ApiService) {

    suspend fun move(request: MoveCreateRequest): MoveResultOut = withServerMessage { api.moveHives(request) }

    suspend fun movesFor(hiveId: String): List<HiveMoveOut> = withServerMessage { api.hiveMoves(hiveId) }

    suspend fun overview(from: String?, to: String?): List<HiveMoveOut> =
        withServerMessage { api.movesOverview(from, to) }
}
