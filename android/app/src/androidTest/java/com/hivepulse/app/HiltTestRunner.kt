package com.hivepulse.app

import android.app.Application
import android.content.Context
import androidx.test.runner.AndroidJUnitRunner
import androidx.work.Configuration
import androidx.work.testing.WorkManagerTestInitHelper
import dagger.hilt.android.testing.HiltTestApplication

/**
 * Instrumented tests run against [HiltTestApplication], not the app's own Application class —
 * so the WorkManager setup that lives there is missing, while the manifest has already
 * disabled the default initializer. Without the initialization below, every test that reaches
 * code touching WorkManager (signing out cancels the upload worker) fails with
 * "WorkManager is not initialized properly".
 *
 * The test initializer also keeps workers from actually running during UI tests; a test that
 * wants to drive the queue calls it directly (see OfflineInspectionTest).
 */
class HiltTestRunner : AndroidJUnitRunner() {

    override fun newApplication(cl: ClassLoader?, name: String?, context: Context?): Application =
        super.newApplication(cl, HiltTestApplication::class.java.name, context)

    override fun callApplicationOnCreate(app: Application?) {
        super.callApplicationOnCreate(app)
        app?.let {
            WorkManagerTestInitHelper.initializeTestWorkManager(
                it,
                Configuration.Builder().setMinimumLoggingLevel(android.util.Log.DEBUG).build(),
            )
        }
    }
}
