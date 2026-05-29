package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.TokenStore
import retrofit2.Response
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class AuthRepositoryTest {

    private val api = mockk<ApiService>()
    private val tokenStore = mockk<TokenStore>(relaxed = true)
    private lateinit var repo: AuthRepository

    @Before
    fun setUp() {
        repo = AuthRepository(api, tokenStore)
    }

    @After
    fun tearDown() = clearAllMocks()

    @Test
    fun `login stores tokens and returns user`() = runTest {
        val user = user()
        coEvery { api.login(LoginRequest("a@b.com", "secret")) } returns
            TokenResponse("at", "rt", user)

        val result = repo.login("a@b.com", "secret")

        assertEquals(user, result)
        verify { tokenStore.accessToken = "at" }
        verify { tokenStore.refreshToken = "rt" }
    }

    @Test
    fun `register stores tokens and returns user`() = runTest {
        val user = user()
        coEvery { api.register(RegisterRequest("a@b.com", "secret", "Alice", "en")) } returns
            TokenResponse("at2", "rt2", user)

        val result = repo.register("a@b.com", "secret", "Alice", "en")

        assertEquals(user, result)
        verify { tokenStore.accessToken = "at2" }
        verify { tokenStore.refreshToken = "rt2" }
    }

    @Test
    fun `logout calls api with refresh token then clears store`() = runTest {
        every { tokenStore.refreshToken } returns "rt"
        coEvery { api.logout(LogoutRequest("rt")) } returns mockk(relaxed = true)

        repo.logout()

        coVerify { api.logout(LogoutRequest("rt")) }
        verify { tokenStore.clear() }
    }

    @Test
    fun `logout clears store even when api throws`() = runTest {
        every { tokenStore.refreshToken } returns "rt"
        coEvery { api.logout(any()) } throws RuntimeException("network error")

        repo.logout()

        verify { tokenStore.clear() }
    }

    @Test
    fun `logout skips api call when refresh token is absent`() = runTest {
        every { tokenStore.refreshToken } returns null

        repo.logout()

        coVerify(exactly = 0) { api.logout(any()) }
        verify { tokenStore.clear() }
    }

    @Test
    fun `isLoggedIn reflects tokenStore value`() {
        every { tokenStore.isLoggedIn } returns true
        assertTrue(repo.isLoggedIn)

        every { tokenStore.isLoggedIn } returns false
        assertFalse(repo.isLoggedIn)
    }

    @Test
    fun `getMe delegates to api`() = runTest {
        val user = user()
        coEvery { api.getMe() } returns user

        val result = repo.getMe()

        assertEquals(user, result)
    }

    @Test
    fun `updateMe delegates to api`() = runTest {
        val updated = user().copy(name = "Bob")
        coEvery { api.updateMe(UserUpdateRequest("Bob", null)) } returns updated

        val result = repo.updateMe("Bob", null)

        assertEquals("Bob", result.name)
    }

    @Test
    fun `changePassword calls api with correct request and returns user`() = runTest {
        val updated = user()
        coEvery { api.changePassword(PasswordChangeRequest("new1234", "oldpass")) } returns updated

        val result = repo.changePassword("oldpass", "new1234")

        assertEquals(updated, result)
        coVerify { api.changePassword(PasswordChangeRequest("new1234", "oldpass")) }
    }

    @Test
    fun `deleteAccount calls api and clears token store`() = runTest {
        coEvery { api.deleteMe() } returns mockk(relaxed = true)

        repo.deleteAccount()

        coVerify { api.deleteMe() }
        verify { tokenStore.clear() }
    }

    @Test
    fun `getReminderSettings delegates to api`() = runTest {
        val r = reminder()
        coEvery { api.getReminderSettings() } returns r

        val result = repo.getReminderSettings()

        assertEquals(r, result)
    }

    @Test
    fun `updateReminderSettings delegates to api`() = runTest {
        val update = ReminderSettingsUpdate(false, 14, 3, 9)
        val updated = reminder().copy(reminderEnabled = false, reminderIntervalDays = 14)
        coEvery { api.updateReminderSettings(update) } returns updated

        val result = repo.updateReminderSettings(update)

        assertEquals(updated, result)
        coVerify { api.updateReminderSettings(update) }
    }

    @Test
    fun `registerFcmToken calls api when logged in`() = runTest {
        every { tokenStore.isLoggedIn } returns true
        coEvery { api.registerPushToken(PushTokenRegister("android", "tok123")) } returns mapOf("ok" to true)

        repo.registerFcmToken("tok123")

        coVerify { api.registerPushToken(PushTokenRegister("android", "tok123")) }
    }

    @Test
    fun `registerFcmToken skips api when not logged in`() = runTest {
        every { tokenStore.isLoggedIn } returns false

        repo.registerFcmToken("tok123")

        coVerify(exactly = 0) { api.registerPushToken(any()) }
    }

    private fun user() = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01")
    private fun reminder() = ReminderSettingsOut(
        reminderEnabled      = true,
        reminderIntervalDays = 7,
        reminderSeasonStart  = 4,
        reminderSeasonEnd    = 8,
        pushTokenApns        = null,
        pushTokenFcm         = null
    )
}
