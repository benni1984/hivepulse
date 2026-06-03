package com.hivepulse.app.ui.auth

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.ui.common.ErrorBanner

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

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("🐝", style = MaterialTheme.typography.displayMedium)
        Spacer(Modifier.height(8.dp))
        Text("HivePulse", style = MaterialTheme.typography.headlineLarge)
        Text(stringResource(R.string.login_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value = email, onValueChange = { email = it },
            label = { Text(stringResource(R.string.field_email)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
            singleLine = true, modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password, onValueChange = { password = it },
            label = { Text(stringResource(R.string.field_password)) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            singleLine = true, modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))

        state.error?.let { ErrorBanner(it) { vm.clearError() } }

        Spacer(Modifier.height(16.dp))
        Button(
            onClick = { vm.login(email, password) },
            enabled = email.isNotBlank() && password.isNotBlank() && !state.isLoading,
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            if (state.isLoading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
            else Text(stringResource(R.string.action_login))
        }
        Spacer(Modifier.height(4.dp))
        TextButton(onClick = {
            val intent = Intent(Intent.ACTION_VIEW,
                Uri.parse("https://hivepulse.app/dashboard/forgot-password"))
            context.startActivity(intent)
        }) {
            Text(stringResource(R.string.action_forgot_password),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(4.dp))
        TextButton(onClick = onNavigateRegister) {
            Text(stringResource(R.string.action_register))
        }
    }
}
