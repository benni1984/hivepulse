package com.hivepulse.app.data.local

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Which account the cached hives and the queued inspections belong to (#469).
 *
 * Nothing used to say. What kept one beekeeper's data from the next was that signing out cleared
 * both — which holds exactly as long as everybody signs out, and a session can end without
 * anybody doing anything (#467).
 *
 * Deliberately **not** in [TokenStore]: that is cleared the moment a session ends, and an owner
 * that disappears with the tokens would leave the next account — any account — looking at data
 * with no name on it.
 */
@Singleton
class OfflineOwner @Inject constructor(@ApplicationContext context: Context) {

    private val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    var userId: String?
        get() = prefs.getString(KEY, null)
        set(value) {
            prefs.edit().apply {
                if (value == null) remove(KEY) else putString(KEY, value)
            }.apply()
        }

    private companion object {
        const val FILE = "hivepulse_offline_owner"
        const val KEY = "owner_user_id"
    }
}
