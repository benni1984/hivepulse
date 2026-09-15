package com.hivepulse.app.data.local

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/** Remembers on this device whether the guided tour has been shown (not sensitive, so plain prefs). */
@Singleton
class OnboardingStore @Inject constructor(@ApplicationContext context: Context) {

    private val prefs = context.getSharedPreferences("hivepulse_onboarding", Context.MODE_PRIVATE)

    var hasSeenGuidedTour: Boolean
        get() = prefs.getBoolean(KEY_TOUR_SEEN, false)
        set(value) { prefs.edit().putBoolean(KEY_TOUR_SEEN, value).apply() }

    private companion object {
        const val KEY_TOUR_SEEN = "guided_tour_seen"
    }
}
