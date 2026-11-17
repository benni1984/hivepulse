package com.hivepulse.app.data.session

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Said once when the stored session turns out to be over, so whatever is on screen can return to
 * the sign-in form (#467).
 *
 * It is a signal and not a call because the place that finds out is the HTTP layer, which knows
 * nothing about screens, and the place that has to act is the activity.
 */
@Singleton
class SessionEvents @Inject constructor() {

    private val _expired = MutableSharedFlow<Unit>(extraBufferCapacity = 1)

    /** Emits when the server refused the refresh token itself. */
    val expired: SharedFlow<Unit> = _expired

    /**
     * Several requests can fail at once, so this may be called more than once for one dead
     * session; the collector is expected to cope, and `tryEmit` never blocks the HTTP thread.
     */
    fun signalExpired() {
        _expired.tryEmit(Unit)
    }
}
