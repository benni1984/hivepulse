# R8 rules for the release build (isMinifyEnabled = true in build.gradle.kts).
#
# Most libraries ship their own consumer rules (Hilt, Room, WorkManager, Retrofit, OkHttp, Gson,
# Sentry, Firebase, ML Kit, Coil, Credential Manager); only what is ours, or what a library
# leaves out, belongs here. The debug build and the unit tests never run R8, so a missing rule
# shows up only in the release build: CI builds it (assembleRelease) and the manual
# "Android release smoke test" workflow runs it on an emulator against staging.

# ── Crash reports ──────────────────────────────────────────────────────────────
# Play Console deobfuscates stack traces with the mapping file that travels inside the bundle;
# keeping file names and line numbers is what makes them readable afterwards.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Gson and Retrofit read generic types and annotations at runtime ────────────
-keepattributes Signature,InnerClasses,EnclosingMethod,*Annotation*

# ── Everything Gson turns into JSON or back ────────────────────────────────────
# The request and response classes in data/api go over the network AND are stored as JSON in
# Room (the offline cache and the queue of inspections recorded without a connection).
# Gson matches by field name, so those names must survive R8: a renamed field would break
# every API call, and an inspection queued by the unminified 1.0.0 build would be unreadable
# after the update. The constructors stay so Gson builds the objects the way it does in debug.
# New classes that are serialised with Gson belong in this package; ReleaseBuildConfigTest
# fails when one is somewhere else.
-keepclassmembers class com.hivepulse.app.data.api.** {
    <init>(...);
    <fields>;
}

# A generic response class needs the class itself kept, not just its members. Gson works out what
# `items: List<T>` holds from the Signature attribute of the class, and R8 drops that attribute
# on a class that is only partly kept. The first smoke-test run showed it: login worked, but every
# list the app shows (apiaries, hives, inspections, QR batches, sightings, admin) arrived as raw
# maps and the screen said "No apiaries yet". Every generic class in data/api needs a line like
# this one; ProguardRulesTest fails when one is missing.
-keep class com.hivepulse.app.data.api.PaginatedResponse {
    <init>(...);
    <fields>;
}

# ── Encrypted token storage ────────────────────────────────────────────────────
# androidx.security-crypto uses Tink, whose key classes are protobuf messages that are
# read by field name. Without this the stored login token cannot be opened again.
-keepclassmembers class * extends com.google.crypto.tink.shaded.protobuf.GeneratedMessageLite {
    <fields>;
}
-dontwarn com.google.errorprone.annotations.**
-dontwarn javax.annotation.**
-dontwarn com.google.api.client.http.**
-dontwarn org.joda.time.**
