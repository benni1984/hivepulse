package com.hivepulse.app.ui.navigation

import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.*
import androidx.navigation.compose.*
import com.hivepulse.app.data.local.TokenStore
import com.hivepulse.app.data.local.OnboardingStore
import com.hivepulse.app.ui.apiaries.*
import com.hivepulse.app.ui.auth.*
import com.hivepulse.app.ui.hives.*
import com.hivepulse.app.ui.inspections.*
import com.hivepulse.app.ui.qr.*
import com.hivepulse.app.ui.admin.*
import com.hivepulse.app.ui.hornet.HornetHomeScreen
import com.hivepulse.app.ui.fields.FieldDefinitionsScreen
import com.hivepulse.app.ui.members.MembersScreen
import com.hivepulse.app.ui.onboarding.GuidedTourScreen
import com.hivepulse.app.ui.settings.SettingsScreen
import com.hivepulse.app.ui.stats.HiveStatsScreen
import com.hivepulse.app.ui.stats.OverviewStatsScreen
import javax.inject.Inject

object Routes {
    const val LOGIN              = "login"
    const val REGISTER           = "register"
    const val FORGOT_PASSWORD    = "forgot_password?email={email}"
    const val APIARY_LIST        = "apiary_list"
    const val APIARY_DETAIL      = "apiary_detail/{apiaryId}"
    const val APIARY_FORM        = "apiary_form?apiaryId={apiaryId}"
    const val HIVE_DETAIL        = "hive_detail/{hiveId}"
    const val HIVE_QR            = "hive_qr/{hiveId}"
    const val HIVE_INITIALIZE    = "hive_initialize/{qrToken}"
    const val INSPECTION_FORM    = "inspection_form/{hiveId}?inspectionId={inspectionId}"
    const val INSPECTION_DETAIL  = "inspection_detail/{inspectionId}/{hiveId}"
    const val HIVE_STATS         = "hive_stats/{hiveId}"
    const val STATS_OVERVIEW     = "stats_overview"
    const val QR_SCAN            = "qr_scan"
    const val QR_BATCH_LIST      = "qr_batch_list"
    const val QR_BATCH_DETAIL    = "qr_batch_detail/{batchId}"
    const val SETTINGS           = "settings"
    const val ADMIN              = "admin"
    const val ADMIN_STATS        = "admin_stats"
    const val ADMIN_USERS        = "admin_users"
    const val ADMIN_MAP          = "admin_map"
    const val ADMIN_HEALTH       = "admin_health"
    const val HORNET_HOME        = "hornet_home"
    const val MEMBERS            = "members"
    const val FIELD_DEFINITIONS  = "field_definitions?apiaryId={apiaryId}"
    const val GUIDED_TOUR        = "guided_tour?fromSettings={fromSettings}"
}

