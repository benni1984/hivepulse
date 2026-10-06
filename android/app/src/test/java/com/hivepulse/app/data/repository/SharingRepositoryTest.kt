package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response

class SharingRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: SharingRepository

    @Before fun setUp()    { repo = SharingRepository(api) }
    @After  fun tearDown() = clearAllMocks()

    private val target = ShareTargetOut("apiary", "a1", "Garden")
    private fun share(id: String = "s1") =
        ShareOut(id, "bob@example.com", "pending", target, null, "2026-01-01T00:00:00", null)

    private fun refused(code: Int, json: String): HttpException =
        HttpException(Response.error<Any>(code, json.toResponseBody("application/json".toMediaType())))

    @Test
    fun `shares asks for the apiary or the hive`() = runTest {
        coEvery { api.listShares(apiaryId = "a1") } returns listOf(share())
        coEvery { api.listShares(hiveId = "h1") } returns emptyList()

        assertEquals(1, repo.shares(ShareTarget.Apiary("a1")).size)
        assertTrue(repo.shares(ShareTarget.Hive("h1")).isEmpty())
    }

    @Test
    fun `invite sends exactly one target`() = runTest {
        val bodies = mutableListOf<ShareCreateRequest>()
        coEvery { api.createShare(capture(bodies)) } returns share()

        repo.invite("bob@example.com", ShareTarget.Apiary("a1"))
        repo.invite("bob@example.com", ShareTarget.Hive("h1"))

        assertEquals(ShareCreateRequest("bob@example.com", apiaryId = "a1"), bodies[0])
        assertEquals(ShareCreateRequest("bob@example.com", hiveId = "h1"), bodies[1])
    }

    @Test
    fun `a refused invitation carries the servers own message`() = runTest {
        coEvery { api.createShare(any()) } throws
            refused(409, """{"detail":{"code":"SHARE_ALREADY_EXISTS","message":"Already invited."}}""")

        val failure = runCatching { repo.invite("bob@example.com", ShareTarget.Apiary("a1")) }.exceptionOrNull()

        assertEquals("Already invited.", failure?.message)
    }

    @Test
    fun `a refusal without a readable body falls back to the HTTP message`() = runTest {
        coEvery { api.incomingShares() } throws refused(500, "not json")

        val failure = runCatching { repo.incoming() }.exceptionOrNull()

        assertTrue(failure?.message?.contains("500") == true)
    }

    @Test
    fun `accept decline and remove succeed on an empty answer`() = runTest {
        coEvery { api.acceptShare("s1") } returns Response.success(Unit)
        coEvery { api.declineShare("s2") } returns Response.success(Unit)
        coEvery { api.deleteShare("s3") } returns Response.success(Unit)

        repo.accept("s1")
        repo.decline("s2")
        repo.remove("s3")

        coVerify { api.acceptShare("s1"); api.declineShare("s2"); api.deleteShare("s3") }
    }

    @Test
    fun `acceptByToken sends the token and returns the invitation`() = runTest {
        val invitation = IncomingShareOut("s1", "Alice", target, null, "2026-01-01T00:00:00")
        val bodies = mutableListOf<ShareTokenRequest>()
        coEvery { api.acceptShareByToken(capture(bodies)) } returns invitation

        val result = repo.acceptByToken("the-token")

        assertEquals(invitation, result)
        assertEquals(ShareTokenRequest("the-token"), bodies.single())
    }

    @Test
    fun `a dead token carries the servers own message`() = runTest {
        coEvery { api.acceptShareByToken(any()) } throws
            refused(404, """{"detail":{"code":"SHARE_TOKEN_INVALID","message":"Link is dead."}}""")

        val failure = runCatching { repo.acceptByToken("old") }.exceptionOrNull()

        assertEquals("Link is dead.", failure?.message)
    }

    @Test
    fun `an unsuccessful answer becomes an error with the servers message`() = runTest {
        coEvery { api.acceptShare("s1") } returns Response.error(
            404, """{"detail":{"code":"SHARE_NOT_FOUND","message":"This invitation does not exist."}}"""
                .toResponseBody("application/json".toMediaType())
        )

        val failure = runCatching { repo.accept("s1") }.exceptionOrNull()

        assertEquals("This invitation does not exist.", failure?.message)
    }

    @Test
    fun `an unsuccessful answer without a message names its code`() = runTest {
        coEvery { api.deleteShare("s1") } returns Response.error(500, "".toResponseBody(null))

        val failure = runCatching { repo.remove("s1") }.exceptionOrNull()

        assertEquals("HTTP 500", failure?.message)
    }
}
