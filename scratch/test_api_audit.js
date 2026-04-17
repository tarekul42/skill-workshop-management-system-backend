import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api/v1';

async function testApi() {
  try {
    // 1. Login to get fresh token
    const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'admin@test.com',
      password: 'Admin@123'
    });
    
    const token = loginRes.data.data.accessToken;
    console.log('Login successful');

    // 2. Fetch Audit Logs
    const auditRes = await axios.get(`${BACKEND_URL}/audit`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Audit API status:', auditRes.status);
    console.log('Audit API top-level keys:', Object.keys(auditRes.data));
    if (auditRes.data.data) {
      console.log('Audit API data keys:', Object.keys(auditRes.data.data));
    }
    console.log('Audit API body:', JSON.stringify(auditRes.data, null, 2));

  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

testApi();
