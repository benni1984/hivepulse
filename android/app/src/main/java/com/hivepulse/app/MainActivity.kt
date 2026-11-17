package com.hivepulse.app

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Hive
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.ui.res.painterResource
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.hivepulse.app.data.local.AppLanguage
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.data.session.SessionEvents
import com.hivepulse.app.ui.navigation.HivePulseNavGraph
import com.hivepulse.app.ui.navigation.Routes
import com.hivepulse.app.ui.theme.Amber500
import com.hivepulse.app.ui.theme.Forest900
import com.hivepulse.app.ui.theme.HivePulseTheme
import com.hivepulse.app.R
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var tokenStore: TokenStore
    @Inject lateinit var sessionEvents: SessionEvents

    // Android 12 and older have no language per app; there it is applied here.
    override fun attachBaseContext(newBase: Context) {
        super.attachBaseContext(AppLanguage.wrap(newBase))
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            HivePulseTheme {
                val navController = rememberNavController()
                val backStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = backStackEntry?.destination?.route ?: ""
                val isHornetSection  = currentRoute.startsWith("hornet")
                val isMembersSection = currentRoute == Routes.MEMBERS
                val isSettingsSection = currentRoute == Routes.SETTINGS
                val isScanSection    = currentRoute == Routes.QR_SCAN
                val isGuidedTour     = currentRoute.startsWith("guided_tour")

                // The session can end while the app is open: after thirty days the server stops
                // accepting the refresh token, and until #467 that showed as an alert about
                // credentials over an empty apiary list, with no way out but Settings. The tokens
                // are already gone by the time this arrives; what is left is to say so and go
                // back to the form. The offline data stays - the same beekeeper is usually about
                // to sign back in (#469).
                val context = LocalContext.current
                LaunchedEffect(Unit) {
                    sessionEvents.expired.collect {
                        Toast.makeText(context, R.string.session_expired, Toast.LENGTH_LONG).show()
                        navController.navigate(Routes.LOGIN) { popUpTo(0) { inclusive = true } }
                    }
                }

                Scaffold(
                    bottomBar = {
                        if (!isGuidedTour) NavigationBar(
                            containerColor = Forest900,
                            contentColor   = Color.White,
                        ) {
                            val itemColors = NavigationBarItemDefaults.colors(
                                selectedIconColor   = Amber500,
                                selectedTextColor   = Amber500,
                                indicatorColor      = Color(0x1FF59E0B),
                                unselectedIconColor = Color(0xB3FFFFFF),
                                unselectedTextColor = Color(0xB3FFFFFF),
                            )
                            NavigationBarItem(
                                selected = !isHornetSection && !isMembersSection && !isSettingsSection && !isScanSection,
                                onClick  = {
                                    val dest = if (tokenStore.isLoggedIn) Routes.APIARY_LIST else Routes.LOGIN
                                    navController.navigate(dest) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(Icons.Default.Hive, contentDescription = null) },
                                label  = { Text(stringResource(R.string.tab_apiaries)) },
                                colors = itemColors,
                            )
                            // Same order as the iPhone's tab bar: apiaries, scan, hornets, members, settings.
                            NavigationBarItem(
                                selected = isScanSection,
                                onClick  = {
                                    navController.navigate(Routes.QR_SCAN) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(Icons.Default.QrCodeScanner, contentDescription = null) },
                                label  = { Text(stringResource(R.string.tab_scan_short)) },
                                colors = itemColors,
                                modifier = Modifier.testTag("scanTab"),
                            )
                            NavigationBarItem(
                                selected = isHornetSection,
                                onClick  = {
                                    navController.navigate(Routes.HORNET_HOME) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(painterResource(R.drawable.ic_hornet), contentDescription = null) },
                                label  = { Text(stringResource(R.string.tab_hornets)) },
                                colors = itemColors,
                            )
                            NavigationBarItem(
                                selected = isMembersSection,
                                onClick  = {
                                    navController.navigate(Routes.MEMBERS) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(Icons.Default.Groups, contentDescription = null) },
                                label  = { Text(stringResource(R.string.tab_members)) },
                                colors = itemColors,
                            )
                            // Settings lives here, not in the apiary list top bar — that row had four
                            // icons and felt crowded; iOS has it as a tab too.
                            NavigationBarItem(
                                selected = isSettingsSection,
                                onClick  = {
                                    navController.navigate(Routes.SETTINGS) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(Icons.Default.Settings, contentDescription = null) },
                                label  = { Text(stringResource(R.string.tab_settings)) },
                                colors = itemColors,
                            )
                        }
                    }
                ) { innerPadding ->
                    HivePulseNavGraph(
                        navController = navController,
                        modifier      = Modifier.padding(innerPadding),
                    )
                }
            }
        }
    }
}
