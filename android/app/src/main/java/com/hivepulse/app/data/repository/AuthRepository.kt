package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OfflineCache
import com.hivepulse.app.data.local.OfflineOwner
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.data.sync.SyncScheduler
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Signing in, registering, and the Google identity.
 *
 * Every call here goes through [withServerMessage]: the server answers a refusal with a sentence
 * in the app's language ("Invalid email or password."), and without it a Retrofit `HttpException`
 * reaches the screen as its own `message` -- "HTTP 401 Unauthorized", which tells the person
 * nothing and reads like a fault in the app. Issue 422.
 */
@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val tokenStore: TokenStore,
    private val cache: OfflineCache,
    private val owner: OfflineOwner,
    private val queue: OfflineInspectionQueue,
    private val syncScheduler: SyncScheduler,
    /** Only to bind and unbind the store account; nothing here ever asks it about access. With no
     *  key configured every call on it is a no-op, which is the state in CI and in every test. */
    private val purchases: PurchaseGateway,
) {
    val isLoggedIn get() = tokenStore.isLoggedIn

    suspend fun register(email: String, password: String, name: String, locale: String): UserOut {
        val resp = withServerMessage { api.register(RegisterRequest(email, password, name, locale)) }
        return store(resp)
    }

    suspend fun login(email: String, password: String): UserOut {
        val resp = withServerMessage { api.login(LoginRequest(email, password)) }
        return store(resp)
    }

    suspend fun signInWithGoogle(idToken: String): UserOut {
        val resp = withServerMessage {
            api.signInWithGoogle(SocialSignInRequest(provider = "google", idToken = idToken))
        }
        return store(resp)
    }

    /**
     * What every way in has to do, in one place so none of them can forget the first line.
     */
    private suspend fun store(resp: TokenResponse): UserOut {
        adoptOfflineData(resp.user.id)
        tokenStore.accessToken  = resp.accessToken
        tokenStore.refreshToken = resp.refreshToken
        // The store account is this account. RevenueCat's app_user_id has to be the HivePulse
        // user.id, because the webhook matches purchases on it -- a purchase made while the SDK
        // still holds an anonymous id is a payment that reaches nobody (#17). Here for the same
        // reason the line above is here: this is the one place every way in goes through.
        purchases.identify(resp.user.id)
        return resp.user
    }

    /**
     * Data left by a *different* account is removed before this one can read or upload any of it;
     * data left by the same account stays where it is (#469).
     *
     * This replaces "signing out clears everything" as the thing that keeps one beekeeper's hives
     * from the next, and it is a stronger guarantee, because it does not depend on the previous
     * person having signed out at all -- a session can simply run out (#467). It is also what
     * lets an expired session keep the queue: an inspection recorded at a hive with no signal
     * exists nowhere else until it uploads.
     */
    private suspend fun adoptOfflineData(userId: String) {
        val previous = owner.userId
        if (previous != null && previous != userId) {
            cache.clear()
            queue.clear()
        }
        owner.userId = userId
    }

    /**
     * The client id a Google sign-in must be requested with, or null when the server accepts
     * none.
     *
     * Blank counts as none. A relaxed mock in the instrumented tests returns an empty string
     * rather than null, and a button built on an empty id would fail at the tap.
     */
    suspend fun googleClientId(): String? =
        runCatching { api.signInProviders().google?.clientId }
            .getOrNull()
            ?.takeIf { it.isNotBlank() }

    suspend fun logout() {
        tokenStore.refreshToken?.let { runCatching { api.logout(LogoutRequest(it)) } }
        tokenStore.clear()
        // And the store account, or the next person to use this phone inherits the subscription.
        // Only on a deliberate sign-out, not on an expiry: an expiry is the same beekeeper about
        // to sign back in, and signing in rebinds anyway (#17).
        purchases.forget()
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
