package com.hivepulse.app.ui.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.composed
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.hivepulse.app.R
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone500
import com.hivepulse.app.ui.theme.Stone900
import kotlinx.coroutines.delay

/**
 * The tour engine: it points at the real control and waits for the real tap (#449).
 *
 * On the website this is a DOM overlay. Here there is no DOM, so the targets report their own
 * position — `Modifier.tourAnchor(id)` registers the composable's bounds in the root — and the
 * overlay draws over the coordinates it is given. That is the whole difference between the two
 * engines, and the reason they could not be shared.
 *
 * **One canvas with the target cut out of it**, where the website draws four rectangles around
 * the target instead. The website needs the four because a `<div>` over a button swallows the
 * click; a Compose node with no pointer input of its own is not in the hit-test path at all, so
 * a single shade that lets touches through is both simpler and exactly as honest. The control
 * underneath stays tappable, stays in the accessibility tree, and nothing intercepts and replays
 * its click.
 *
 * **Three things the engine owes the beekeeper**, learned from how these go wrong:
 *
 *  1. **Never trap them.** A step waiting for a tap that cannot happen — a disabled button, a
 *     control two screens away — would otherwise sit there for ever. If the anchor has not
 *     reported itself within [FIND_TIMEOUT_MS] the overlay says so and offers to skip or leave.
 *  2. **Always escapable.** Every step shows a way out, and the system back button leaves.
 *  3. **Announce itself.** The caption is a live region, so TalkBack reads each new step.
 */
private const val FIND_TIMEOUT_MS = 2_500L

/** Breathing room between the lit control and the dark. */
private val PADDING = 6.dp

private val SHADE = Color(0xB3101410)

class TourController internal constructor(
    private val onNavigate: (String) -> Unit,
    private val onFinished: (String) -> Unit,
) {
    internal val anchors = mutableStateMapOf<String, Rect>()

    var activeId by mutableStateOf<String?>(null)
        private set
    var index by mutableIntStateOf(0)
        private set

    internal val tour: Tour? get() = activeId?.let { tourById(it) }
    internal val step: TourStep? get() = tour?.steps?.getOrNull(index)

    fun start(id: String) {
        val tour = tourById(id) ?: return
        // Take them to where the first step lives, before anything is drawn. Without this, every
        // tour started from Settings would open on "the control for this step is not on this
        // screen" — honest, and useless.
        tour.steps.firstOrNull()?.route?.let(onNavigate)
        index = 0
        activeId = id
    }

    fun stop() {
        activeId = null
    }

    fun next() {
        val tour = tour ?: return
        if (index + 1 >= tour.steps.size) {
            onFinished(tour.id)
            activeId = null
            return
        }
        index += 1
        step?.route?.let(onNavigate)
    }

    /** Called by [tourAnchor] when a control the current step points at is pressed. */
    internal fun tapped(anchor: String) {
        val step = step ?: return
        if (step.anchor == anchor && step.advance == TourAdvance.CLICK) next()
    }
}

val LocalTourController = staticCompositionLocalOf<TourController?> { null }

/**
 * Marks a composable as something a tour can point at.
 *
 * The press is observed in the **initial** pointer pass and never consumed, which is this
 * platform's equivalent of the website's capture-phase listener: the engine learns that the
 * control was pressed without standing between the finger and the button. Outside a [TourHost]
 * — which is every unit test and every preview — it costs nothing.
 */
@Suppress("DEPRECATION")
fun Modifier.tourAnchor(id: String): Modifier = composed {
    // `composed` and not `@Composable`: a modifier has to be usable wherever a modifier goes,
    // including argument lists that are not themselves a composable scope.
    val controller = LocalTourController.current ?: return@composed Modifier
    Modifier
        .onGloballyPositioned { controller.anchors[id] = it.boundsInRoot() }
        .pointerInput(id) {
            awaitPointerEventScope {
                while (true) {
                    val event = awaitPointerEvent(PointerEventPass.Initial)
                    if (event.changes.any { it.pressed }) controller.tapped(id)
                }
            }
        }
}

/**
 * Wraps the application's content and draws the overlay over it.
 *
 * It sits around the whole `NavHost` and the bottom bar, not inside a screen, so a tour can walk
 * from the apiary list to an apiary to a colony without losing its place — and so a step can
 * point at a bottom tab.
 */
