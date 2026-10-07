package com.hivepulse.app.data.api

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class DtoTest {

    @Test
    fun `ReminderSettingsOut parses reminder_email_enabled`() {
        val json = """{"reminder_enabled":true,"reminder_interval_days":7,"reminder_season_start":4,
            "reminder_season_end":8,"reminder_email_enabled":true,"push_token_apns":null,"push_token_fcm":null}"""
        assertTrue(Gson().fromJson(json, ReminderSettingsOut::class.java).reminderEmailEnabled)
    }

    @Test
    fun `ReminderSettingsOut defaults email channel to false when field is absent`() {
        val json = """{"reminder_enabled":true,"reminder_interval_days":7,"reminder_season_start":4,
            "reminder_season_end":8,"push_token_apns":null,"push_token_fcm":null}"""
        assertFalse(Gson().fromJson(json, ReminderSettingsOut::class.java).reminderEmailEnabled)
    }

    @Test
    fun `ReminderSettingsUpdate serializes reminder_email_enabled`() {
        val json = Gson().toJson(ReminderSettingsUpdate(true, 7, 4, 8, reminderEmailEnabled = true))
        assertTrue(json.contains("\"reminder_email_enabled\":true"))
    }

    @Test
    fun `QrTokenOut isLinked is true when linkedHiveId is not null`() {
        val token = QrTokenOut("abc", linkedHiveId = "hive-1")
        assertTrue(token.isLinked)
    }

    @Test
    fun `QrTokenOut isLinked is false when linkedHiveId is null`() {
        val token = QrTokenOut("abc", linkedHiveId = null)
        assertFalse(token.isLinked)
    }

    @Test
    fun `QRScanResult Linked wraps hive`() {
        val hive = hive()
        val result = QRScanResult.Linked(hive)
        assertEquals(hive, result.hive)
    }

    @Test
    fun `QRScanResult Unlinked wraps token string`() {
        val result = QRScanResult.Unlinked("tok-xyz")
        assertEquals("tok-xyz", result.token)
    }

    @Test
    fun `PaginatedResponse holds correct metadata`() {
        val response = PaginatedResponse(items = listOf("a", "b"), total = 10, page = 2, pages = 5)
        assertEquals(2, response.items.size)
        assertEquals(10, response.total)
        assertEquals(2, response.page)
        assertEquals(5, response.pages)
    }

    @Test
    fun `QrBatchSummary linked count field is accessible`() {
        val batch = QrBatchSummary("b1", 5, "2024-01-01", linkedCount = 3)
        assertEquals(3, batch.linkedCount)
    }

    @Test
    fun `UserOut isAdmin defaults to false`() {
        val user = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01")
        assertFalse(user.isAdmin)
        assertFalse(user.isSupporter)
    }

    @Test
    fun `UserOut isAdmin can be set to true`() {
        val user = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01", isAdmin = true, isSupporter = true)
        assertTrue(user.isAdmin)
        assertTrue(user.isSupporter)
    }

    @Test
    fun `AdminUserOut holds expected values`() {
        val user = AdminUserOut("u1", "a@b.com", "Alice", "2024-01-01", isSupporter = true, apiaryCount = 2, hiveCount = 5, inspectionCount = 10)
        assertEquals("u1", user.id)
        assertTrue(user.isSupporter)
        assertEquals(5, user.hiveCount)
    }

    @Test
    fun `HealthSummary holds all counts`() {
        val summary = HealthSummary(inactiveUsersCount = 3, noVarroaApiariesCount = 2, zeroInspectionHivesCount = 1)
        assertEquals(3, summary.inactiveUsersCount)
        assertEquals(2, summary.noVarroaApiariesCount)
        assertEquals(1, summary.zeroInspectionHivesCount)
    }

    private fun hive() = HiveOut(
        id = "h1", qrToken = "tok", apiaryId = "a1", name = "Hive 1",
        hiveType = "langstroth", latitude = null, longitude = null,
        acquisitionDate = null, notes = null, customFields = emptyMap(),
        initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
    )

    @Test
    fun `an account without a password cannot change one`() {
        val user = Gson().fromJson(
            """{"id":"u","email":"a@b.de","name":"A","locale":"de","created_at":"2026-01-01T00:00:00","has_password":false}""",
            UserOut::class.java,
        )

        assertFalse(user.canChangePassword)
    }

    @Test
    fun `a response without the field reads as having a password`() {
        // Gson ignores Kotlin defaults, so a missing field must not turn into "no password":
        // that would hide the section from everybody whenever the server did not say.
        val user = Gson().fromJson(
            """{"id":"u","email":"a@b.de","name":"A","locale":"de","created_at":"2026-01-01T00:00:00"}""",
            UserOut::class.java,
        )

        assertTrue(user.canChangePassword)
    }

    @Test
    fun `an account with a password can change it`() {
        val user = Gson().fromJson(
            """{"id":"u","email":"a@b.de","name":"A","locale":"de","created_at":"2026-01-01T00:00:00","has_password":true}""",
            UserOut::class.java,
        )

        assertTrue(user.canChangePassword)
    }


    @Test
    fun `a hive made by hand is sent the way the server reads it`() {
        val json = com.google.gson.Gson().toJson(HiveCreateRequest("H", "top_bar", "2026-04-01", null))

        assertTrue(json.contains("\"hive_type\":\"top_bar\""))
        assertTrue(json.contains("\"acquisition_date\":\"2026-04-01\""))
        assertFalse(json.contains("hiveType"))
        assertFalse("an empty note is left out", json.contains("notes"))
    }
}
