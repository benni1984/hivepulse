package com.hivepulse.app.ui.onboarding

import androidx.annotation.StringRes
import com.hivepulse.app.R

/**
 * The guided tours, as data — the Android half of #449.
 *
 * This file mirrors the website's `lib/tours.ts` one to one, deliberately: same ids, same order,
 * same wording. Put the three side by side and they read alike, which is the rule for Android and
 * the iPhone (`CLAUDE.md`, "Same navigation on Android and iOS") and `scripts/check_i18n.py`
 * enforces for the words themselves. `Tours.swift` is the third copy.
 *
 * What a tour *is* changed with this issue. The old one was a `HorizontalPager` of six screens
 * shown once after the first sign-in, describing features in the voice of a product page and then
 * gone for good — afterwards the beekeeper stood on a screen reading "No apiaries yet" with
 * nothing pointed at. These point at the real control, on the real screen, and wait for the real
 * tap.
 *
 * `anchor` is the whole coupling between a tour and the interface: a string passed to
 * `Modifier.tourAnchor(...)` on an actual composable. It is also the first thing that will rot —
 * somebody renames a screen, moves a button into a menu — so `ToursTest` pins every one of them
 * against the source, and the engine refuses to dim the screen with nothing lit.
 */
enum class TourAdvance {
    /** The step ends when the beekeeper taps *that* control. The default, and the point. */
    CLICK,

    /**
     * The step ends when the control is gone, because the only way that happens is that it was
     * used. For a row that opens another screen: watching for the tap on one of those costs the
     * iPhone its navigation, so both apps take the same way out and read alike.
     */
    NAVIGATES,

    /**
     * A small "next" for a step that only explains something and has nothing to tap. Used
     * sparingly: a tour made of these is the carousel again, and `ToursTest` forbids one.
     */
    MANUAL,
}

data class TourStep(
    /** The value passed to `Modifier.tourAnchor(...)` on the element to point at. */
    val anchor: String,
    @StringRes val text: Int,
    val advance: TourAdvance = TourAdvance.CLICK,
    /**
     * Where this step lives. The engine navigates here when a tour is started from somewhere
     * else — without it, every tour started from Settings would open on "the control for this
     * step is not on this screen", which is honest and useless.
     */
    val route: String? = null,
)

data class Tour(
    val id: String,
    @StringRes val title: Int,
    /** Shown in the list in Settings, so somebody can tell what they are about to be shown. */
    @StringRes val summary: Int,
    val steps: List<TourStep>,
)

/** Anchor names, in one place, so a screen and a tour cannot drift apart silently. */
object TourAnchors {
    const val NEW_APIARY = "new-apiary"
    const val APIARY_NAME = "apiary-name"
    const val APIARY_SAVE = "apiary-save"
    const val APIARY_OPEN = "apiary-open"
    const val NEW_HIVE = "new-hive"
    const val NEW_INSPECTION = "new-inspection"
    const val QR_BATCHES = "qr-batches"
    const val NEW_QR_BATCH = "new-qr-batch"
    const val SCAN_TAB = "scan-tab"
    const val HORNETS_TAB = "hornets-tab"
    const val TRAP_NEW = "trap-new"
    const val TRAP_NAME = "trap-name"
    const val TRAP_REGISTER = "trap-register"
    const val BEEKEEPING_YEAR = "beekeeping-year"
    const val YEAR_RATE = "year-rate"
    const val TREATMENTS = "treatments"
    const val TREATMENT_PLAN = "treatment-plan"
    const val SHARE_APIARY = "share-apiary"
    const val SHARING_INVITE = "sharing-invite"
    const val CUSTOM_FIELDS = "custom-fields"
    const val FIELD_NEW = "field-new"
    const val MOVE_HIVES = "move-hives"
    const val MOVES_OVERVIEW = "moves-overview"
}