@Composable
fun HivePulseNavGraph(
    navController: NavHostController = rememberNavController(),
    modifier: androidx.compose.ui.Modifier = androidx.compose.ui.Modifier,
    tokenStore: TokenStore = dagger.hilt.android.EntryPointAccessors
        .fromApplication(
            androidx.compose.ui.platform.LocalContext.current.applicationContext,
            TokenStoreEntryPoint::class.java
        ).tokenStore(),
    onboardingStore: OnboardingStore = dagger.hilt.android.EntryPointAccessors
        .fromApplication(
            androidx.compose.ui.platform.LocalContext.current.applicationContext,
            TokenStoreEntryPoint::class.java
        ).onboardingStore()
) {
    // Both are remembered so a recomposition (e.g. the bottom bar hiding for the guided tour changes the
    // padding) cannot hand NavHost a new start destination or builder — that rebuilds the graph and resets
    // the back stack to the start destination, which is how the tour vanished right after sign-in.
    val start = remember { if (tokenStore.isLoggedIn) Routes.APIARY_LIST else Routes.LOGIN }

    // The first successful sign-in on this device shows the guided tour before the apiary list
    val afterAuth: () -> Unit = remember(navController, onboardingStore) {
        {
            val destination = if (onboardingStore.hasSeenGuidedTour) Routes.APIARY_LIST else "guided_tour?fromSettings=false"
            navController.navigate(destination) { popUpTo(Routes.LOGIN) { inclusive = true } }
        }
    }

    NavHost(navController, startDestination = start, modifier = modifier) {
        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess  = afterAuth,
                onNavigateRegister = { navController.navigate(Routes.REGISTER) },
                onForgotPassword   = { email -> navController.navigate("forgot_password?email=${android.net.Uri.encode(email)}") }
            )
        }
        composable(Routes.FORGOT_PASSWORD,
            arguments = listOf(navArgument("email") { type = NavType.StringType; defaultValue = "" })) {
            ForgotPasswordScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.REGISTER) {
            RegisterScreen(
                onSuccess = afterAuth,
                onBack    = { navController.popBackStack() }
            )
        }
        composable(Routes.APIARY_LIST) {
            ApiaryListScreen(
                onApiaryClick = { id -> navController.navigate("apiary_detail/$id") },
                onScanClick   = { navController.navigate(Routes.QR_SCAN) },
                onBatchClick  = { navController.navigate(Routes.QR_BATCH_LIST) },
                onSettingsClick = { navController.navigate(Routes.SETTINGS) },
                onStatsClick    = { navController.navigate(Routes.STATS_OVERVIEW) }
            )
        }
        composable(Routes.STATS_OVERVIEW) {
            OverviewStatsScreen(
                onApiaryClick = { id -> navController.navigate("apiary_detail/$id") },
                onBack        = { navController.popBackStack() }
            )
        }
        composable(Routes.APIARY_DETAIL,
            arguments = listOf(navArgument("apiaryId") { type = NavType.StringType })) { back ->
            ApiaryDetailScreen(
                apiaryId = back.arguments!!.getString("apiaryId")!!,
                onHiveClick = { id -> navController.navigate("hive_detail/$id") },
                onBack      = { navController.popBackStack() },
                onFieldsClick = { navController.navigate("field_definitions?apiaryId=${back.arguments!!.getString("apiaryId")}") }
            )
        }
        composable(Routes.HIVE_DETAIL,
            arguments = listOf(navArgument("hiveId") { type = NavType.StringType })) { back ->
            HiveDetailScreen(
                hiveId = back.arguments!!.getString("hiveId")!!,
                onInspectionClick = { inspId, hiveId -> navController.navigate("inspection_detail/$inspId/$hiveId") },
                onAddInspection   = { hiveId -> navController.navigate("inspection_form/$hiveId?inspectionId=") },
                onStatsClick      = { hiveId -> navController.navigate("hive_stats/$hiveId") },
                onQrClick         = { hiveId -> navController.navigate("hive_qr/$hiveId") },
                onBack            = { navController.popBackStack() }
            )
        }
        composable(Routes.HIVE_QR,
            arguments = listOf(navArgument("hiveId") { type = NavType.StringType })) { back ->
            HiveQRViewScreen(
                hiveId = back.arguments!!.getString("hiveId")!!,
                onBack = { navController.popBackStack() }
            )
        }
        composable(Routes.HIVE_INITIALIZE,
            arguments = listOf(navArgument("qrToken") { type = NavType.StringType })) { back ->
            HiveInitializeScreen(
                qrToken  = back.arguments!!.getString("qrToken")!!,
                onSuccess = { hiveId -> navController.navigate("hive_detail/$hiveId") { popUpTo(Routes.QR_SCAN) } },
                onBack    = { navController.popBackStack() }
            )
        }
        composable(Routes.INSPECTION_FORM,
            arguments = listOf(
                navArgument("hiveId")       { type = NavType.StringType },
                navArgument("inspectionId") { type = NavType.StringType; defaultValue = "" }
            )
        ) { back ->
            InspectionFormScreen(
                hiveId       = back.arguments!!.getString("hiveId")!!,
                inspectionId = back.arguments!!.getString("inspectionId")!!.ifEmpty { null },
                onSaved = { navController.popBackStack() },
                onBack  = { navController.popBackStack() }
            )
        }
        composable(Routes.INSPECTION_DETAIL,
            arguments = listOf(
                navArgument("inspectionId") { type = NavType.StringType },
                navArgument("hiveId")       { type = NavType.StringType }
            )
        ) { back ->
            InspectionDetailScreen(
                inspectionId = back.arguments!!.getString("inspectionId")!!,
                hiveId       = back.arguments!!.getString("hiveId")!!,
                onEdit  = { inspId, hiveId -> navController.navigate("inspection_form/$hiveId?inspectionId=$inspId") },
                onBack  = { navController.popBackStack() }
            )
        }
        composable(Routes.HIVE_STATS,
            arguments = listOf(navArgument("hiveId") { type = NavType.StringType })) { back ->
            HiveStatsScreen(
                hiveId = back.arguments!!.getString("hiveId")!!,
                onBack = { navController.popBackStack() }
            )
        }
        composable(Routes.QR_SCAN) {
            QRScanScreen(
                onHiveFound     = { hiveId -> navController.navigate("hive_detail/$hiveId") { popUpTo(Routes.QR_SCAN) } },
                onUnlinked      = { token  -> navController.navigate("hive_initialize/$token") },
                onBack          = { navController.popBackStack() }
            )
        }
        composable(Routes.QR_BATCH_LIST) {
            QRBatchListScreen(
                onBatchClick = { id -> navController.navigate("qr_batch_detail/$id") },
                onBack       = { navController.popBackStack() }
            )
        }
        composable(Routes.QR_BATCH_DETAIL,
            arguments = listOf(navArgument("batchId") { type = NavType.StringType })) { back ->
            QRBatchDetailScreen(
                batchId = back.arguments!!.getString("batchId")!!,
                onBack  = { navController.popBackStack() }
            )
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(
                onLogout     = { navController.navigate(Routes.LOGIN) { popUpTo(0) { inclusive = true } } },
                onBack       = { navController.popBackStack() },
                onAdminClick = { navController.navigate(Routes.ADMIN) },
                onCustomFieldsClick = { navController.navigate("field_definitions?apiaryId=") },
                onGuidedTourClick = { navController.navigate("guided_tour?fromSettings=true") }
            )
        }
        composable(Routes.ADMIN) {
            AdminMenuScreen(
                onStatsClick  = { navController.navigate(Routes.ADMIN_STATS) },
                onUsersClick  = { navController.navigate(Routes.ADMIN_USERS) },
                onMapClick    = { navController.navigate(Routes.ADMIN_MAP) },
                onHealthClick = { navController.navigate(Routes.ADMIN_HEALTH) },
                onBack        = { navController.popBackStack() }
            )
        }
        composable(Routes.ADMIN_STATS) {
            AdminStatsScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.ADMIN_USERS) {
            AdminUsersScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.ADMIN_MAP) {
            AdminMapScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.ADMIN_HEALTH) {
            AdminHealthScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.HORNET_HOME) {
            HornetHomeScreen()
        }
        composable(Routes.MEMBERS) {
            MembersScreen()
        }
        composable(Routes.GUIDED_TOUR,
            arguments = listOf(navArgument("fromSettings") { type = NavType.BoolType; defaultValue = false })) { back ->
            val fromSettings = back.arguments?.getBoolean("fromSettings") ?: false
            GuidedTourScreen(onFinished = {
                if (fromSettings) navController.popBackStack()
                else navController.navigate(Routes.APIARY_LIST) { popUpTo(Routes.GUIDED_TOUR) { inclusive = true } }
            })
        }
        composable(Routes.FIELD_DEFINITIONS,
            arguments = listOf(navArgument("apiaryId") { type = NavType.StringType; defaultValue = "" })) {
            FieldDefinitionsScreen(onBack = { navController.popBackStack() })
        }
    }
}

@dagger.hilt.EntryPoint
@dagger.hilt.InstallIn(dagger.hilt.components.SingletonComponent::class)
interface TokenStoreEntryPoint {
    fun tokenStore(): TokenStore
    fun onboardingStore(): OnboardingStore
}
