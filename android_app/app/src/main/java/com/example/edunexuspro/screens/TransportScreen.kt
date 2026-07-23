package com.example.edunexuspro.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransportScreen(
    routeId: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var busProgress by remember { mutableStateOf(0.0f) } // 0.0f to 1.0f along the route
    var activeStop by remember { mutableStateOf("Main Gate Depot") }
    var nextStop by remember { mutableStateOf("Uppal Circle") }
    var etaMinutes by remember { mutableStateOf(18) }
    
    val animatedProgress by animateFloatAsState(
        targetValue = busProgress,
        animationSpec = tween(durationMillis = 1500)
    )

    val stops = listOf(
        StopData("Depot", 0.0f),
        StopData("Uppal Circle", 0.3f),
        StopData("Tarnaka Junction", 0.6f),
        StopData("Secunderabad Stn", 0.85f),
        StopData("EduNexus School", 1.0f)
    )

    // Simulate real-time bus movement
    LaunchedEffect(Unit) {
        while (true) {
            delay(3000)
            busProgress += 0.05f
            if (busProgress > 1.0f) {
                busProgress = 0.0f
            }
            
            // Determine active stop based on progress
            var currentStopIdx = 0
            for (i in stops.indices) {
                if (busProgress >= stops[i].position) {
                    currentStopIdx = i
                }
            }
            activeStop = stops[currentStopIdx].name
            nextStop = if (currentStopIdx < stops.size - 1) {
                stops[currentStopIdx + 1].name
            } else {
                stops[0].name
            }
            
            // Recalculate ETA
            val remainingProgress = 1.0f - busProgress
            etaMinutes = (remainingProgress * 30).toInt()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Live Transport Tracking", color = Color.White, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF0F172A))
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0F172A))
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Live Status Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(Color(0xFF10B981), RoundedCornerShape(4.dp))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "LIVE TRACKING ACTIVE", color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        Text(text = "Bus 101-A", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "ETA to School", color = Color(0xFF94A3B8), fontSize = 12.sp)
                            Text(text = if (etaMinutes > 0) "$etaMinutes Mins" else "Arrived", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Current Speed", color = Color(0xFF94A3B8), fontSize = 12.sp)
                            Text(text = "42 km/h", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Simulated Route Map Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B).copy(alpha = 0.6f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp)
                ) {
                    Text(text = "Simulated Transit Map", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(text = "Active Stop: $activeStop", color = Color(0xFF3B82F6), fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))

                    Spacer(modifier = Modifier.weight(1f))

                    // Draw simulated route line & stops
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(280.dp)
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val canvasWidth = size.width
                            val canvasHeight = size.height

                            val pathStartX = canvasWidth * 0.15f
                            val pathEndX = canvasWidth * 0.85f
                            val yCenter = canvasHeight * 0.5f

                            // Draw Background Dotted Path
                            drawLine(
                                color = Color(0xFF475569),
                                start = Offset(pathStartX, yCenter),
                                end = Offset(pathEndX, yCenter),
                                strokeWidth = 8f,
                                cap = StrokeCap.Round
                            )

                            // Draw Completed Path in Blue
                            val activeEndX = pathStartX + (pathEndX - pathStartX) * animatedProgress
                            drawLine(
                                color = Color(0xFF3B82F6),
                                start = Offset(pathStartX, yCenter),
                                end = Offset(activeEndX, yCenter),
                                strokeWidth = 8f,
                                cap = StrokeCap.Round
                            )

                            // Draw Stop Circles
                            stops.forEach { stop ->
                                val xStop = pathStartX + (pathEndX - pathStartX) * stop.position
                                val isPassed = animatedProgress >= stop.position
                                
                                drawCircle(
                                    color = if (isPassed) Color(0xFF3B82F6) else Color(0xFF475569),
                                    radius = 16f,
                                    center = Offset(xStop, yCenter)
                                )
                                drawCircle(
                                    color = Color(0xFF0F172A),
                                    radius = 8f,
                                    center = Offset(xStop, yCenter)
                                )
                            }
                        }

                        // Labels for stops
                        stops.forEach { stop ->
                            val xPercent = 0.10f + stop.position * 0.70f
                            val yOffset = if (stop.name.length % 2 == 0) 100.dp else 190.dp
                            
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopStart)
                                    .padding(start = (xPercent * 340).dp, top = yOffset)
                            ) {
                                Text(
                                    text = stop.name.take(12),
                                    color = Color(0xFF94A3B8),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        // Floating active Bus Indicator
                        val xPercentBus = 0.10f + animatedProgress * 0.70f
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .padding(start = (xPercentBus * 340).dp - 20.dp, top = 120.dp) // align directly on yCenter line (middle of canvas)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(Color(0xFF3B82F6), RoundedCornerShape(20.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DirectionsBus,
                                    contentDescription = "Bus",
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.weight(1f))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Driver Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Driver Details", color = Color(0xFF94A3B8), fontSize = 12.sp)
                        Text(text = "Ramesh Kumar", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(text = "Verified Class-4 License Holder", color = Color(0xFF10B981), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    IconButton(
                        onClick = {},
                        colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Icon(imageVector = Icons.Default.Phone, contentDescription = "Call", tint = Color.White)
                    }
                }
            }
        }
    }
}

data class StopData(val name: String, val position: Float)
