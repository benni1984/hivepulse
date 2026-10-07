package com.hivepulse.app.ui.hives

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.material3.OutlinedTextField
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.hivepulse.app.R
import com.hivepulse.app.data.api.HiveOut

/** Hive types the API accepts, in the same order as the create form. */
internal val HIVE_TYPES = listOf("langstroth", "dadant", "top_bar", "warre", "other")

/**
 * The translated label for a hive type. The values themselves are what the API stores and
 * never change; only what the beekeeper reads does. Langstroth, Dadant and Warré are the
 * names of the people who designed those hives, so they read the same in every language.
 */
internal fun hiveTypeLabelRes(value: String): Int = when (value) {
    "langstroth" -> R.string.hive_type_langstroth
    "dadant" -> R.string.hive_type_dadant
    "top_bar" -> R.string.hive_type_top_bar
    "warre" -> R.string.hive_type_warre
    else -> R.string.hive_type_other
}

/** An acquisition date is optional; when given it must be YYYY-MM-DD. */
internal fun isValidAcquisitionDate(value: String): Boolean =
    value.isBlank() || Regex("""\d{4}-\d{2}-\d{2}""").matches(value.trim())

/** Edits a hive's name, type, acquisition date and notes, or collects them for a new one when no hive is given. */
@Composable
fun HiveEditDialog(
    hive: HiveOut?,
    onDismiss: () -> Unit,
    onSave: (name: String, hiveType: String, acquisitionDate: String?, notes: String?) -> Unit,
) {
    var name by remember { mutableStateOf(hive?.name ?: "") }
    var hiveType by remember { mutableStateOf(hive?.hiveType?.takeIf { it in HIVE_TYPES } ?: if (hive == null) "langstroth" else "other") }
    var acquisitionDate by remember { mutableStateOf(hive?.acquisitionDate ?: "") }
    var notes by remember { mutableStateOf(hive?.notes ?: "") }

    val dateValid = isValidAcquisitionDate(acquisitionDate)
    val canSave = name.isNotBlank() && dateValid

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(if (hive == null) R.string.action_new_hive else R.string.title_edit_hive)) },
        text = {
            Column(
                Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text(stringResource(R.string.field_hive_name_edit)) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("hiveEditName"),
                )
                ExposedDropdownMenuForList(
                    label = stringResource(R.string.field_hive_type),
                    options = HIVE_TYPES.map { stringResource(hiveTypeLabelRes(it)) },
                    selectedIndex = HIVE_TYPES.indexOf(hiveType),
                    onSelect = { hiveType = HIVE_TYPES[it] },
                )
                OutlinedTextField(
                    value = acquisitionDate,
                    onValueChange = { acquisitionDate = it },
                    label = { Text(stringResource(R.string.field_acquisition_date)) },
                    placeholder = { Text(stringResource(R.string.hint_acquisition_date)) },
                    isError = !dateValid,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text(stringResource(R.string.field_notes)) },
                    minLines = 2,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(name, hiveType, acquisitionDate.ifBlank { null }, notes) },
                enabled = canSave,
                modifier = Modifier.testTag("hiveEditSave"),
            ) { Text(stringResource(R.string.action_save_hive)) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) }
        },
    )
}
