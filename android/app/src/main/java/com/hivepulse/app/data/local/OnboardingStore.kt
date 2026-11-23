package com.hivepulse.app.data.local

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * What this device already knows about its owner: the guided tour, and whether we have asked
 * what they think. Neither is sensitive, so plain preferences rather than the Keystore.
 */
@Singleton
class OnboardingStore @Inject constructor(@ApplicationContext context: Context) {

    private val prefs = context.getSharedPreferences("hivepulse_onboarding", Context.MODE_PRIVATE)

    var hasSeenGuidedTour: Boolean
        get() = prefs.getBoolean(KEY_TOUR_SEEN, false)
        set(value) { prefs.edit().putBoolean(KEY_TOUR_SEEN, value).apply() }

    /**
     * Which tours this device has been through (#449).
     *
     * Seen is not spent: this only puts a mark beside a tour in the list in Settings, and the
     * start button stays. Somebody who watched the QR tour a year ago and has forgotten what a
     * batch is for must be able to watch it again, which is the whole difference between this
     * and the carousel it replaced.
     */
    var finishedTours: Set<String>
        get() = prefs.getStringSet(KEY_TOURS_DONE, emptySet()) ?: emptySet()
        set(value) { prefs.edit().putStringSet(KEY_TOURS_DONE, value).apply() }

    fun markTourFinished(id: String) {
        finishedTours = finishedTours + id
    }

    /** Epoch milliseconds, or 0 when this device has not been counted yet. */
    var firstLaunchAt: Long
        get() = prefs.getLong(KEY_FIRST_LAUNCH, 0L)
        set(value) { prefs.edit().putLong(KEY_FIRST_LAUNCH, value).apply() }

    /**
     * Asked, and never again (#546) — whichever button was pressed.
     *
     * A "not now" that silently returns next week is worse than no button at all, which is why
     * the second one says "No thanks" and means it.
     */
    var hasAskedForFeedback: Boolean
        get() = prefs.getBoolean(KEY_FEEDBACK_ASKED, false)
        set(value) { prefs.edit().putBoolean(KEY_FEEDBACK_ASKED, value).apply() }

    /** Records the first launch once; later calls leave the original date alone. */
    fun noteLaunch(now: Long = System.currentTimeMillis()) {
        if (firstLaunchAt == 0L) firstLaunchAt = now
    }

    companion object {
        /**
         * Long enough to have something to say. Somebody who has recorded nothing has no opinion
         * yet, and a question on the first screen is the application talking about itself before
         * it has been useful once.
         */
        const val ASK_AFTER_DAYS = 3L
        private const val DAY_MS = 24L * 60 * 60 * 1000

        /**
         * The whole rule, kept as a function of its inputs so a test needs no device.
         *
         * The iPhone and the website hold the same one (`OnboardingStore.swift`,
         * `lib/feedbackPrompt.ts`): three days, once, never again.
         */
        fun shouldAskForFeedback(firstLaunchAt: Long, now: Long, alreadyAsked: Boolean): Boolean {
            if (alreadyAsked || firstLaunchAt <= 0L) return false
            return now - firstLaunchAt >= ASK_AFTER_DAYS * DAY_MS
        }

        private const val KEY_TOUR_SEEN = "guided_tour_seen"
        private const val KEY_TOURS_DONE = "tours_finished"
        private const val KEY_FIRST_LAUNCH = "first_launch_at"
        private const val KEY_FEEDBACK_ASKED = "feedback_asked"
    }
}
