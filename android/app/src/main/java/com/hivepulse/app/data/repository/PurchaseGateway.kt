package com.hivepulse.app.data.repository

import android.app.Activity
import android.content.Context
import com.hivepulse.app.BuildConfig
import com.revenuecat.purchases.LogLevel
import com.revenuecat.purchases.PurchaseParams
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration
import com.revenuecat.purchases.PurchasesTransactionException
import com.revenuecat.purchases.awaitLogIn
import com.revenuecat.purchases.awaitLogOut
import com.revenuecat.purchases.awaitOfferings
import com.revenuecat.purchases.awaitPurchase
import com.revenuecat.purchases.awaitRestore
import com.revenuecat.purchases.awaitShowManageSubscriptions
import javax.inject.Inject
import javax.inject.Singleton

/**
 * One tier offered for sale, as the paywall needs it.
 *
 * Deliberately ours rather than RevenueCat's `Package`: the screen and its view model never see a
 * vendor type, which is what lets `SupporterViewModelTest` run without a store and what would make
 * a later move to plain Play Billing a change to this file. The iPhone has the same type with the
 * same three fields (`SupporterOffer` in `PurchaseService.swift`).
 */
data class SupporterOffer(
    /** RevenueCat's package identifier; the gateway maps it back to the real package. */
    val id: String,
    val title: String,
    /** Already formatted by Play, in the currency of the signed-in Play account. Never formatted
     *  here: the price somebody is shown has to be the price Play will charge. */
    val price: String,
)

/** A dismissed sheet is an outcome, not an error. Showing it as one tells somebody who simply
 *  changed their mind that something went wrong. */
enum class PurchaseOutcome { BOUGHT, CANCELLED }

/**
 * Buying the supporter subscription on Android.
 *
 * The store sells; the server decides. RevenueCat verifies the purchase and tells the backend
 * through its webhook, the backend writes `subscriptions`, and `is_supporter` is derived from that
 * table -- so what this does is take money and then ask the server to catch up. It never decides
 * anybody's access (api-contract.md, "What the apps implement").
 */
interface PurchaseGateway {
    /** False in a build with no key. The paywall then says it cannot be bought here, rather than
     *  showing an empty list and looking broken. */
    val canSell: Boolean

    suspend fun offers(): List<SupporterOffer>

    /** Play needs the Activity that starts the purchase; its launch mode must be `standard` or
     *  `singleTop`, which `MainActivity`'s is. */
    suspend fun buy(activity: Activity, offer: SupporterOffer): PurchaseOutcome

    /** True when the restore found a subscription that grants access. */
    suspend fun restore(): Boolean

    /** Hands over to Play. The app cannot cancel a store subscription and must not pretend to. */
    suspend fun manageSubscription(context: Context)

    /** Binds the SDK to the signed-in account, on every way in. RevenueCat's `app_user_id` is the
     *  HivePulse `user.id` and nothing else, because the webhook matches on it; a purchase made
     *  while the SDK still holds an anonymous id is a payment attached to no account. */
    suspend fun identify(userId: String)

    /** On sign-out, or the next person to use this phone inherits the subscription. */
    suspend fun forget()
}

@Singleton
class RevenueCatPurchaseGateway @Inject constructor() : PurchaseGateway {

    /** The packages last fetched, by identifier. The screen hands back a [SupporterOffer] and the
     *  purchase needs the real `Package` -- keeping the map here is what keeps the vendor type out
     *  of the UI. */
    private var packages: Map<String, com.revenuecat.purchases.Package> = emptyMap()

    override val canSell: Boolean get() = Purchases.isConfigured

    override suspend fun offers(): List<SupporterOffer> {
        if (!canSell) return emptyList()
        // The current offering, not a named product: a price or a product can then change in the
        // dashboard without a release.
        val available = Purchases.sharedInstance.awaitOfferings().current?.availablePackages.orEmpty()
        packages = available.associateBy { it.identifier }
        return available.map {
            SupporterOffer(
                id = it.identifier,
                title = it.product.title,
                price = it.product.price.formatted,
            )
        }
    }

    override suspend fun buy(activity: Activity, offer: SupporterOffer): PurchaseOutcome {
        val pkg = packages[offer.id] ?: return PurchaseOutcome.CANCELLED
        return try {
            Purchases.sharedInstance.awaitPurchase(PurchaseParams.Builder(activity, pkg).build())
            PurchaseOutcome.BOUGHT
        } catch (e: PurchasesTransactionException) {
            // RevenueCat throws for a cancellation too, and tells it apart only by this flag.
            // Reading it is what keeps a dismissed sheet from being reported as a failure.
            if (e.userCancelled) PurchaseOutcome.CANCELLED else throw e
        }
    }

    override suspend fun restore(): Boolean {
        if (!canSell) return false
        return Purchases.sharedInstance.awaitRestore()
            .entitlements[ENTITLEMENT]?.isActive == true
    }

    override suspend fun manageSubscription(context: Context) {
        if (!canSell) return
        Purchases.sharedInstance.awaitShowManageSubscriptions(context)
    }

    override suspend fun identify(userId: String) {
        if (!canSell || Purchases.sharedInstance.appUserID == userId) return
        // Swallowed on purpose. Failing to bind is not fatal: the account stays signed in, the
        // webhook knows what it knew, and the next launch tries again. What it would cost is a
        // purchase made in *this* session going unattributed -- which is why the paywall binds
        // again before it offers anything.
        runCatching { Purchases.sharedInstance.awaitLogIn(userId) }
    }

    override suspend fun forget() {
        if (!canSell) return
        runCatching { Purchases.sharedInstance.awaitLogOut() }
    }

    companion object {
        /** The entitlement the backend already uses by that name (`REVENUECAT_ENTITLEMENT`). */
        const val ENTITLEMENT = "supporter"

        /**
         * Configures the SDK once, if there is a key. Called from [com.hivepulse.app.HivePulseApplication].
         *
         * `Purchases.sharedInstance` throws when the SDK was never configured, so every call above
         * goes through [canSell] first. A missing key must leave the rest of the app untouched --
         * the same position the backend takes with no RevenueCat key at all, and the one a missing
         * Sentry DSN already takes here.
         */
        fun configureIfPossible(context: Context) {
            if (Purchases.isConfigured || BuildConfig.REVENUECAT_PUBLIC_KEY.isEmpty()) return
            Purchases.logLevel = if (BuildConfig.DEBUG) LogLevel.WARN else LogLevel.ERROR
            Purchases.configure(
                PurchasesConfiguration.Builder(context, BuildConfig.REVENUECAT_PUBLIC_KEY).build()
            )
        }
    }
}
