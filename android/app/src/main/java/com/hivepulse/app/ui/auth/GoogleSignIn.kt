package com.hivepulse.app.ui.auth

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/**
 * Asks Google for an identity token, or returns null when the beekeeper dismissed the sheet.
 *
 * The id passed here is the **web** client id, not the Android one. That trips people up:
 * the Android client exists so Google trusts this package and signature, but the token is
 * minted for the web client, and that is what ends up in the token's audience — which is
 * what our server checks.
 *
 * Only cancellation is swallowed. Closing the sheet is a decision, not a failure worth an
 * error banner; anything else is a real problem and must reach the caller.
 */
suspend fun requestGoogleIdToken(context: Context, serverClientId: String): String? {
    val option = GetGoogleIdOption.Builder()
        .setServerClientId(serverClientId)
        // Also offer accounts this app has never seen: the first sign-in is the whole point.
        .setFilterByAuthorizedAccounts(false)
        .build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()

    return try {
        val response = CredentialManager.create(context).getCredential(context, request)
        GoogleIdTokenCredential.createFrom(response.credential.data).idToken
    } catch (cancelled: GetCredentialCancellationException) {
        null
    }
}
