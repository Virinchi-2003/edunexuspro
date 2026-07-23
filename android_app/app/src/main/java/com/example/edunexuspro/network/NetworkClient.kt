package com.example.edunexuspro.network

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

object NetworkClient {
    private const val TAG = "NetworkClient"
    
    // 10.0.2.2 redirects to localhost/127.0.0.1 on the host machine from the Android emulator
    private const val BASE_URL = "http://10.0.2.2:5000/api"
    
    var token: String? = null
    var userRole: String? = null
    var userEmail: String? = null
    var userDisplayName: String? = null
    var userSchoolId: String? = null
    var userUid: String? = null

    suspend fun post(endpoint: String, payload: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            val url = URL("$BASE_URL$endpoint")
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            token?.let {
                connection.setRequestProperty("Authorization", "Bearer $it")
            }

            val writer = OutputStreamWriter(connection.outputStream)
            writer.write(payload.toString())
            writer.flush()
            writer.close()

            val responseCode = connection.responseCode
            val inputStream = if (responseCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream
            }

            val reader = BufferedReader(InputStreamReader(inputStream))
            val response = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                response.append(line)
            }
            reader.close()

            Log.d(TAG, "POST $endpoint Response Code: $responseCode")
            JSONObject(response.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error in POST request: ${e.message}", e)
            JSONObject().apply {
                put("status", "error")
                put("message", e.message ?: "Unknown network error")
            }
        } finally {
            connection?.disconnect()
        }
    }

    suspend fun get(endpoint: String): JSONObject = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            val url = URL("$BASE_URL$endpoint")
            connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            connection.setRequestProperty("Content-Type", "application/json")
            token?.let {
                connection.setRequestProperty("Authorization", "Bearer $it")
            }

            val responseCode = connection.responseCode
            val inputStream = if (responseCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream
            }

            val reader = BufferedReader(InputStreamReader(inputStream))
            val response = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                response.append(line)
            }
            reader.close()

            Log.d(TAG, "GET $endpoint Response Code: $responseCode")
            JSONObject(response.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error in GET request: ${e.message}", e)
            JSONObject().apply {
                put("status", "error")
                put("message", e.message ?: "Unknown network error")
            }
        } finally {
            connection?.disconnect()
        }
    }

    suspend fun login(email: String, password: String, schoolId: String? = null): JSONObject {
        val payload = JSONObject().apply {
            put("email", email)
            put("password", password)
            if (!schoolId.isNullOrEmpty()) {
                put("schoolId", schoolId)
            }
        }
        val response = post("/auth/login", payload)
        if (response.optString("status") == "success") {
            token = response.optString("token")
            val data = response.optJSONObject("data")
            if (data != null) {
                userUid = data.optString("uid")
                userEmail = data.optString("email")
                userRole = data.optString("role")
                userDisplayName = data.optString("displayName")
                userSchoolId = data.optString("schoolId")
            }
        }
        return response
    }
}
