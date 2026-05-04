const axios = require('axios');

async function testDashboardApi() {
  const studentId = '5b1dcd42-8be3-43e9-a0c6-d10955f4006e';
  const url = `http://localhost:5000/api/portal/dashboard/${studentId}`;
  
  try {
    console.log(`🚀 Testing Dashboard API: ${url}`);
    const res = await axios.get(url);
    console.log('API Response:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) console.log('Response Data:', error.response.data);
  }
}

testDashboardApi();
