package com.example.edunexuspro

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.edunexuspro.screens.LoginScreen
import com.example.edunexuspro.screens.DashboardScreen
import com.example.edunexuspro.screens.AttendanceScreen
import com.example.edunexuspro.screens.WalletScreen
import com.example.edunexuspro.screens.TransportScreen
import com.example.edunexuspro.screens.SupportScreen

@Composable
fun MainNavigation() {
  val backStack = rememberNavBackStack(Login)

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Login> {
          LoginScreen(
            onLoginSuccess = { role, email, uid ->
              backStack.add(Dashboard(role, email, uid))
            },
            modifier = Modifier.fillMaxSize()
          )
        }
        entry<Dashboard> { key ->
          DashboardScreen(
            role = key.role,
            email = key.email,
            uid = key.uid,
            onNavigate = { navKey ->
              backStack.add(navKey)
            },
            onLogout = {
              backStack.removeLastOrNull()
            },
            modifier = Modifier.fillMaxSize()
          )
        }
        entry<Attendance> { key ->
          AttendanceScreen(
            studentId = key.studentId,
            onBack = { backStack.removeLastOrNull() },
            modifier = Modifier.fillMaxSize()
          )
        }
        entry<Wallet> { key ->
          WalletScreen(
            studentId = key.studentId,
            onBack = { backStack.removeLastOrNull() },
            modifier = Modifier.fillMaxSize()
          )
        }
        entry<Transport> { key ->
          TransportScreen(
            routeId = key.routeId,
            onBack = { backStack.removeLastOrNull() },
            modifier = Modifier.fillMaxSize()
          )
        }
        entry<Support> { key ->
          SupportScreen(
            studentId = key.studentId,
            onBack = { backStack.removeLastOrNull() },
            modifier = Modifier.fillMaxSize()
          )
        }
      },
  )
}
