package com.hivepulse.app.ui.members

import com.hivepulse.app.data.api.UserOut
import com.hivepulse.app.data.repository.AuthRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MembersViewModelTest {

    private val repo = mockk<AuthRepository>()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads user on construction`() {
        coEvery { repo.getMe() } returns regularUser()

        val vm = MembersViewModel(repo)

        assertEquals(regularUser(), vm.state.value.user)
        assertFalse(vm.state.value.isLoading)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `init failure sets error and no user`() {
        coEvery { repo.getMe() } throws RuntimeException("Unauthorized")

        val vm = MembersViewModel(repo)

        assertEquals("Unauthorized", vm.state.value.error)
        assertNull(vm.state.value.user)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `regular user is not unlocked`() {
        coEvery { repo.getMe() } returns regularUser()

        val vm = MembersViewModel(repo)
        val user = vm.state.value.user

        assertFalse(user?.isSupporter == true || user?.isAdmin == true)
    }

    @Test
    fun `supporter user is unlocked`() {
        coEvery { repo.getMe() } returns supporterUser()

        val vm = MembersViewModel(repo)
        val user = vm.state.value.user

        assertTrue(user?.isSupporter == true || user?.isAdmin == true)
    }

    @Test
    fun `admin user is unlocked`() {
        coEvery { repo.getMe() } returns adminUser()

        val vm = MembersViewModel(repo)
        val user = vm.state.value.user

        assertTrue(user?.isSupporter == true || user?.isAdmin == true)
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fun regularUser()   = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01",
                                          isAdmin = false, isSupporter = false)
    private fun supporterUser() = UserOut("u2", "b@b.com", "Bob",   "en", "2024-01-01",
                                          isAdmin = false, isSupporter = true)
    private fun adminUser()     = UserOut("u3", "c@b.com", "Carol", "en", "2024-01-01",
                                          isAdmin = true,  isSupporter = false)
}
