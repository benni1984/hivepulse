package com.hivepulse.app

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.hivepulse.app.data.repository.AuthRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Handles FCM token refresh events.
 * When a new token is issued, registers it with the HivePulse backend (best-effort).
 * Actual push delivery requires FIREBASE_SERVER_KEY to be set on the backend.
 */
@AndroidEntryPoint
class HivePulseFcmService : FirebaseMessagingService() {

    @Inject lateinit var repo: AuthRepository

    override fun onNewToken(token: String) {
        CoroutineScope(Dispatchers.IO).launch {
            repo.registerFcmToken(token)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        // Future: display local notification from message.notification
    }
}
