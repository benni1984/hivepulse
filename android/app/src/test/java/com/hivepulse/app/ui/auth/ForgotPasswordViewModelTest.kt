package com.hivepulse.app.ui.auth

import androidx.lifecycle.SavedStateHandle
import com.hivepulse.app.data.repository.AuthRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
class ForgotPasswordViewModelTest {

    private val repo = mockk<AuthRepository>()

    @Before fun setUp()    { Dispatchers.setMain(UnconfinedTestDispatcher()) }
    @After  fun tearDown() { Dispatchers.resetMain(); clearAllMocks() }

    private fun vm(email: String? = null) =
        ForgotPasswordViewModel(SavedStateHandle(email?.let { mapOf("email" to it) } ?: emptyMap()), repo)

    @Test
    fun `initial email comes from the nav argument`() {
        assertEquals("bee@example.com", vm("bee@example.com").initialEmail)
        assertEquals("", vm().initialEmail)
    }

    @Test
    fun `submit trims the email and shows the sent message`() = runTest {
        coEvery { repo.forgotPassword("a@b.com") } just runs
        val vm = vm()

        vm.submit("  a@b.com ")

        coVerify { repo.forgotPassword("a@b.com") }
        assertTrue(vm.state.value.sent)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `unexpected server failure still shows the sent message`() = runTest {
        coEvery { repo.forgotPassword(any()) } throws RuntimeException("HTTP 500")
        val vm = vm()

        vm.submit("a@b.com")

        assertTrue(vm.state.value.sent)
        assertFalse(vm.state.value.offline)
    }

    @Test
    fun `network failure shows offline and does not claim the link was sent`() = runTest {
        coEvery { repo.forgotPassword(any()) } throws IOException("timeout")
        val vm = vm()

        vm.submit("a@b.com")

        assertTrue(vm.state.value.offline)
        assertFalse(vm.state.value.sent)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `clearError resets offline`() = runTest {
        coEvery { repo.forgotPassword(any()) } throws IOException("timeout")
        val vm = vm()
        vm.submit("a@b.com")

        vm.clearError()

        assertFalse(vm.state.value.offline)
    }
}
