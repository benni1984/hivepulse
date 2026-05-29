package com.hivepulse.app.ui.settings

import com.hivepulse.app.data.api.ReminderSettingsOut
import com.hivepulse.app.data.api.ReminderSettingsUpdate
import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.AuthRepository
import com.hivepulse.app.data.repository.ExportRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    private val repo = mockk<AuthRepository>()
    private val apiaryRepo = mockk<ApiaryRepository>()
    private val exportRepo = mockk<ExportRepository>()
    private lateinit var vm: SettingsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.getMe() } returns user()
        coEvery { apiaryRepo.list() } returns emptyList()
        coEvery { repo.getReminderSettings() } returns reminder()
        coEvery { repo.registerFcmToken(any()) } just runs
        vm = SettingsViewModel(repo, apiaryRepo, exportRepo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads user on construction`() {
        assertEquals(user(), vm.state.value.user)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `init failure sets error`() = runTest {
        coEvery { repo.getMe() } throws RuntimeException("Unauthorized")
        val vm = SettingsViewModel(repo, apiaryRepo, exportRepo)

        assertEquals("Unauthorized", vm.state.value.error)
        assertNull(vm.state.value.user)
    }

    @Test
    fun `updateName saves name and updates user in state`() = runTest {
        val updated = user().copy(name = "Bob")
        coEvery { repo.updateMe("Bob", null) } returns updated

        vm.updateName("Bob")

        assertEquals("Bob", vm.state.value.user?.name)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `updateName failure sets error`() = runTest {
        coEvery { repo.updateMe(any(), any()) } throws RuntimeException("save failed")

        vm.updateName("Bob")

        assertEquals("save failed", vm.state.value.error)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `updateLocale updates user locale in state`() = runTest {
        val updated = user().copy(locale = "fr")
        coEvery { repo.updateMe(null, "fr") } returns updated

        vm.updateLocale("fr")

        assertEquals("fr", vm.state.value.user?.locale)
    }

    @Test
    fun `logout sets loggedOut flag regardless of api result`() = runTest {
        coEvery { repo.logout() } just runs

        vm.logout()

        assertTrue(vm.state.value.loggedOut)
    }

    @Test
    fun `logout sets loggedOut even when api throws`() = runTest {
        coEvery { repo.logout() } throws RuntimeException("network")

        vm.logout()

        assertTrue(vm.state.value.loggedOut)
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.updateMe(any(), any()) } throws RuntimeException("err")
        vm.updateName("Bob")
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    @Test
    fun `changePassword success sets passwordChanged flag`() = runTest {
        coEvery { repo.changePassword("old", "new12345") } returns user()

        vm.changePassword("old", "new12345")

        assertTrue(vm.state.value.passwordChanged)
        assertFalse(vm.state.value.isChangingPassword)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `changePassword failure sets error`() = runTest {
        coEvery { repo.changePassword(any(), any()) } throws RuntimeException("Current password is incorrect")

        vm.changePassword("wrong", "new12345")

        assertEquals("Current password is incorrect", vm.state.value.error)
        assertFalse(vm.state.value.isChangingPassword)
        assertFalse(vm.state.value.passwordChanged)
    }

    @Test
    fun `deleteAccount success sets deleted flag`() = runTest {
        coEvery { repo.deleteAccount() } just runs

        vm.deleteAccount()

        assertTrue(vm.state.value.deleted)
        assertFalse(vm.state.value.isDeleting)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `deleteAccount failure sets error and does not set deleted`() = runTest {
        coEvery { repo.deleteAccount() } throws RuntimeException("Server error")

        vm.deleteAccount()

        assertEquals("Server error", vm.state.value.error)
        assertFalse(vm.state.value.deleted)
        assertFalse(vm.state.value.isDeleting)
    }

    @Test
    fun `loadReminderSettings success updates state`() = runTest {
        val r = reminder()
        coEvery { repo.getReminderSettings() } returns r
        vm.loadReminderSettings()
        assertEquals(r, vm.state.value.reminderSettings)
    }

    @Test
    fun `loadReminderSettings failure does not set error`() = runTest {
        coEvery { repo.getReminderSettings() } throws RuntimeException("network")
        vm.loadReminderSettings()
        // best-effort — no error surfaced to the user
        assertNull(vm.state.value.error)
    }

    @Test
    fun `saveReminderSettings success sets reminderSaved flag and updates state`() = runTest {
        val updated = reminder().copy(reminderIntervalDays = 14)
        val update = ReminderSettingsUpdate(true, 14, 4, 8)
        coEvery { repo.updateReminderSettings(update) } returns updated

        vm.saveReminderSettings(update)

        assertTrue(vm.state.value.reminderSaved)
        assertEquals(14, vm.state.value.reminderSettings?.reminderIntervalDays)
        assertFalse(vm.state.value.isSavingReminder)
    }

    @Test
    fun `saveReminderSettings failure sets error and clears saving flag`() = runTest {
        coEvery { repo.updateReminderSettings(any()) } throws RuntimeException("save error")

        vm.saveReminderSettings(ReminderSettingsUpdate(true, 7, 4, 8))

        assertEquals("save error", vm.state.value.error)
        assertFalse(vm.state.value.isSavingReminder)
        assertFalse(vm.state.value.reminderSaved)
    }

    @Test
    fun `clearReminderSaved clears the flag`() = runTest {
        val updated = reminder()
        coEvery { repo.updateReminderSettings(any()) } returns updated
        vm.saveReminderSettings(ReminderSettingsUpdate(true, 7, 4, 8))
        assertTrue(vm.state.value.reminderSaved)

        vm.clearReminderSaved()

        assertFalse(vm.state.value.reminderSaved)
    }

    @Test
    fun `init loads reminder settings on construction`() {
        assertEquals(reminder(), vm.state.value.reminderSettings)
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
