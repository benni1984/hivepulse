package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OfflineCache
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.data.sync.SyncScheduler
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val tokenStore: TokenStore,
    private val cache: OfflineCache,
    private val queue: OfflineInspectionQueue,
    private val syncScheduler: SyncScheduler,
) {
    val isLoggedIn get() = tokenStore.isLoggedIn

    suspend fun register(email: String, password: String, name: String, locale: String): UserOut {
        val resp = api.register(RegisterRequest(email, password, name, locale))
        tokenStore.accessToken  = resp.accessToken
        tokenStore.refreshToken = resp.refreshToken
        return resp.user
    }

    suspend fun login(email: String, password: String): UserOut {
        val resp = api.login(LoginRequest(email, password))
        tokenStore.accessToken  = resp.accessToken
        tokenStore.refreshToken = resp.refreshToken
        return resp.user
    }

    suspend fun logout() {
        tokenStore.refreshToken?.let { runCatching { api.logout(LogoutRequest(it)) } }
        tokenStore.clear()
        // The next account on this device must not see the previous one's hives, and a
        // queued inspection could no longer be uploaded with the signed-out session.
        cache.clear()
        queue.clear()
        syncScheduler.cancel()
    }

    suspend fun getMe(): UserOut = api.getMe()

    suspend fun updateMe(name: String?, locale: String?): UserOut =
        api.updateMe(UserUpdateRequest(name, locale))

    suspend fun changePassword(currentPassword: String, newPassword: String): UserOut =
        api.changePassword(PasswordChangeRequest(newPassword, currentPassword))

    /**
     * Returns normally for every server answer (the API answers 204 either way), so callers can't
     * tell whether the address is registered. Only network failures throw.
     */
    suspend fun forgotPassword(email: String) {
        api.forgotPassword(ForgotPasswordRequest(email))
    }

    suspend fun deleteAccount() {
        api.deleteMe()
        tokenStore.clear()
    }

    suspend fun getReminderSettings(): ReminderSettingsOut = api.getReminderSettings()

    suspend fun updateReminderSettings(update: ReminderSettingsUpdate): ReminderSettingsOut =
        api.updateReminderSettings(update)

    suspend fun registerFcmToken(token: String) {
        if (!isLoggedIn) return
        runCatching { api.registerPushToken(PushTokenRegister("android", token)) }
        // Best-effort: silently ignore failures
    }
}
