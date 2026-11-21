package com.hivepulse.app.ui.supporter

import android.app.Activity
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.grantsAccess
import com.hivepulse.app.data.repository.AuthRepository
import com.hivepulse.app.data.repository.PurchaseGateway
import com.hivepulse.app.data.repository.PurchaseOutcome
import com.hivepulse.app.data.repository.SubscriptionRepository
import com.hivepulse.app.data.repository.SupporterOffer
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// ─── State ───────────────────────────────────────────────────────────────────

/**
 * What the paywall is showing. A sealed hierarchy rather than a handful of booleans, because the
 * states genuinely exclude each other and the combinations booleans allow -- "already a supporter
 * and also here are three prices" -- are the ones that look broken. The iPhone has the same five
 * (`SupporterScreenState` in `SupporterViewModel.swift`).
 */
sealed interface SupporterScreenState {
    data object Loading : SupporterScreenState

    /** Nothing to buy here: no key in this build, or a configured store with no products. Both end
     *  in the same sentence, because to the person reading it they are the same thing. */
    data object Unavailable : SupporterScreenState

    data class Offers(val offers: List<SupporterOffer>) : SupporterScreenState

    /** Already paid for, from any of the four sources -- a web purchase and an admin grant
     *  included. The paywall must not try to sell to somebody who already bought. */
    data object AlreadySupporter : SupporterScreenState

    data class Failed(val message: String) : SupporterScreenState
}

data class SupporterUiState(
    val screen: SupporterScreenState = SupporterScreenState.Loading,
    /** The offer at the till, so its row can show a spinner and the others can be disabled. */
    val buying: SupporterOffer? = null,
    /** Shown as a transient notice rather than as a failed screen: the paywall is still usable
     *  after a restore that found nothing. */
    val notice: String? = null,
    /** Set once, when a purchase or restore actually unlocked something. */
    val didUnlock: Boolean = false,
)

// ─── ViewModel ───────────────────────────────────────────────────────────────

@HiltViewModel
class SupporterViewModel @Inject constructor(
    private val purchases: PurchaseGateway,
    private val subscriptions: SubscriptionRepository,
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(SupporterUiState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(screen = SupporterScreenState.Loading) }

        // Binding before offering, every time. `identify` is cheap when the id already matches,
        // and a purchase made while the SDK holds an anonymous id is a payment attached to no
        // account -- the one failure in this feature that costs somebody money.
        runCatching { auth.getMe() }.getOrNull()?.let { purchases.identify(it.id) }

        // Asked first, because somebody who bought on the website or was granted it by hand must
        // not be sold the same thing again.
        val current = runCatching { subscriptions.mine() }.getOrNull()
        if (current != null && current.grantsAccess) {
            _state.update { it.copy(screen = SupporterScreenState.AlreadySupporter) }
            return@launch
        }

        // Two things have to be true to show a price: this deployment is allowed to sell, which
        // only the server knows, and this build has a key, which only the app knows.
        //
        // **No answer counts as "no".** The honest reading of silence is "unknown", and the whole
        // point of the switch is that going live is an act somebody performs rather than something
        // a failed request can bring about (#530). The cost is that a connection problem hides the
        // prices for a moment; the cost the other way round is taking money a week early, in a
        // store whose products are not approved yet.
        if (current?.storeCheckoutEnabled != true || !purchases.canSell) {
            _state.update { it.copy(screen = SupporterScreenState.Unavailable) }
            return@launch
        }

        runCatching { purchases.offers() }
            .onSuccess { offers ->
                _state.update {
                    it.copy(
                        screen = if (offers.isEmpty()) SupporterScreenState.Unavailable
                                 else SupporterScreenState.Offers(offers)
                    )
                }
            }
            .onFailure { e ->
                _state.update {
                    it.copy(screen = SupporterScreenState.Failed(e.message ?: e.cause?.message ?: ""))
                }
            }
    }

    fun buy(activity: Activity, offer: SupporterOffer) = viewModelScope.launch {
        if (_state.value.buying != null) return@launch
        _state.update { it.copy(buying = offer) }
        runCatching { purchases.buy(activity, offer) }
            .onSuccess { outcome ->
                _state.update { it.copy(buying = null) }
                // A cancellation is somebody changing their mind. Saying so would tell them
                // something went wrong when nothing did.
                if (outcome == PurchaseOutcome.BOUGHT) settle()
            }
            .onFailure { e ->
                _state.update {
                    it.copy(buying = null, notice = e.message ?: e.cause?.message)
                }
            }
    }

    fun restore() = viewModelScope.launch {
        if (_state.value.buying != null) return@launch
        runCatching { purchases.restore() }
            .onSuccess { found ->
                if (found) settle() else _state.update { it.copy(notice = NOTHING_RESTORED) }
            }
            .onFailure { e ->
                _state.update { it.copy(notice = e.message ?: e.cause?.message) }
            }
    }

    fun manageSubscription(activity: Activity) = viewModelScope.launch {
        runCatching { purchases.manageSubscription(activity) }
            .onFailure { e -> _state.update { it.copy(notice = e.message ?: e.cause?.message) } }
    }

    fun dismissNotice() = _state.update { it.copy(notice = null) }

    /**
     * The store says it is paid for; now the server has to agree, because the server is what every
     * client reads.
     *
     * A failed sync is deliberately **not** a failed purchase. The webhook is the authority and
     * arrives within seconds anyway; reporting our own failed request as a failed payment would be
     * a lie that costs a support mail -- and a second charge if they believed it and bought again.
     */
    private suspend fun settle() {
        runCatching { subscriptions.sync() }
        _state.update { it.copy(didUnlock = true, screen = SupporterScreenState.AlreadySupporter) }
    }

    companion object {
        /** A marker the screen turns into the translated sentence. The view model holds no
         *  Context, so it cannot resolve a string resource itself. */
        const val NOTHING_RESTORED = "restore.nothing"
    }
}

