package com.hivepulse.app.ui.onboarding

import com.hivepulse.app.data.local.OnboardingStore
import io.mockk.*
import org.junit.After
import org.junit.Test

class GuidedTourViewModelTest {

    private val store = mockk<OnboardingStore>(relaxed = true)

    @After fun tearDown() = clearAllMocks()

    @Test
    fun `complete marks the tour as seen`() {
        GuidedTourViewModel(store).complete()

        verify { store.hasSeenGuidedTour = true }
    }

    @Test
    fun `opening the tour alone does not mark it as seen`() {
        GuidedTourViewModel(store)

        verify(exactly = 0) { store.hasSeenGuidedTour = any() }
    }
}
