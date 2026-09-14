package com.hivepulse.app.data.api

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class FieldDefinitionDtoTest {

    @Test
    fun `FieldDefinitionUpdate omits null fields so the backend leaves them unchanged`() {
        val json = Gson().toJson(FieldDefinitionUpdate(name = "Weight", required = true))

        assertEquals("""{"name":"Weight","required":true}""", json)
    }

    @Test
    fun `FieldDefinitionUpdate includes options when given`() {
        val json = Gson().toJson(FieldDefinitionUpdate(options = listOf("A", "B")))

        assertEquals("""{"options":["A","B"]}""", json)
    }
}