// ─── Screen ──────────────────────────────────────────────────────────────────

/** The six the website lists under the supporter plan, in one place so the two do not drift into
 *  two different promises. Same six on the iPhone. */
private val BENEFITS = listOf(
    R.string.supporter_benefit_colonies,
    R.string.supporter_benefit_history,
    R.string.supporter_benefit_treatments,
    R.string.supporter_benefit_fields,
    R.string.supporter_benefit_sharing,
    R.string.supporter_benefit_map,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupporterScreen(
    onBack: () -> Unit,
    /** Called when something actually unlocked, so the screen underneath can re-read the account
     *  rather than keep showing a gate over a feature that is now paid for. */
    onUnlock: () -> Unit = {},
    viewModel: SupporterViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    val activity = context as? Activity

    LaunchedEffect(state.didUnlock) { if (state.didUnlock) onUnlock() }

    state.notice?.let { notice ->
        val text = if (notice == SupporterViewModel.NOTHING_RESTORED) {
            stringResource(R.string.supporter_restore_nothing)
        } else {
            notice
        }
        AlertDialog(
            onDismissRequest = viewModel::dismissNotice,
            title = { Text(stringResource(R.string.supporter_notice)) },
            text = { Text(text) },
            confirmButton = {
                TextButton(onClick = viewModel::dismissNotice) {
                    Text(stringResource(R.string.action_done))
                }
            },
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.supporter_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null)
                    }
                },
            )
        }
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Header()

            when (val screen = state.screen) {
                SupporterScreenState.Loading -> CircularProgressIndicator(Modifier.padding(32.dp))

                is SupporterScreenState.Offers -> {
                    Benefits()
                    screen.offers.forEach { offer ->
                        Button(
                            onClick = { activity?.let { viewModel.buy(it, offer) } },
                            enabled = state.buying == null && activity != null,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(offer.title, Modifier.weight(1f))
                            if (state.buying == offer) {
                                CircularProgressIndicator(
                                    Modifier.size(18.dp),
                                    color = MaterialTheme.colorScheme.onPrimary,
                                )
                            } else {
                                Text(offer.price, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    Text(
                        stringResource(R.string.supporter_cancel_anytime),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }

                SupporterScreenState.AlreadySupporter -> Active(
                    onManage = { activity?.let { viewModel.manageSubscription(it) } }
                )

                SupporterScreenState.Unavailable -> {
                    Benefits()
                    Unavailable()
                }

                is SupporterScreenState.Failed -> Failed(
                    message = screen.message,
                    onRetry = { viewModel.load() },
                )
            }

            // Reachable in every state, including before anything has been bought: somebody who
            // reinstalled or changed phone has no other way back to what they paid for.
            TextButton(onClick = viewModel::restore, enabled = state.buying == null) {
                Text(stringResource(R.string.supporter_restore))
            }
        }
    }
}

@Composable
private fun Header() {
    Icon(
        Icons.Default.Star,
        contentDescription = null,
        tint = MaterialTheme.colorScheme.primary,
        modifier = Modifier.size(44.dp),
    )
    Text(
        stringResource(R.string.supporter_heading),
        style = MaterialTheme.typography.titleLarge,
        textAlign = TextAlign.Center,
    )
    Text(
        stringResource(R.string.supporter_intro),
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center,
    )
}

@Composable
private fun Benefits() {
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            BENEFITS.forEach { benefit ->
                Row(verticalAlignment = Alignment.Top) {
                    Icon(
                        Icons.Default.Check,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp),
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(stringResource(benefit), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}

@Composable
private fun Active(onManage: () -> Unit) {
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                Icons.Default.Verified,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(32.dp),
            )
            Text(
                stringResource(R.string.supporter_active_title),
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                stringResource(R.string.supporter_active_desc),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(4.dp))
            Button(onClick = onManage) { Text(stringResource(R.string.supporter_manage)) }
        }
    }
}

/** No key in this build, or a store with nothing in it. Deliberately the same sentence as the
 *  website shows when it cannot sell: the reason differs, what somebody can do about it does not. */
@Composable
private fun Unavailable() {
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                stringResource(R.string.supporter_unavailable_title),
                style = MaterialTheme.typography.titleSmall,
            )
            Text(
                stringResource(R.string.supporter_unavailable_desc),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun Failed(message: String, onRetry: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Button(onClick = onRetry) { Text(stringResource(R.string.supporter_retry)) }
    }
}
