package com.hivepulse.app.data.session

import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.api.RefreshRequest
import com.hivepulse.app.data.local.TokenStore
import dagger.Lazy
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Renews an expired access token, and notices when there is nothing left to renew.
 *
 * It used to be an anonymous object inside `NetworkModule`, where no test could reach it — and
 * the instrumented tests uninstall that module entirely. It swallowed every failure of the
 * refresh call with `catch (e: Exception) { null }`, so okhttp handed the caller the original 401
 * and the app showed the server's sentence about credentials while staying, as far as it knew,
 * signed in. There was no way out but finding the sign-out button (#467).
 *
 * The distinction that was missing: **401 from the refresh call means the session is over**, and
 * anything else does not. At an apiary there is usually no signal, and being offline must never
 * sign a beekeeper out.
 */
@Singleton
class SessionAuthenticator @Inject constructor(
    private val tokenStore: TokenStore,
    private val api: Lazy<ApiService>,
    private val sessionEvents: SessionEvents,
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.code != 401) return null
        val refresh = tokenStore.refreshToken ?: return endSession()

        val newToken = runBlocking {
            try {
                api.get().refresh(RefreshRequest(refresh)).accessToken
            } catch (e: HttpException) {
                // The server refused the refresh token itself. After thirty days that is simply
                // what happens, and it is the end of the session.
                if (e.code() == 401) endSession()
                null
            } catch (e: Exception) {
                // No connection, a 500, a proxy: the session is not over, this request is.
                null
            }
        } ?: return null

        tokenStore.accessToken = newToken
        return response.request.newBuilder().header("Authorization", "Bearer $newToken").build()
    }

    /**
     * Clears the tokens and says so. The offline data is deliberately left where it is: the same
     * beekeeper is about to sign back in, and an inspection waiting in the queue was recorded at
     * a hive with no signal and exists nowhere else. What keeps it from the *next* account is the
     * owner check when somebody signs in (#469), not this.
     */
    private fun endSession(): Nothing? {
        tokenStore.clear()
        sessionEvents.signalExpired()
        return null
    }
}
