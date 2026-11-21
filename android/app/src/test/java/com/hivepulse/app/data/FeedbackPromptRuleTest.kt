package com.hivepulse.app.data

import com.hivepulse.app.data.local.OnboardingStore
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * When to ask a beekeeper what they think (#546).
 *
 * The same three rules hold on the iPhone (`OnboardingStore.swift`) and on the website
 * (`lib/feedbackPrompt.ts`), and this is the copy that can be tested without a device.
 */
class FeedbackPromptRuleTest {

    private val day = 24L * 60 * 60 * 1000
    private val now = 1_700_000_000_000L

    @Test
    fun `a device that has never been counted is not asked`() {
        // 0 is the default of a preference that was never written, and it is also what an epoch
        // of 1970 would look like. Treating it as "forty years ago, so ask now" would put the
        // card in front of somebody on their very first screen.
        assertFalse(OnboardingStore.shouldAskForFeedback(0L, now, false))
    }

    @Test
    fun `nobody is asked before the third day`() {
        assertFalse(OnboardingStore.shouldAskForFeedback(now - 2 * day, now, false))
    }

    @Test
    fun `the third day is when the question appears`() {
        assertTrue(OnboardingStore.shouldAskForFeedback(now - 3 * day, now, false))
    }

    @Test
    fun `somebody who has answered is never asked again`() {
        // Both buttons set the flag. A "not now" that silently returns next week is the thing
        // this avoids, which is why the second button says "No thanks" and means it.
        assertFalse(OnboardingStore.shouldAskForFeedback(now - 365 * day, now, true))
    }

    @Test
    fun `a clock that went backwards does not ask`() {
        // A device whose time was corrected can report a first launch in the future. Negative
        // arithmetic must read as "not yet", never as a very large number of days.
        assertFalse(OnboardingStore.shouldAskForFeedback(now + 10 * day, now, false))
    }
}
