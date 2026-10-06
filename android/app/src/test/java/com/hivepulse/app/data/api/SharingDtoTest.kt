package com.hivepulse.app.data.api

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

/**
 * Gson builds these classes without running Kotlin's default values, which is why the sharing
 * fields are nullable: a payload from a server that does not send them must not crash the app,
 * and must read as "the caller's own".
 */
class SharingDtoTest {

    private val gson = Gson()

    private val apiaryJson = """{"id":"a","name":"Garden","description":null,"latitude":null,"longitude":null,
        "address":null,"hive_count":2,"is_public":false,"created_at":"2026-01-01T00:00:00"%s}"""

    @Test
    fun `an apiary tells whose it is and how it is shared`() {
        val apiary = gson.fromJson(apiaryJson.format(""","access":"shared","owner_name":"Alice""""), ApiaryOut::class.java)

        assertEquals("shared", apiary.access)
        assertEquals("Alice", apiary.ownerName)
        assertFalse(apiary.isOwner)
        assertTrue(apiary.canEdit)
    }

    @Test
    fun `an apiary from an older server is the callers own`() {
        val apiary = gson.fromJson(apiaryJson.format(""), ApiaryOut::class.java)

        assertNull(apiary.access)
        assertTrue(apiary.isOwner)
        assertTrue(apiary.canEdit)
    }

    @Test
    fun `an apiary with only some hives shared cannot be edited`() {
        val apiary = gson.fromJson(apiaryJson.format(""","access":"partial","owner_name":"Bob""""), ApiaryOut::class.java)

        assertFalse(apiary.isOwner)
        assertFalse(apiary.canEdit)
    }

    @Test
    fun `a hive knows whether it is the callers own`() {
        val json = """{"id":"h","qr_token":"t","apiary_id":"a","name":"H","hive_type":"langstroth","latitude":null,
            "longitude":null,"acquisition_date":null,"notes":null,"custom_fields":{},
            "initialized_at":"2026-01-01T00:00:00","last_inspection_at":null,"created_at":"2026-01-01T00:00:00"%s}"""

        assertTrue(gson.fromJson(json.format(""","access":"owner""""), HiveOut::class.java).isOwner)
        assertFalse(gson.fromJson(json.format(""","access":"shared""""), HiveOut::class.java).isOwner)
        assertTrue(gson.fromJson(json.format(""), HiveOut::class.java).isOwner)
    }

    @Test
    fun `an inspection says who recorded it`() {
        val inspection = gson.fromJson(
            """{"id":"i","hive_id":"h","date":"2026-05-01","custom_fields":{},"created_by_name":"Bob",
               "created_at":"2026-05-01T10:00:00"}""",
            InspectionOut::class.java,
        )

        assertEquals("Bob", inspection.createdByName)
    }

    @Test
    fun `a share and an incoming invitation are read as the server sends them`() {
        val share = gson.fromJson(
            """{"id":"s","email":"bob@example.com","status":"accepted",
               "target":{"type":"apiary","id":"a","name":"Garden"},"collaborator_name":"Bob",
               "created_at":"2026-01-01T00:00:00","accepted_at":"2026-01-02T00:00:00"}""",
            ShareOut::class.java,
        )
        val invitation = gson.fromJson(
            """{"id":"s","owner_name":"Alice","target":{"type":"hive","id":"h","name":"Hive 1"},
               "apiary_name":"Garden","created_at":"2026-01-01T00:00:00"}""",
            IncomingShareOut::class.java,
        )

        assertEquals("Bob", share.collaboratorName)
        assertEquals("apiary", share.target.type)
        assertEquals("Alice", invitation.ownerName)
        assertEquals("Garden", invitation.apiaryName)
    }

    @Test
    fun `an invitation request leaves the unused target out`() {
        val json = gson.toJson(ShareCreateRequest("bob@example.com", hiveId = "h1"))

        assertTrue(json.contains("\"hive_id\":\"h1\""))
        assertFalse(json.contains("apiary_id"))
    }

    // -- the server's own words ---------------------------------------------------------------

    @Test
    fun `the message of a refusal is read from the detail`() {
        assertEquals("Already invited.",
            serverMessageFrom("""{"detail":{"code":"SHARE_ALREADY_EXISTS","message":"Already invited."}}"""))
        assertEquals("Plain text.", serverMessageFrom("""{"detail":"Plain text."}"""))
    }

    @Test
    fun `anything unreadable gives no message`() {
        assertNull(serverMessageFrom(null))
        assertNull(serverMessageFrom(""))
        assertNull(serverMessageFrom("not json"))
        assertNull(serverMessageFrom("""{"other":1}"""))
        assertNull(serverMessageFrom("""{"detail":[{"msg":"list"}]}"""))
    }
}
