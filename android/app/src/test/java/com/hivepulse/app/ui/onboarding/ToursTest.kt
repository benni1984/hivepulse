package com.hivepulse.app.ui.onboarding

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Every step of every tour points at a control that exists (#449).
 *
 * `tourAnchor(...)` is the whole coupling between a tour and the interface, and it is the first
 * thing that will rot: somebody renames a screen, moves a button into an overflow menu, replaces
 * an `IconButton` with a row, and a step now points at nothing. The engine degrades honestly when
 * that happens — it says the control is not on this screen and offers to leave — but an honest
 * dead end is still a dead end, and nobody would find out until a beekeeper did.
 *
 * So the anchors are pinned here against the source, the way the website pins its own in
 * `__tests__/Tours.test.ts`.
 */
class ToursTest {

    private val sources: List<String> by lazy {
        // The unit tests run from `android/app`, the sources are under `src/main`.
        File("src/main/java").walkTopDown()
            .filter { it.isFile && it.extension == "kt" }
            .map { it.readText() }
            .toList()
    }

    @Test
    fun `there are tours to check`() {
        // A fixture check: an empty TOURS would make every assertion below pass.
        assertTrue(TOURS.size >= 9)
        assertTrue(TOURS.sumOf { it.steps.size } > 10)
        assertTrue("found ${sources.size} sources", sources.size > 20)
    }

    @Test
    fun `points every step at a control that exists`() {
        val missing = mutableListOf<String>()
        for (tour in TOURS) {
            for ((i, step) in tour.steps.withIndex()) {
                val constant = TourAnchors::class.java.declaredFields
                    .firstOrNull { field ->
                        field.isAccessible = true
                        field.get(TourAnchors) == step.anchor
                    }?.name
                val used = constant != null &&
                    sources.any { it.contains("tourAnchor(TourAnchors.$constant)") }
                // The first row of the apiary list is anchored through a parameter rather than
                // by the constant's name, because marking all ten rows would say nothing.
                val viaParameter = step.anchor == TourAnchors.APIARY_OPEN &&
                    sources.any { it.contains("tourAnchorId = if (index == 0)") }
                if (!used && !viaParameter) {
                    missing += "${tour.id} step ${i + 1}: nothing carries ${step.anchor}"
                }
            }
        }
        assertEquals(missing.joinToString("\n  "), emptyList<String>(), missing)
    }

    @Test
    fun `has an id that is unique, because the engine looks them up by it`() {
        val ids = TOURS.map { it.id }
        assertEquals(ids.size, ids.toSet().size)
        for (id in ids) assertEquals(id, tourById(id)?.id)
    }

    @Test
    fun `knows nothing about an id that does not exist`() {
        // The list in Settings and the first sign-in both start a tour by name; an unknown one
        // must come back null rather than throw at the beekeeper.
        assertEquals(null, tourById("no-such-tour"))
    }

    @Test
    fun `is mostly made of real taps, not of a next button`() {
        // The whole point is to point at a control and wait. A tour of nothing but MANUAL steps
        // is the carousel we are replacing, wearing an overlay.
        for (tour in TOURS) {
            if (tour.steps.size <= 1) continue
            val real = tour.steps.count { it.advance != TourAdvance.MANUAL }
            assertTrue("${tour.id} is all \"next\" steps", real > 0)
        }
    }

    @Test
    fun `starts each tour on a screen it can name`() {
        // A tour started from Settings has to take the beekeeper somewhere first. Every tour's
        // first step therefore carries a route, unless it begins on a bottom tab, which is
        // reachable from wherever they are.
        val tabs = setOf(TourAnchors.HORNETS_TAB, TourAnchors.SCAN_TAB)
        for (tour in TOURS) {
            val first = tour.steps.first()
            assertTrue(
                "${tour.id} starts nowhere in particular",
                first.route != null || first.anchor in tabs ||
                    // These begin on a screen the beekeeper has to be on already: an apiary, a
                    // colony. Navigating there would need an id the list in Settings has not got.
                    tour.id in setOf("offline", "treatments", "sharing", "custom-fields", "moves"),
            )
        }
    }

    @Test
    fun `matches the website, tour for tour`() {
        // The three clients carry the same nine, in the same order. A tenth added on one
        // platform only is the kind of difference a store reviewer sees and a beekeeper
        // complains about.
        assertEquals(
            listOf(
                "first-steps", "offline", "qr-codes", "hornets", "year",
                "treatments", "sharing", "custom-fields", "moves",
            ),
            TOURS.map { it.id },
        )
    }
}
