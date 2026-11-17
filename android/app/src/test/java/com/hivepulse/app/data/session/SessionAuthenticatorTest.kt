package com.hivepulse.app.data.session

import com.hivepulse.app.data.api.AccessTokenResponse
import com.hivepulse.app.data.api.ApiService
import com.hivepulse.app.data.local.TokenStore
import dagger.Lazy
import io.mockk.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import retrofit2.HttpException
import java.io.IOException

/**
 * What happens when the access token has expired, and what happens when there is nothing left to
 * renew it with (#467).
 *
 * This could not be tested before: the authenticator was an anonymous object inside
 * `NetworkModule`, and the instrumented tests uninstall that module outright. It swallowed every
 * failure of the refresh call with `catch (e: Exception) { null }`, so a dead session reached the
 * screen as the original 401's message while the app stayed, as far as it knew, signed in.
 *
 * The distinction these tests pin: **a 401 from the refresh call is the end of the session, and
 * nothing else is.** At an apiary there is usually no signal, and being offline must never sign a
 * beekeeper out.
 */
class SessionAuthenticatorTest {

    private val api = mockk<ApiService>()
    private val apiProvider = mockk<Lazy<ApiService>>()
    private val tokenStore = mockk<TokenStore>(relaxed = true)
    private val sessionEvents = mockk<SessionEvents>(relaxed = true)
    private lateinit var authenticator: SessionAuthenticator

    @Before
    fun setUp() {
        every { apiProvider.get() } returns api
        every { tokenStore.refreshToken } returns "a-refresh-token"
        authenticator = SessionAuthenticator(tokenStore, apiProvider, sessionEvents)
    }

    @After
    fun tearDown() = clearAllMocks()

    private fun unauthorized(): Response = Response.Builder()
        .request(Request.Builder().url("https://hivepulse.multihead.de/api/v1/apiaries").build())
        .protocol(Protocol.HTTP_1_1)
        .code(401)
        .message("Unauthorized")
        .build()

    private fun refused() = HttpException(
        retrofit2.Response.error<AccessTokenResponse>(
            401,
            """{"detail":{"code":"TOKEN_INVALID","message":"Could not validate credentials."}}"""
                .toResponseBody("application/json".toMediaTypeOrNull()),
        )
    )

    @Test
    fun `a refresh token the server refuses ends the session`() {
        // Thirty days, and that is simply what happens.
        coEvery { api.refresh(any()) } throws refused()

        val retry = authenticator.authenticate(null, unauthorized())

        assertNull("the request must not be retried with a dead session", retry)
        verify { tokenStore.clear() }
        verify { sessionEvents.signalExpired() }
    }

    @Test
    fun `no refresh token at all ends it too`() {
        every { tokenStore.refreshToken } returns null

        val retry = authenticator.authenticate(null, unauthorized())

        assertNull(retry)
        verify { tokenStore.clear() }
        verify { sessionEvents.signalExpired() }
    }

    @Test
    fun `being offline does not sign anybody out`() {
        // The one that matters at the apiary: no signal is not a refusal, and the beekeeper has
        // to still be signed in when they get back into coverage.
        coEvery { api.refresh(any()) } throws IOException("no connection")

        val retry = authenticator.authenticate(null, unauthorized())

        assertNull(retry)
        verify(exactly = 0) { tokenStore.clear() }
        verify(exactly = 0) { sessionEvents.signalExpired() }
    }

    @Test
    fun `a server fault does not sign anybody out either`() {
        coEvery { api.refresh(any()) } throws HttpException(
            retrofit2.Response.error<AccessTokenResponse>(500, "".toResponseBody())
        )

        authenticator.authenticate(null, unauthorized())

        verify(exactly = 0) { tokenStore.clear() }
        verify(exactly = 0) { sessionEvents.signalExpired() }
    }

    @Test
    fun `a renewed token retries the request and keeps the session`() {
        coEvery { api.refresh(any()) } returns AccessTokenResponse("a-fresh-access-token")

        val retry = authenticator.authenticate(null, unauthorized())

        assertEquals("Bearer a-fresh-access-token", retry?.header("Authorization"))
        verify { tokenStore.accessToken = "a-fresh-access-token" }
        verify(exactly = 0) { tokenStore.clear() }
        verify(exactly = 0) { sessionEvents.signalExpired() }
    }

    @Test
    fun `anything that is not a 401 is none of its business`() {
        val notFound = Response.Builder()
            .request(Request.Builder().url("https://hivepulse.multihead.de/api/v1/apiaries").build())
            .protocol(Protocol.HTTP_1_1)
            .code(404)
            .message("Not Found")
            .build()

        assertNull(authenticator.authenticate(null, notFound))
        verify(exactly = 0) { tokenStore.clear() }
    }
}