@Composable
fun TourHost(
    onNavigate: (String) -> Unit,
    onFinished: (String) -> Unit,
    content: @Composable () -> Unit,
) {
    val controller = remember(onNavigate, onFinished) { TourController(onNavigate, onFinished) }

    CompositionLocalProvider(LocalTourController provides controller) {
        Box(Modifier.fillMaxSize()) {
            content()
            val tour = controller.tour
            val step = controller.step
            if (tour != null && step != null) TourOverlay(controller, tour, step)
        }
    }
}

@Composable
private fun TourOverlay(controller: TourController, tour: Tour, step: TourStep) {
    val rect = controller.anchors[step.anchor]
    var lost by remember(step.anchor, controller.index) { mutableStateOf(false) }

    BackHandler { controller.stop() }

    // The anchor may still be on its way: a route change, a list still loading, a form not opened
    // yet. Give it a moment, then say so rather than dimming at nothing.
    LaunchedEffect(step.anchor, controller.index) {
        lost = false
        delay(FIND_TIMEOUT_MS)
        if (controller.anchors[step.anchor] == null) lost = true
    }

    val counter = "${controller.index + 1}/${tour.steps.size}"
    val manual = step.advance == TourAdvance.MANUAL

    if (rect == null) {
        // Not a dark screen with nothing lit. Either we are still looking, or we have given up
        // and say so.
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            TourCard(
                text = if (lost) stringResource(R.string.tour_lost) else stringResource(step.text),
                counter = counter,
                nextLabel = if (lost) R.string.tour_skip_step else R.string.tour_next,
                onNext = when {
                    lost && controller.index + 1 < tour.steps.size -> ({ controller.next() })
                    !lost && manual -> ({ controller.next() })
                    else -> null
                },
                onStop = { controller.stop() },
                modifier = Modifier.padding(16.dp),
            )
        }
        return
    }

    val density = LocalDensity.current
    val pad = with(density) { PADDING.toPx() }
    val hole = Rect(
        left = (rect.left - pad).coerceAtLeast(0f),
        top = (rect.top - pad).coerceAtLeast(0f),
        right = rect.right + pad,
        bottom = rect.bottom + pad,
    )
    val cardTop = with(density) { hole.bottom.toDp() } + 12.dp

    Box(Modifier.fillMaxSize().testTag("tourOverlay")) {
        // No `pointerInput` here on purpose: a Compose node without one is not in the hit-test
        // path, so every touch reaches the control underneath, lit one included.
        // `BlendMode.Clear` only clears something: without its own offscreen layer it would
        // punch through to black instead of to the screen below.
        Canvas(
            Modifier
                .fillMaxSize()
                .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }
        ) {
            drawRect(SHADE)
            drawRoundRect(
                color = Color.Transparent,
                topLeft = Offset(hole.left, hole.top),
                size = Size(hole.width, hole.height),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(12f, 12f),
                blendMode = BlendMode.Clear,
            )
            drawRoundRect(
                color = Amber500,
                topLeft = Offset(hole.left, hole.top),
                size = Size(hole.width, hole.height),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(12f, 12f),
                style = Stroke(width = 2.dp.toPx()),
            )
        }

        TourCard(
            text = stringResource(step.text),
            counter = counter,
            nextLabel = R.string.tour_next,
            onNext = if (manual) ({ controller.next() }) else null,
            onStop = { controller.stop() },
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(top = cardTop, start = 12.dp, end = 12.dp),
        )
    }
}

@Composable
private fun TourCard(
    text: String,
    counter: String,
    nextLabel: Int,
    onNext: (() -> Unit)?,
    onStop: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier.testTag("tourCard"),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(
                text,
                style = MaterialTheme.typography.bodyMedium,
                color = Stone900,
                // So TalkBack reads each new step rather than leaving the overlay silent.
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
            )
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(counter, style = MaterialTheme.typography.labelSmall, color = Stone500)
                Spacer(Modifier.weight(1f))
                if (onNext != null) {
                    TextButton(onClick = onNext, modifier = Modifier.testTag("tourNext")) {
                        Text(stringResource(nextLabel), fontWeight = FontWeight.Bold, color = Stone900)
                    }
                }
                TextButton(onClick = onStop, modifier = Modifier.testTag("tourStop")) {
                    Text(stringResource(R.string.tour_close), color = Stone500)
                }
            }
        }
    }
}
