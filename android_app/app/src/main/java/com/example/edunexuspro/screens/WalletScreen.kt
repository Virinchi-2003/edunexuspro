package com.example.edunexuspro.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.edunexuspro.network.NetworkClient
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    studentId: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(true) }
    var walletData by remember { mutableStateOf<JSONObject?>(null) }
    var transactions by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    
    // Balance visual state
    var displayBalance by remember { mutableStateOf(0.0) }
    val animatedBalance = remember { Animatable(0f) }
    
    // Top up fields
    var customAmount by remember { mutableStateOf("") }
    var isTopupLoading by remember { mutableStateOf(false) }
    var topupError by remember { mutableStateOf<String?>(null) }
    var topupSuccess by remember { mutableStateOf(false) }

    val fetchWalletData = {
        scope.launch {
            try {
                // Fetch Wallet
                val walletRes = NetworkClient.get("/wallet/$studentId")
                if (walletRes.optString("status") == "success") {
                    walletData = walletRes.optJSONObject("data")
                    val currentBal = walletData?.optDouble("balance", 0.0) ?: 0.0
                    displayBalance = currentBal
                    // Launch smooth count-up animation
                    animatedBalance.animateTo(currentBal.toFloat(), tween(1000))
                } else {
                    // Fallback mock
                    displayBalance = 1250.0
                    animatedBalance.animateTo(1250f, tween(1000))
                }

                // Fetch Transactions
                val txRes = NetworkClient.get("/wallet/transactions/$studentId")
                if (txRes.optString("status") == "success") {
                    val txList = mutableListOf<JSONObject>()
                    val data = txRes.optJSONArray("data")
                    if (data != null) {
                        for (i in 0 until data.length()) {
                            txList.add(data.getJSONObject(i))
                        }
                    }
                    transactions = txList
                } else {
                    transactions = getMockTransactions()
                }
            } catch (e: Exception) {
                displayBalance = 1250.0
                animatedBalance.animateTo(1250f, tween(1000))
                transactions = getMockTransactions()
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(studentId) {
        fetchWalletData()
    }

    val processTopup: (Double) -> Unit = { amount ->
        isTopupLoading = true
        topupError = null
        topupSuccess = false
        
        scope.launch {
            try {
                val payload = JSONObject().apply {
                    put("studentId", studentId)
                    put("amount", amount)
                    put("transactionId", "tx-${UUID.randomUUID().toString().take(8)}")
                }
                val res = NetworkClient.post("/wallet/topup", payload)
                if (res.optString("status") == "success") {
                    topupSuccess = true
                    customAmount = ""
                    
                    // Instantly trigger layout refresh & animate balance update
                    val walletDetails = res.optJSONObject("data") // might contain new wallet
                    val updatedBal = walletDetails?.optDouble("balance") ?: (displayBalance + amount)
                    
                    // Fast anim balance jump
                    val oldBal = displayBalance
                    displayBalance = updatedBal
                    animatedBalance.snapTo(oldBal.toFloat())
                    animatedBalance.animateTo(updatedBal.toFloat(), tween(500))
                    
                    // Reload transaction history
                    fetchWalletData()
                } else {
                    topupError = res.optString("message", "Minimum top-up is ₹100")
                }
            } catch (e: Exception) {
                topupError = e.message ?: "Failed to perform top-up"
            } finally {
                isTopupLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Student Wallet & Fees", color = Color.White, fontWeight = FontWeight.Bold) },
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
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F172A))
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Color(0xFF3B82F6))
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0F172A))
                    .padding(paddingValues)
                    .padding(16.dp)
            ) {
                // Glassmorphism Balance Card
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.linearGradient(
                                    colors = listOf(
                                        Color(0xFF1D4ED8), // Darker Blue
                                        Color(0xFF3B82F6)  // Light blue
                                    )
                                )
                            )
                            .padding(24.dp)
                    ) {
                        Text(text = "CURRENT WALLET BALANCE", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = String.format("₹%.2f", animatedBalance.value),
                            color = Color.White,
                            fontSize = 36.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Student ID: $studentId",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 13.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Fast Top Up Segment
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Instant Wallet Recharge (Min ₹100)",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        // Quick buttons
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf(100.0, 200.0, 500.0).forEach { amt ->
                                Button(
                                    onClick = { processTopup(amt) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6).copy(alpha = 0.2f)),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text(text = "+ ₹${amt.toInt()}", color = Color(0xFF3B82F6), fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Custom amount
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            OutlinedTextField(
                                value = customAmount,
                                onValueChange = { customAmount = it },
                                label = { Text("Custom Amount", color = Color(0xFF94A3B8)) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF3B82F6),
                                    unfocusedBorderColor = Color(0xFF475569),
                                    focusedLabelColor = Color(0xFF3B82F6)
                                ),
                                singleLine = true,
                                modifier = Modifier.weight(1f)
                            )

                            Button(
                                onClick = {
                                    val amount = customAmount.toDoubleOrNull()
                                    if (amount != null && amount >= 100) {
                                        processTopup(amount)
                                    } else {
                                        topupError = "Amount must be at least ₹100"
                                    }
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                                modifier = Modifier.height(56.dp)
                            ) {
                                if (isTopupLoading) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                                } else {
                                    Icon(imageVector = Icons.Default.Add, contentDescription = "Topup")
                                }
                            }
                        }

                        topupError?.let {
                            Text(text = it, color = Color(0xFFEF4444), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                        }
                        if (topupSuccess) {
                            Text(text = "Top-up completed successfully!", color = Color(0xFF10B981), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Transaction history header
                Text(
                    text = "Transaction History",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // History List
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(transactions) { tx ->
                        TransactionItem(tx)
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionItem(tx: JSONObject) {
    val amount = tx.optDouble("amount", 0.0)
    val type = tx.optString("type", "debit")
    val category = tx.optString("category", "purchase")
    val description = tx.optString("description", "Cafeteria payment")
    val isCredit = type == "credit" || type == "topup"

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B).copy(alpha = 0.6f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(
                            if (isCredit) Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f),
                            RoundedCornerShape(8.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isCredit) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                        contentDescription = null,
                        tint = if (isCredit) Color(0xFF10B981) else Color(0xFFEF4444),
                        modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = description, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(text = category.replaceFirstChar { it.uppercase() }, color = Color(0xFF94A3B8), fontSize = 11.sp)
                }
            }
            Text(
                text = "${if (isCredit) "+" else "-"} ₹${String.format("%.2f", amount)}",
                color = if (isCredit) Color(0xFF10B981) else Color(0xFFEF4444),
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        }
    }
}

private fun getMockTransactions(): List<JSONObject> {
    val list = mutableListOf<JSONObject>()
    val desc = listOf("Wallet top-up", "Cafeteria payment", "Library fine", "School Bus Subscription")
    val ams = listOf(1000.0, 150.0, 50.0, 800.0)
    val cats = listOf("topup", "food", "fine", "transport")
    val types = listOf("credit", "debit", "debit", "debit")
    
    for (i in desc.indices) {
        val o = JSONObject().apply {
            put("amount", ams[i])
            put("type", types[i])
            put("category", cats[i])
            put("description", desc[i])
        }
        list.add(o)
    }
    return list
}
