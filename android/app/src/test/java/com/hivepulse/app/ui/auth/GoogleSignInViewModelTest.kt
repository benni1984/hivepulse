package com.hivepulse.app.ui.auth

import com.hivepulse.app.data.repository.AuthRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

/**
 * Signing in with Google.
 *
 * What is worth testing lives around Google's sheet, not inside it: what the server is
 * handed, what the beekeeper is told when it fails, and whether the button is offered at all.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class GoogleSignInViewModelTest {

    private val repo = mockk<AuthRepository>()
    private lateinit var vm: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        vm = AuthViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `a successful sign-in lands on the apiary list`() = runTest {
        coEvery { repo.signInWithGoogle("a.token") } returns makeUser()

        vm.signInWithGoogle("a.token")

        assertTrue(vm.state.value.success)
        assertNull(vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `a refused token says so and leaves nobody signed in`() = runTest {
        coEvery { repo.signInWithGoogle(any()) } throws RuntimeException("That sign-in could not be verified.")

        vm.signInWithGoogle("forged")

        assertFalse(vm.state.value.success)
        assertEquals("That sign-in could not be verified.", vm.state.value.error)
        // The spinner has to stop even when the server says no.
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `the button waits for the client id the server names`() = runTest {
        coEvery { repo.googleClientId() } returns "web-id.apps.googleusercontent.com"

        vm.loadSignInProviders()

        // Carrying a second copy of the id here is how it drifts from the audience the
        // server checks, and the sign-in then fails for a reason nobody can see.
        assertEquals("web-id.apps.googleusercontent.com", vm.state.value.googleClientId)
    }

    @Test
    fun `no client id means no button`() = runTest {
        coEvery { repo.googleClientId() } returns null

        vm.loadSignInProviders()

        // Offering a sign-in the server would refuse on arrival is worse than offering none.
        assertNull(vm.state.value.googleClientId)
    }

    @Test
    fun `a failure outside the repository still reaches the beekeeper`() {
        vm.showError("Google could not be reached")

        assertEquals("Google could not be reached", vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    private fun makeUser() = com.hivepulse.app.data.api.UserOut(
        id = "u-1", email = "imker@example.com", name = "Ada",
        locale = "de", isAdmin = false, isSupporter = false,
        createdAt = "2026-10-05T10:00:00",
    )
}
