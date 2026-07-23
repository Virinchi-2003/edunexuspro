package com.example.edunexuspro.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.edunexuspro.network.NetworkClient
import kotlinx.coroutines.launch
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupportScreen(
    studentId: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()
    var subject by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    
    // Category dropdown
    var categoryExpanded by remember { mutableStateOf(false) }
    val categories = listOf("technical", "academic", "transport", "fees", "other")
    var selectedCategory by remember { mutableStateOf("technical") }

    // Priority dropdown
    var priorityExpanded by remember { mutableStateOf(false) }
    val priorities = listOf("low", "medium", "high")
    var selectedPriority by remember { mutableStateOf("medium") }

    var isSubmitting by remember { mutableStateOf(false) }
    var submitSuccess by remember { mutableStateOf(false) }
    var submitError by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Support & Inquiries", color = Color.White, fontWeight = FontWeight.Bold) },
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
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            Text(
                text = "Submit a Ticket",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp
            )
            Text(
                text = "Describe your issue or parental request, and our administration will address it shortly.",
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    // Category Selection
                    Text(text = "Category", color = Color(0xFF94A3B8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                        OutlinedButton(
                            onClick = { categoryExpanded = true },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = selectedCategory.replaceFirstChar { it.uppercase() })
                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                            }
                        }
                        DropdownMenu(
                            expanded = categoryExpanded,
                            onDismissRequest = { categoryExpanded = false },
                            modifier = Modifier.fillMaxWidth(0.8f).background(Color(0xFF1E293B))
                        ) {
                            categories.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text(cat.replaceFirstChar { it.uppercase() }, color = Color.White) },
                                    onClick = {
                                        selectedCategory = cat
                                        categoryExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Priority Selection
                    Text(text = "Priority Level", color = Color(0xFF94A3B8), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Box(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                        OutlinedButton(
                            onClick = { priorityExpanded = true },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = selectedPriority.replaceFirstChar { it.uppercase() })
                                Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null)
                            }
                        }
                        DropdownMenu(
                            expanded = priorityExpanded,
                            onDismissRequest = { priorityExpanded = false },
                            modifier = Modifier.fillMaxWidth(0.8f).background(Color(0xFF1E293B))
                        ) {
                            priorities.forEach { prio ->
                                DropdownMenuItem(
                                    text = { Text(prio.replaceFirstChar { it.uppercase() }, color = Color.White) },
                                    onClick = {
                                        selectedPriority = prio
                                        priorityExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Subject Input
                    OutlinedTextField(
                        value = subject,
                        onValueChange = { subject = it },
                        label = { Text("Subject", color = Color(0xFF94A3B8)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF3B82F6),
                            unfocusedBorderColor = Color(0xFF475569),
                            focusedLabelColor = Color(0xFF3B82F6),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Description Message Input
                    OutlinedTextField(
                        value = message,
                        onValueChange = { message = it },
                        label = { Text("Describe your query...", color = Color(0xFF94A3B8)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF3B82F6),
                            unfocusedBorderColor = Color(0xFF475569),
                            focusedLabelColor = Color(0xFF3B82F6),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        minLines = 4,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    submitError?.let {
                        Text(text = it, color = Color(0xFFEF4444), fontSize = 13.sp, modifier = Modifier.padding(bottom = 12.dp))
                    }
                    if (submitSuccess) {
                        Text(text = "Ticket submitted successfully!", color = Color(0xFF10B981), fontSize = 13.sp, modifier = Modifier.padding(bottom = 12.dp))
                    }

                    // Submit Button
                    Button(
                        onClick = {
                            if (subject.isEmpty() || message.isEmpty()) {
                                submitError = "Please fill in all fields"
                                return@Button
                            }
                            submitError = null
                            submitSuccess = false
                            isSubmitting = true

                            scope.launch {
                                try {
                                    val payload = JSONObject().apply {
                                        put("schoolId", NetworkClient.userSchoolId ?: "")
                                        put("studentId", studentId)
                                        put("subject", subject)
                                        put("message", message)
                                        put("category", selectedCategory)
                                        put("priority", selectedPriority)
                                    }
                                    val res = NetworkClient.post("/student/support-ticket", payload)
                                    if (res.optString("status") == "success" || res.has("data")) {
                                        submitSuccess = true
                                        subject = ""
                                        message = ""
                                    } else {
                                        submitError = res.optString("message", "Failed to submit ticket")
                                    }
                                } catch (e: Exception) {
                                    submitError = e.message ?: "Failed to submit ticket"
                                } finally {
                                    isSubmitting = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().height(50.dp)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                        } else {
                            Text("Submit Inquiry", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
