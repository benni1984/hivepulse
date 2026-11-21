package com.hivepulse.app.ui.feedback

import androidx.lifecycle.ViewModel
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.hivepulse.app.data.local.OnboardingStore
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

/**
 * Whether to ask this beekeeper what they think (#546).
 *
 * Its own ViewModel rather than a field on `ApiaryViewModel`, because the apiary list is about
 * apiaries and this is about us — and because a screen that cannot be shown a card without a
 * network mock is a screen whose test will be deleted the first time it is in the way.
 */
@HiltViewModel
class FeedbackPromptViewModel @Inject constructor(
    private val store: OnboardingStore,
) : ViewModel() {

    var visible by mutableStateOf(false)
        private set

    /**
     * Counts this launch and decides. Called when the apiary list appears, which is the first
     * screen of the application proper — so "first launch" means the first time somebody got
     * past signing in, not the first time the process started.
     */
    fun refresh(now: Long = System.currentTimeMillis()) {
        store.noteLaunch(now)
        visible = OnboardingStore.shouldAskForFeedback(
            store.firstLaunchAt, now, store.hasAskedForFeedback)
    }

    /** Both buttons end it, for good, on this device. */
    fun answered() {
        store.hasAskedForFeedback = true
        visible = false
    }
}
