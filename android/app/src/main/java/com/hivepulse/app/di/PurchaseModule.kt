package com.hivepulse.app.di

import com.hivepulse.app.data.repository.PurchaseGateway
import com.hivepulse.app.data.repository.RevenueCatPurchaseGateway
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Its own module, and deliberately not part of `NetworkModule`: the instrumented tests uninstall
 * that one, so a binding placed there would vanish for every single one of them. `Gson` has its
 * own `SerializationModule` for the same reason (see "Verifying the Hilt graph" in CLAUDE.md).
 *
 * A UI test that needs a store that behaves replaces this binding with `@BindValue`, rather than
 * the whole module.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class PurchaseModule {

    @Binds
    @Singleton
    abstract fun bindPurchaseGateway(impl: RevenueCatPurchaseGateway): PurchaseGateway
}
