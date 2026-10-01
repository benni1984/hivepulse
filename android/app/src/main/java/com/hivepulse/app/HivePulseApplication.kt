package com.hivepulse.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.hivepulse.app.monitoring.CrashReporting
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class HivePulseApplication : Application(), Configuration.Provider {

    /** The upload worker takes injected dependencies, so WorkManager needs Hilt's factory. */
    @Inject lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder().setWorkerFactory(workerFactory).build()

    override fun onCreate() {
        super.onCreate()
        CrashReporting.start(
            context = this,
            dsn = BuildConfig.SENTRY_DSN,
            environment = if (BuildConfig.DEBUG) "development" else "production",
            release = "${BuildConfig.APPLICATION_ID}@${BuildConfig.VERSION_NAME}",
        )
    }
}