val TOURS: List<Tour> = listOf(
    Tour(
        id = "first-steps",
        title = R.string.tour_first_steps_title,
        summary = R.string.tour_first_steps_summary,
        steps = listOf(
            TourStep(TourAnchors.NEW_APIARY, R.string.tour_first_steps_step1, route = "apiary_list"),
            TourStep(TourAnchors.APIARY_NAME, R.string.tour_first_steps_step2, TourAdvance.MANUAL),
            TourStep(TourAnchors.APIARY_SAVE, R.string.tour_first_steps_step3),
            TourStep(TourAnchors.APIARY_OPEN, R.string.tour_first_steps_step4, TourAdvance.NAVIGATES),
            TourStep(TourAnchors.NEW_HIVE, R.string.tour_first_steps_step5),
        ),
    ),
    Tour(
        id = "offline",
        title = R.string.tour_offline_title,
        summary = R.string.tour_offline_summary,
        steps = listOf(
            TourStep(TourAnchors.NEW_INSPECTION, R.string.tour_offline_step1, TourAdvance.MANUAL),
        ),
    ),
    Tour(
        id = "qr-codes",
        title = R.string.tour_qr_codes_title,
        summary = R.string.tour_qr_codes_summary,
        steps = listOf(
            TourStep(TourAnchors.QR_BATCHES, R.string.tour_qr_codes_step1, route = "apiary_list"),
            TourStep(TourAnchors.NEW_QR_BATCH, R.string.tour_qr_codes_step2),
            TourStep(TourAnchors.SCAN_TAB, R.string.tour_qr_codes_step3, TourAdvance.MANUAL),
        ),
    ),
    Tour(
        id = "hornets",
        title = R.string.tour_hornets_title,
        summary = R.string.tour_hornets_summary,
        steps = listOf(
            TourStep(TourAnchors.HORNETS_TAB, R.string.tour_hornets_step1),
            TourStep(TourAnchors.TRAP_NEW, R.string.tour_hornets_step2),
            TourStep(TourAnchors.TRAP_NAME, R.string.tour_hornets_step3, TourAdvance.MANUAL),
            TourStep(TourAnchors.TRAP_REGISTER, R.string.tour_hornets_step4),
        ),
    ),
    Tour(
        id = "year",
        title = R.string.tour_year_title,
        summary = R.string.tour_year_summary,
        steps = listOf(
            TourStep(TourAnchors.BEEKEEPING_YEAR, R.string.tour_year_step1, route = "apiary_list"),
            TourStep(TourAnchors.YEAR_RATE, R.string.tour_year_step2, TourAdvance.MANUAL),
        ),
    ),
    Tour(
        id = "treatments",
        title = R.string.tour_treatments_title,
        summary = R.string.tour_treatments_summary,
        steps = listOf(
            TourStep(TourAnchors.TREATMENTS, R.string.tour_treatments_step1),
            TourStep(TourAnchors.TREATMENT_PLAN, R.string.tour_treatments_step2),
        ),
    ),
    Tour(
        id = "sharing",
        title = R.string.tour_sharing_title,
        summary = R.string.tour_sharing_summary,
        steps = listOf(
            TourStep(TourAnchors.SHARE_APIARY, R.string.tour_sharing_step1),
            TourStep(TourAnchors.SHARING_INVITE, R.string.tour_sharing_step2, TourAdvance.MANUAL),
        ),
    ),
    Tour(
        id = "custom-fields",
        title = R.string.tour_custom_fields_title,
        summary = R.string.tour_custom_fields_summary,
        steps = listOf(
            TourStep(TourAnchors.CUSTOM_FIELDS, R.string.tour_custom_fields_step1),
            TourStep(TourAnchors.FIELD_NEW, R.string.tour_custom_fields_step2),
        ),
    ),
    Tour(
        id = "moves",
        title = R.string.tour_moves_title,
        summary = R.string.tour_moves_summary,
        steps = listOf(
            TourStep(TourAnchors.MOVE_HIVES, R.string.tour_moves_step1),
            TourStep(TourAnchors.MOVES_OVERVIEW, R.string.tour_moves_step2, TourAdvance.MANUAL, route = "apiary_list"),
        ),
    ),
)

fun tourById(id: String): Tour? = TOURS.firstOrNull { it.id == id }
