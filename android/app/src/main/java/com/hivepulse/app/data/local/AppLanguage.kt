package com.hivepulse.app.data.local

import android.app.Activity
import android.app.LocaleManager
import android.content.Context
import android.content.ContextWrapper
import android.os.Build
import android.os.LocaleList
import java.util.Locale

/**
 * The language the app is shown in, chosen in Settings.
 *
 * The picker used to tell only the server which language to write emails in; the interface
 * itself followed the phone, so choosing English on a German phone changed nothing anybody
 * could see.
 *
 * From Android 13 the system keeps a language per app, and this sets that one, so the choice
 * also shows under Settings -> Apps -> HivePulse -> Language. Older versions have no such
 * thing: there the choice is kept here and applied to the activity when it is created.
 */
object AppLanguage {

    val supported = listOf("en", "de", "fr", "es")

    private const val PREFS = "app_language"
    private const val KEY = "tag"

    /** "de-DE" and "de" are German; anything the app has no texts for is nothing. */
    fun normalize(tag: String?): String? =
        tag?.substringBefore('-')?.substringBefore('_')?.lowercase()?.takeIf { it in supported }

    /** The language the interface is in right now, whatever decided it. */
    fun current(context: Context): String? =
        normalize(context.resources.configuration.locales[0].toLanguageTag())

    /** Switches the interface to [tag]. The activity is recreated so the new texts show at once. */
    fun apply(context: Context, tag: String) {
        val language = normalize(tag) ?: return
        if (Build.VERSION.SDK_INT >= 33) {
            // The system recreates the app's activities itself.
            context.getSystemService(LocaleManager::class.java).applicationLocales =
                LocaleList.forLanguageTags(language)
        } else {
            context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(KEY, language).apply()
            context.findActivity()?.recreate()
        }
    }

    /**
     * For Android 12 and older: hands the activity a context in the chosen language. From 13
     * on the system does this and the saved value is never read.
     */
    fun wrap(base: Context): Context {
        if (Build.VERSION.SDK_INT >= 33) return base
        val saved = normalize(
            base.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null)
        ) ?: return base
        val locale = Locale.forLanguageTag(saved)
        Locale.setDefault(locale)
        val configuration = android.content.res.Configuration(base.resources.configuration)
        configuration.setLocale(locale)
        return base.createConfigurationContext(configuration)
    }

    private fun Context.findActivity(): Activity? {
        var context: Context? = this
        while (context is ContextWrapper) {
            if (context is Activity) return context
            context = context.baseContext
        }
        return null
    }
}
