package com.hivepulse.app.ui.sharing

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PersonRemove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.hivepulse.app.R
import com.hivepulse.app.data.api.IncomingShareOut
import com.hivepulse.app.data.api.ShareOut
import com.hivepulse.app.ui.common.ErrorBanner

/**
 * Who works on an apiary or a hive together with its owner, and the form to invite somebody.
 * Reached from the toolbar of the owner only: a collaborator cannot invite, list or remove anybody.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SharingScreen(onBack: () -> Unit, vm: SharingViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    var email by remember { mutableStateOf("") }
    var toRemove by remember { mutableStateOf<ShareOut?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.sharing_title)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            )
        }
    ) { padding ->
        LazyColumn(
            Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }

            item {
                Text(
                    stringResource(if (vm.isHive) R.string.sharing_intro_hive else R.string.sharing_intro_apiary),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            item {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text(stringResource(R.string.sharing_email_label)) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth().testTag("shareEmailField"),
                )
            }
            item {
                Button(
                    onClick = { vm.invite(email) { email = "" } },
                    enabled = !state.isInviting && SharingViewModel.looksLikeAnEmail(email),
                    modifier = Modifier.testTag("inviteButton"),
                ) {
                    if (state.isInviting) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                    else Text(stringResource(R.string.sharing_invite))
                }
            }
            if (state.inviteSent) {
                item {
                    Text(stringResource(R.string.sharing_invite_sent), color = MaterialTheme.colorScheme.primary)
                }
            }

            if (state.shares.isEmpty() && !state.isLoading) {
                item {
                    Text(
                        stringResource(R.string.sharing_empty),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            items(state.shares, key = { it.id }) { share ->
                ShareRow(share, onRemove = { toRemove = share })
            }
        }
    }

    toRemove?.let { share ->
        val accepted = share.status == "accepted"
        AlertDialog(
            onDismissRequest = { toRemove = null },
            title = { Text(stringResource(if (accepted) R.string.sharing_revoke else R.string.sharing_withdraw)) },
            text = { Text(stringResource(if (accepted) R.string.sharing_confirm_revoke else R.string.sharing_confirm_withdraw)) },
            confirmButton = {
                TextButton(
                    onClick = { vm.remove(share); toRemove = null },
                    modifier = Modifier.testTag("confirmRemoveShare"),
                ) { Text(stringResource(R.string.action_delete), color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { toRemove = null }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}

@Composable
private fun ShareRow(share: ShareOut, onRemove: () -> Unit) {
    val accepted = share.status == "accepted"
    ListItem(
        headlineContent = { Text(share.collaboratorName ?: share.email) },
        supportingContent = {
            Column {
                if (share.collaboratorName != null) Text(share.email, style = MaterialTheme.typography.bodySmall)
                Text(
                    stringResource(if (accepted) R.string.sharing_accepted else R.string.sharing_pending),
                    style = MaterialTheme.typography.bodySmall,
                    color = if (accepted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        },
        trailingContent = {
            IconButton(onClick = onRemove, modifier = Modifier.testTag("removeShareButton")) {
                Icon(
                    Icons.Default.PersonRemove,
                    contentDescription = stringResource(if (accepted) R.string.sharing_revoke else R.string.sharing_withdraw),
                    tint = MaterialTheme.colorScheme.error,
                )
            }
        },
    )
}

/** Invitations waiting for the signed-in person, as cards at the top of the apiary list. */
fun LazyListScope.invitationItems(
    invitations: List<IncomingShareOut>,
    onAccept: (IncomingShareOut) -> Unit,
    onDecline: (IncomingShareOut) -> Unit,
) {
    items(invitations, key = { "invitation-" + it.id }) { invitation ->
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(invitationText(invitation), style = MaterialTheme.typography.bodyMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Button(onClick = { onAccept(invitation) }, modifier = Modifier.testTag("acceptInvitationButton")) {
                        Text(stringResource(R.string.invitation_accept))
                    }
                    OutlinedButton(onClick = { onDecline(invitation) }) {
                        Text(stringResource(R.string.invitation_decline))
                    }
                }
            }
        }
    }
}

@Composable
private fun invitationText(invitation: IncomingShareOut): String =
    if (invitation.target.type == "apiary") {
        stringResource(R.string.invitation_apiary, invitation.ownerName, invitation.target.name)
    } else {
        stringResource(R.string.invitation_hive, invitation.ownerName, invitation.target.name, invitation.apiaryName ?: "")
    }
