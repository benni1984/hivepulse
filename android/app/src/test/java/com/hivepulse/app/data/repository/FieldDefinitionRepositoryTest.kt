package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Test

class FieldDefinitionRepositoryTest {

    private val api = mockk<ApiService>()
    private val repo = FieldDefinitionRepository(api)

    @After fun tearDown() = clearAllMocks()

    @Test
    fun `list without apiary uses the user scope`() = runTest {
        coEvery { api.listFieldDefinitions() } returns listOf(fd("f1"))

        assertEquals(listOf(fd("f1")), repo.list(null))
        coVerify(exactly = 0) { api.listApiaryFieldDefinitions(any()) }
    }

    @Test
    fun `list with apiary uses the apiary scope`() = runTest {
        coEvery { api.listApiaryFieldDefinitions("a1") } returns listOf(fd("f1"))

        assertEquals(listOf(fd("f1")), repo.list("a1"))
        coVerify(exactly = 0) { api.listFieldDefinitions() }
    }

    @Test
    fun `create routes by scope`() = runTest {
        val body = FieldDefinitionCreate("inspection", "Temper", "text", emptyList(), false, 0)
        coEvery { api.createFieldDefinition(body) } returns fd("user")
        coEvery { api.createApiaryFieldDefinition("a1", body) } returns fd("apiary")

        assertEquals("user", repo.create(null, body).id)
        assertEquals("apiary", repo.create("a1", body).id)
    }

    @Test
    fun `update routes by scope`() = runTest {
        val body = FieldDefinitionUpdate(name = "Renamed")
        coEvery { api.updateFieldDefinition("f1", body) } returns fd("f1")
        coEvery { api.updateApiaryFieldDefinition("a1", "f2", body) } returns fd("f2")

        repo.update(null, "f1", body)
        repo.update("a1", "f2", body)

        coVerify { api.updateFieldDefinition("f1", body) }
        coVerify { api.updateApiaryFieldDefinition("a1", "f2", body) }
    }

    @Test
    fun `delete routes by scope`() = runTest {
        coEvery { api.deleteFieldDefinition("f1") } returns response(ok = true)
        coEvery { api.deleteApiaryFieldDefinition("a1", "f2") } returns response(ok = true)

        repo.delete(null, "f1")
        repo.delete("a1", "f2")

        coVerify { api.deleteFieldDefinition("f1") }
        coVerify { api.deleteApiaryFieldDefinition("a1", "f2") }
    }

    @Test
    fun `delete throws on error response`() = runTest {
        coEvery { api.deleteFieldDefinition("f1") } returns response(ok = false, code = 404)

        val ex = runCatching { repo.delete(null, "f1") }.exceptionOrNull()

        assertEquals("delete_failed_404", ex?.message)
    }

    private fun response(ok: Boolean, code: Int = 204) = mockk<retrofit2.Response<Unit>> {
        every { isSuccessful } returns ok
        every { code() } returns code
    }

    private fun fd(id: String) = FieldDefinitionOut(id, "user", null, "inspection", "Field $id", "text", emptyList(), false, 0)
}
