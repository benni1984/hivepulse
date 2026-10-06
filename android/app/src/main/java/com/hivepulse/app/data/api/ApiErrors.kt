package com.hivepulse.app.data.api

import com.google.gson.JsonParser
import retrofit2.HttpException
import retrofit2.Response

/**
 * The message the server wrote for a refused request, in the language the app asked for.
 *
 * The server answers `{"detail": {"code": "...", "message": "..."}}` (or a plain string), and
 * what a person should read is that message, not "HTTP 409 Conflict".
 */
fun serverMessageFrom(body: String?): String? {
    if (body.isNullOrBlank()) return null
    return runCatching {
        val detail = JsonParser.parseString(body).asJsonObject.get("detail") ?: return null
        when {
            detail.isJsonPrimitive -> detail.asString
            detail.isJsonObject -> detail.asJsonObject.get("message")?.asString
            else -> null
        }
    }.getOrNull()
}

fun HttpException.serverMessage(): String? =
    serverMessageFrom(runCatching { response()?.errorBody()?.string() }.getOrNull())

fun Response<*>.serverMessage(): String? =
    serverMessageFrom(runCatching { errorBody()?.string() }.getOrNull())
