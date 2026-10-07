package com.hivepulse.app.data.repository

import com.hivepulse.app.data.api.*
import com.hivepulse.app.data.local.OfflineCache
import com.hivepulse.app.data.local.isOffline
import com.google.gson.JsonParser
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HiveRepository @Inject constructor(
    private val api: ApiService,
    private val cache: OfflineCache,
) {

    suspend fun listForApiary(apiaryId: String): List<HiveOut> = try {
        api.listHives(apiaryId).items.also { cache.putHives(apiaryId, it) }
    } catch (e: Throwable) {
        if (e.isOffline()) cache.hivesForApiary(apiaryId).ifEmpty { throw e } else throw e
    }

    suspend fun get(id: String): HiveOut = try {
        api.getHive(id).also { cache.putHive(it) }
    } catch (e: Throwable) {
        if (e.isOffline()) cache.hive(id) ?: throw e else throw e
    }

    suspend fun initialize(request: HiveInitializeRequest): HiveOut =
        api.initializeHive(request)

    /** A hive made by hand, without a printed sticker. A refusal carries the server's own message. */
    suspend fun create(apiaryId: String, request: HiveCreateRequest): HiveOut =
        withServerMessage { api.createHive(apiaryId, request) }.also { cache.putHive(it) }

    suspend fun update(id: String, request: HiveUpdateRequest): HiveOut =
        api.updateHive(id, request).also { cache.putHive(it) }

    suspend fun delete(id: String) { api.deleteHive(id) }

    suspend fun getQrPng(id: String): ByteArray = api.getHiveQr(id).bytes()

    /** Scanning a hive QR code works offline as long as that hive was loaded before. */
    suspend fun resolveQR(token: String): QRScanResult = try {
        val body = api.resolveQR(token).string()
        val json = JsonParser.parseString(body).asJsonObject
        if (json.has("status") && json["status"].asString == "unlinked") {
            QRScanResult.Unlinked(json["token"].asString)
        } else {
            val hive = com.google.gson.Gson().fromJson(json, HiveOut::class.java)
            cache.putHive(hive)
            QRScanResult.Linked(hive)
        }
    } catch (e: Throwable) {
        if (!e.isOffline()) throw e
        val cached = cache.hiveByQrToken(token) ?: throw e
        QRScanResult.Linked(cached)
    }
}
