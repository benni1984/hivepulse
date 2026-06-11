package com.hivepulse.app.ui.inspections

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hivepulse.app.R
import com.hivepulse.app.data.api.FieldDefinitionOut
import com.hivepulse.app.data.api.InspectionCreateRequest
import com.hivepulse.app.data.api.InspectionOut
import com.hivepulse.app.data.repository.ApiaryRepository
import com.hivepulse.app.data.repository.HiveRepository
import com.hivepulse.app.data.repository.InspectionRepository
import com.hivepulse.app.ui.common.*
import com.hivepulse.app.ui.hives.ExposedDropdownMenuForList
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

data class InspectionFormState(
    val existing: InspectionOut? = null,
    val fieldDefs: List<FieldDefinitionOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false,
)

@HiltViewModel
class InspectionFormViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: InspectionRepository,
    private val hiveRepo: HiveRepository,
    private val apiaryRepo: ApiaryRepository,
) : ViewModel() {
    val hiveId       = savedState.get<String>("hiveId")!!
    val inspectionId = savedState.get<String>("inspectionId")?.ifEmpty { null }
    private val _state = MutableStateFlow(InspectionFormState())
    val state = _state.asStateFlow()

    init { loadFieldDefs() }

    private fun loadFieldDefs() = viewModelScope.launch {
        runCatching {
            val hive = hiveRepo.get(hiveId)
            val userDefs   = repo.listFieldDefinitions().filter { it.target == "inspection" }
            val apiaryDefs = apiaryRepo.fieldDefinitions(hive.apiaryId).filter { it.target == "inspection" }
            _state.update { it.copy(fieldDefs = (userDefs + apiaryDefs).sortedBy { d -> d.sortOrder }) }
        }
    }

    fun save(request: InspectionCreateRequest) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching {
            if (inspectionId == null) repo.create(hiveId, request)
            else repo.update(inspectionId, request)
        }
        .onSuccess { _state.update { it.copy(isLoading = false, saved = true) } }
        .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

private val moodOptions    = listOf("calm", "nervous", "aggressive")
private val moodLabels     = listOf("😌 Calm", "😤 Nervous", "😡 Aggressive")
private val queenColorKeys = listOf("white", "yellow", "red", "green", "blue")
private val feedingTypes   = listOf("sugar syrup", "fondant", "pollen substitute", "other")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionFormScreen(
    hiveId: String,
    inspectionId: String?,
    onSaved: () -> Unit,
    onBack: () -> Unit,
    vm: InspectionFormViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    LaunchedEffect(state.saved) { if (state.saved) onSaved() }

    val df = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }

    // Date
    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState(initialSelectedDateMillis = System.currentTimeMillis())
    var date by remember { mutableStateOf(df.format(Date())) }

    // Queen
    var queenSeenIdx    by remember { mutableStateOf<Int?>(null) }  // 0=unknown,1=yes,2=no
    var queenColor      by remember { mutableStateOf<String?>(null) }

    // Frames
    var broodFrames     by remember { mutableStateOf(0) }
    var honeyFrames     by remember { mutableStateOf(0) }

    // Colony
    var moodIdx         by remember { mutableStateOf<Int?>(null) }
    var populationIdx   by remember { mutableStateOf<Int?>(null) }  // 0=low,1=medium,2=high
    var swarmCellsIdx   by remember { mutableStateOf<Int?>(null) }  // 0=?,1=yes,2=no

    // Varroa
    var varroaCount     by remember { mutableStateOf(0) }

    // Treatment
    var treatment       by remember { mutableStateOf("") }
    var feedingIdx      by remember { mutableStateOf<Int?>(null) }  // 0=?,1=yes,2=no
    var feedingTypeIdx  by remember { mutableStateOf<Int?>(null) }

    // Weight & notes
    var weightKg        by remember { mutableStateOf("") }
    var notes           by remember { mutableStateOf("") }

    val customValues    = remember { mutableStateMapOf<String, String>() }

    // Helpers to convert toggle indices to API values
    fun queenSeenBool()  = when (queenSeenIdx)  { 1 -> true; 2 -> false; else -> null }
    fun swarmCellsBool() = when (swarmCellsIdx) { 1 -> true; 2 -> false; else -> null }
    fun feedingBool()    = when (feedingIdx)    { 1 -> true; 2 -> false; else -> null }
    fun populationInt()  = when (populationIdx) { 0 -> 1; 1 -> 5; 2 -> 9; else -> null }

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        date = df.format(Date(millis))
                    }
                    showDatePicker = false
                }) { Text(stringResource(R.string.action_save)) }
            },
            dismissButton = { TextButton(onClick = { showDatePicker = false }) { Text(stringResource(R.string.action_cancel)) } }
        ) { DatePicker(state = datePickerState) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(if (inspectionId == null) stringResource(R.string.action_new_inspection)
                         else stringResource(R.string.action_edit_inspection))
                },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        Column(
            Modifier
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            state.error?.let { ErrorBanner(it) { vm.clearError() } }

            // ── Date ────────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_date))
            SectionCard {
                OutlinedButton(
                    onClick  = { showDatePicker = true },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape    = MaterialTheme.shapes.medium,
                ) {
                    Icon(Icons.Default.CalendarToday, contentDescription = null, Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(date, style = MaterialTheme.typography.titleMedium)
                }
            }

            // ── Queen ────────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_queen))
            SectionCard {
                ToggleButtonGroup(
                    label    = stringResource(R.string.field_queen_seen),
                    options  = listOf("?", "✓ Yes", "✗ No"),
                    selected = queenSeenIdx,
                    onSelect = { queenSeenIdx = it },
                    allowNone = true,
                )
                ColorChipRow(
                    label    = stringResource(R.string.field_queen_color),
                    selected = queenColor,
                    onSelect = { queenColor = if (queenColor == it) null else it },
                )
            }

            // ── Frames ───────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_frames))
            SectionCard {
                NumberStepper(label = stringResource(R.string.field_brood_frames), value = broodFrames,
                    onValueChange = { broodFrames = it }, min = 0, max = 10)
                NumberStepper(label = stringResource(R.string.field_honey_frames), value = honeyFrames,
                    onValueChange = { honeyFrames = it }, min = 0, max = 10)
            }

            // ── Colony ───────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_colony))
            SectionCard {
                ToggleButtonGroup(
                    label    = stringResource(R.string.field_mood),
                    options  = moodLabels,
                    selected = moodIdx,
                    onSelect = { moodIdx = it },
                    allowNone = true,
                )
                ToggleButtonGroup(
                    label    = stringResource(R.string.field_population_strength),
                    options  = listOf("Low", "Medium", "High"),
                    selected = populationIdx,
                    onSelect = { populationIdx = it },
                    allowNone = true,
                )
                ToggleButtonGroup(
                    label    = stringResource(R.string.field_swarm_cells_seen),
                    options  = listOf("?", "✓ Yes", "✗ No"),
                    selected = swarmCellsIdx,
                    onSelect = { swarmCellsIdx = it },
                    allowNone = true,
                )
            }

            // ── Varroa ───────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_varroa))
            SectionCard {
                NumberStepper(label = stringResource(R.string.field_varroa_count), value = varroaCount,
                    onValueChange = { varroaCount = it }, min = 0, max = 999)
            }

            // ── Treatment ────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_treatment))
            SectionCard {
                OutlinedTextField(
                    value = treatment, onValueChange = { treatment = it },
                    label = { Text(stringResource(R.string.field_treatment_applied)) },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                )
                ToggleButtonGroup(
                    label    = stringResource(R.string.field_feeding_done),
                    options  = listOf("?", "✓ Yes", "✗ No"),
                    selected = feedingIdx,
                    onSelect = { feedingIdx = it },
                    allowNone = true,
                )
                if (feedingIdx == 1) {
                    ToggleButtonGroup(
                        label    = stringResource(R.string.field_feeding_type),
                        options  = feedingTypes,
                        selected = feedingTypeIdx,
                        onSelect = { feedingTypeIdx = it },
                        allowNone = true,
                    )
                }
            }

            // ── Weight ───────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_weight))
            SectionCard {
                OutlinedTextField(
                    value = weightKg, onValueChange = { weightKg = it },
                    label = { Text(stringResource(R.string.field_weight_kg)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                )
            }

            // ── Notes ────────────────────────────────────────────────────────
            FormSectionTitle(stringResource(R.string.section_notes))
            SectionCard {
                OutlinedTextField(
                    value = notes, onValueChange = { notes = it },
                    label = { Text(stringResource(R.string.field_notes)) },
                    minLines = 3, modifier = Modifier.fillMaxWidth(),
                )
            }

            // ── Custom Fields ────────────────────────────────────────────────
            if (state.fieldDefs.isNotEmpty()) {
                FormSectionTitle(stringResource(R.string.section_custom_fields))
                SectionCard {
                    state.fieldDefs.forEach { def ->
                        val value = customValues[def.id] ?: ""
                        when (def.type) {
                            "boolean" -> ToggleButtonGroup(
                                label    = def.name,
                                options  = listOf("?", "✓ Yes", "✗ No"),
                                selected = when (value.toBooleanStrictOrNull()) { true -> 1; false -> 2; else -> null },
                                onSelect = { idx -> customValues[def.id] = when (idx) { 1 -> "true"; 2 -> "false"; else -> "" } },
                                allowNone = true,
                            )
                            "number" -> OutlinedTextField(
                                value = value, onValueChange = { customValues[def.id] = it },
                                label = { Text(def.name) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                singleLine = true, modifier = Modifier.fillMaxWidth(),
                            )
                            "select" -> if (def.options.isNotEmpty()) {
                                val opts = listOf("") + def.options
                                ExposedDropdownMenuForList(
                                    label = def.name,
                                    options = opts.map { it.ifBlank { stringResource(R.string.label_not_recorded) } },
                                    selectedIndex = opts.indexOf(value).coerceAtLeast(0),
                                    onSelect = { customValues[def.id] = opts[it] }
                                )
                            }
                            else -> OutlinedTextField(
                                value = value, onValueChange = { customValues[def.id] = it },
                                label = { Text(def.name) },
                                singleLine = def.type != "text",
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                    }
                }
            }

            // ── Save button ──────────────────────────────────────────────────
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    val customFields = state.fieldDefs.associate { def ->
                        val raw = customValues[def.id] ?: ""
                        def.name to when (def.type) {
                            "number"  -> raw.toDoubleOrNull()
                            "boolean" -> raw == "true"
                            else      -> raw.ifBlank { null }
                        }
                    }.filterValues { it != null }

                    vm.save(InspectionCreateRequest(
                        date               = date,
                        queenSeen          = queenSeenBool(),
                        queenColor         = queenColor,
                        broodFrames        = broodFrames.takeIf { it > 0 },
                        honeyFrames        = honeyFrames.takeIf { it > 0 },
                        mood               = moodIdx?.let { moodOptions[it] },
                        populationStrength = populationInt(),
                        varroaCount        = varroaCount.takeIf { it > 0 },
                        swarmCellsSeen     = swarmCellsBool(),
                        treatmentApplied   = treatment.ifBlank { null },
                        feedingDone        = feedingBool(),
                        feedingType        = feedingTypeIdx?.let { feedingTypes[it] },
                        weightKg           = weightKg.toDoubleOrNull(),
                        notes              = notes.ifBlank { null },
                        customFields       = customFields,
                    ))
                },
                enabled  = !state.isLoading,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape    = MaterialTheme.shapes.medium,
            ) {
                if (state.isLoading)
                    CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary)
                else Text(stringResource(R.string.action_save), style = MaterialTheme.typography.titleMedium)
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun FormSectionTitle(text: String) {
    Text(
        text  = text,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(top = 4.dp),
    )
}
