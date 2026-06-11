package com.hivepulse.app.ui.auth

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.ui.common.ErrorBanner
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Stone50
import com.hivepulse.app.ui.theme.Stone500

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateRegister: () -> Unit,
    vm: AuthViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var email    by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val context  = LocalContext.current

    LaunchedEffect(state.success) { if (state.success) onLoginSuccess() }

    Box(
        modifier = Modifier.fillMaxSize().background(Stone50),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier  = Modifier.fillMaxWidth().padding(24.dp),
            shape     = MaterialTheme.shapes.extraLarge,
            colors    = CardDefaults.cardColors(containerColor = Color.White),
            border    = BorderStroke(1.dp, Color(0xFFE7E5E4)),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                // Logo + wordmark
                HivePulseHexIcon(size = 64)
                Spacer(Modifier.height(16.dp))
                Text(
                    buildAnnotatedString {
                        withStyle(SpanStyle(color = Color(0xFF1C1917), fontWeight = FontWeight.ExtraBold, fontSize = 28.sp)) { append("Hive") }
                        withStyle(SpanStyle(color = Amber500, fontWeight = FontWeight.ExtraBold, fontSize = 28.sp))       { append("Pulse") }
                    }
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    stringResource(R.string.login_subtitle),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Stone500,
                )
                Spacer(Modifier.height(28.dp))

                OutlinedTextField(
                    value = email, onValueChange = { email = it },
                    label = { Text(stringResource(R.string.field_email)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Amber500,
                        focusedLabelColor  = Amber500,
                    ),
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = password, onValueChange = { password = it },
                    label = { Text(stringResource(R.string.field_password)) },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.medium,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Amber500,
                        focusedLabelColor  = Amber500,
                    ),
                )

                state.error?.let {
                    Spacer(Modifier.height(8.dp))
                    ErrorBanner(it) { vm.clearError() }
                }

                Spacer(Modifier.height(20.dp))
                Button(
                    onClick  = { vm.login(email, password) },
                    enabled  = email.isNotBlank() && password.isNotBlank() && !state.isLoading,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape    = MaterialTheme.shapes.medium,
                ) {
                    if (state.isLoading)
                        CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary)
                    else Text(stringResource(R.string.action_login), style = MaterialTheme.typography.titleMedium)
                }

                Spacer(Modifier.height(8.dp))
                TextButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://hivepulse.app/dashboard/forgot-password")))
                }) {
                    Text(stringResource(R.string.action_forgot_password),
                        style = MaterialTheme.typography.bodySmall, color = Stone500)
                }
                TextButton(onClick = onNavigateRegister) {
                    Text(stringResource(R.string.action_register))
                }
            }
        }
    }
}

/** HivePulse hex icon — amber hexagon with honeycomb cells and stats sparkline. */
@Composable
fun HivePulseHexIcon(size: Int = 48) {
    Image(
        painter            = painterResource(id = R.drawable.ic_hivepulse),
        contentDescription = "HivePulse",
        modifier           = Modifier.size(size.dp),
    )
}
