package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.IncomingShareOut
import com.hivepulse.app.data.api.ShareCreateRequest
import com.hivepulse.app.data.api.ShareOut
import com.hivepulse.app.data.api.serverMessage
import retrofit2.HttpException
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

/** What is being shared: a whole apiary, or one hive. */
sealed class ShareTarget {
    data class Apiary(val id: String) : ShareTarget()
    data class Hive(val id: String) : ShareTarget()
}

/**
 * Inviting other beekeepers to work on an apiary or a hive.
 *
 * Every failure carries the server's own message, which is already in the user's language, so a
 * screen can show it as it is.
 */
@Singleton
class SharingRepository @Inject constructor(private val api: ApiService) {

    suspend fun shares(target: ShareTarget): List<ShareOut> = guarded {
        when (target) {
            is ShareTarget.Apiary -> api.listShares(apiaryId = target.id)
            is ShareTarget.Hive   -> api.listShares(hiveId = target.id)
        }
    }

    suspend fun invite(email: String, target: ShareTarget): ShareOut = guarded {
        val body = when (target) {
            is ShareTarget.Apiary -> ShareCreateRequest(email, apiaryId = target.id)
            is ShareTarget.Hive   -> ShareCreateRequest(email, hiveId = target.id)
        }
        api.createShare(body)
    }

    suspend fun incoming(): List<IncomingShareOut> = guarded { api.incomingShares() }

    suspend fun accept(id: String) = guardedEmpty { api.acceptShare(id) }

    suspend fun decline(id: String) = guardedEmpty { api.declineShare(id) }

    /** The owner removes a collaborator or withdraws an invitation, or a collaborator leaves. */
    suspend fun remove(id: String) = guardedEmpty { api.deleteShare(id) }

    private suspend fun <T> guarded(call: suspend () -> T): T =
        try {
            call()
        } catch (e: HttpException) {
            throw RuntimeException(e.serverMessage() ?: (e.message ?: "HTTP ${e.code()}"), e)
        }

    private suspend fun guardedEmpty(call: suspend () -> Response<Unit>) {
        val response = try {
            call()
        } catch (e: HttpException) {
            throw RuntimeException(e.serverMessage() ?: (e.message ?: "HTTP ${e.code()}"), e)
        }
        if (!response.isSuccessful) {
            throw RuntimeException(response.serverMessage() ?: "HTTP ${response.code()}")
        }
    }
}
