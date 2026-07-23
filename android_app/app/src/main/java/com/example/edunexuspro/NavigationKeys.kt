package com.example.edunexuspro

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable data object Login : NavKey
@Serializable data class Dashboard(val role: String, val email: String, val uid: String) : NavKey
@Serializable data class Attendance(val studentId: String) : NavKey
@Serializable data class Wallet(val studentId: String) : NavKey
@Serializable data class Transport(val routeId: String) : NavKey
@Serializable data class Support(val studentId: String) : NavKey
