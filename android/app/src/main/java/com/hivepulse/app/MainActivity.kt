package com.hivepulse.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Hive
import androidx.compose.material.icons.filled.PestControl
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.hivepulse.app.data.local.TokenStore
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

                Scaffold(
                    bottomBar = {
                        NavigationBar(
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
                                selected = !isHornetSection && !isMembersSection,
                                onClick  = {
                                    val dest = if (tokenStore.isLoggedIn) Routes.APIARY_LIST else Routes.LOGIN
                                    navController.navigate(dest) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(Icons.Default.Hive, contentDescription = null) },
                                label  = { Text("HivePulse") },
                                colors = itemColors,
                            )
                            NavigationBarItem(
                                selected = isHornetSection,
                                onClick  = {
                                    navController.navigate(Routes.HORNET_HOME) {
                                        launchSingleTop = true
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                    }
                                },
                                icon   = { Icon(Icons.Default.PestControl, contentDescription = null) },
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
