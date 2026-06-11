package com.hivepulse.app.ui.common

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.CornerSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone200

@Composable
fun ErrorBanner(message: String, onDismiss: (() -> Unit)? = null) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.onErrorContainer)
            Spacer(Modifier.width(8.dp))
            Text(message, modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.onErrorContainer,
                style = MaterialTheme.typography.bodyMedium)
            if (onDismiss != null) TextButton(onClick = onDismiss) { Text("✕") }
        }
    }
}

@Composable
fun LoadingScreen() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Amber500)
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f).wrapContentWidth(Alignment.End))
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 6.dp)
    )
}

/** White card wrapper for form sections. */
@Composable
fun SectionCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier  = modifier.fillMaxWidth(),
        shape     = MaterialTheme.shapes.large,
        colors    = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border    = BorderStroke(1.dp, Stone200),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp), content = content)
    }
}

/**
 * Glove-friendly number stepper — large − and + buttons with centred value display.
 * Replaces OutlinedTextField+NumberKeyboard for integer fields.
 */
@Composable
fun NumberStepper(
    label: String,
    value: Int,
    onValueChange: (Int) -> Unit,
    min: Int = 0,
    max: Int = Int.MAX_VALUE,
    step: Int = 1,
) {
    Column {
        Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .clip(MaterialTheme.shapes.medium)
                .border(1.dp, Stone200, MaterialTheme.shapes.medium),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            FilledTonalIconButton(
                onClick  = { if (value - step >= min) onValueChange(value - step) },
                enabled  = value > min,
                modifier = Modifier.size(64.dp),
                shape    = MaterialTheme.shapes.medium.copy(
                    topEnd    = CornerSize(0.dp),
                    bottomEnd = CornerSize(0.dp),
                ),
            ) { Icon(Icons.Default.Remove, contentDescription = "Decrease", Modifier.size(28.dp)) }

            Text(
                text     = value.toString(),
                style    = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.weight(1f).wrapContentWidth(Alignment.CenterHorizontally),
            )

            FilledTonalIconButton(
                onClick  = { if (value + step <= max) onValueChange(value + step) },
                enabled  = value < max,
                modifier = Modifier.size(64.dp),
                shape    = MaterialTheme.shapes.medium.copy(
                    topStart    = CornerSize(0.dp),
                    bottomStart = CornerSize(0.dp),
                ),
            ) { Icon(Icons.Default.Add, contentDescription = "Increase", Modifier.size(28.dp)) }
        }
    }
}

/**
 * Glove-friendly horizontal toggle button group.
 * Replaces ExposedDropdownMenu and FilterChip rows.
 */
@Composable
fun ToggleButtonGroup(
    label: String,
    options: List<String>,
    selected: Int?,
    onSelect: (Int?) -> Unit,
    allowNone: Boolean = false,
) {
    Column {
        Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            options.forEachIndexed { index, option ->
                val isSelected = selected == index
                if (isSelected) {
                    Button(
                        onClick  = { if (allowNone) onSelect(null) else onSelect(index) },
                        modifier = Modifier.weight(1f).heightIn(min = 52.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = Amber500, contentColor = Color(0xFF1C1917)),
                        shape    = MaterialTheme.shapes.medium,
                    ) { Text(option, style = MaterialTheme.typography.labelLarge, maxLines = 1) }
                } else {
                    OutlinedButton(
                        onClick  = { onSelect(index) },
                        modifier = Modifier.weight(1f).heightIn(min = 52.dp),
                        shape    = MaterialTheme.shapes.medium,
                        border   = BorderStroke(1.5.dp, Stone200),
                    ) { Text(option, style = MaterialTheme.typography.labelLarge, maxLines = 1) }
                }
            }
        }
    }
}

/** SICAMM queen color picker — colored circles. */
@Composable
fun ColorChipRow(
    label: String,
    selected: String?,
    onSelect: (String) -> Unit,
) {
    val options = listOf(
        "white"  to Color.White,
        "yellow" to Color(0xFFFFD700),
        "red"    to Color(0xFFDC2626),
        "green"  to Color(0xFF16A34A),
        "blue"   to Color(0xFF2563EB),
    )
    Column {
        Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            options.forEach { (name, color) ->
                val isSelected = selected == name
                val interactionSource = remember { MutableInteractionSource() }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(color)
                            .border(
                                width = if (isSelected) 3.dp else 1.5.dp,
                                color = if (isSelected) Amber500 else Stone200,
                                shape = CircleShape,
                            )
                            .clickable(interactionSource = interactionSource, indication = null) { onSelect(name) },
                        contentAlignment = Alignment.Center,
                    ) {
                        if (isSelected) Icon(Icons.Default.Check, contentDescription = null,
                            tint     = if (name == "white" || name == "yellow") Color(0xFF1C1917) else Color.White,
                            modifier = Modifier.size(24.dp))
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(name.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

// Simple line chart drawn with Canvas
@Composable
fun SimpleLineChart(
    points: List<Pair<String, Float>>,
    lineColor: Color,
    modifier: Modifier = Modifier
        .fillMaxWidth()
        .height(140.dp)
) {
    if (points.size < 2) {
        Box(modifier, contentAlignment = Alignment.Center) {
            Text("—", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }
    val maxVal = points.maxOf { it.second }
    val minVal = points.minOf { it.second }
    val range  = (maxVal - minVal).coerceAtLeast(1f)

    androidx.compose.foundation.Canvas(modifier) {
        val path = androidx.compose.ui.graphics.Path()
        points.forEachIndexed { i, (_, v) ->
            val x = size.width * i / (points.size - 1)
            val y = size.height * (1f - (v - minVal) / range)
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(path, lineColor, style = androidx.compose.ui.graphics.drawscope.Stroke(
            width = 3.dp.toPx(),
            cap   = androidx.compose.ui.graphics.StrokeCap.Round,
            join  = androidx.compose.ui.graphics.StrokeJoin.Round,
        ))
        points.forEachIndexed { i, (_, v) ->
            val x = size.width * i / (points.size - 1)
            val y = size.height * (1f - (v - minVal) / range)
            drawCircle(lineColor, radius = 4.dp.toPx(), center = androidx.compose.ui.geometry.Offset(x, y))
        }
    }
}
