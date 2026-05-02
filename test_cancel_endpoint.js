#!/usr/bin/env node

const http = require('http');
const querystring = require('querystring');

// Test configuration
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? require('https') : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.status, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.status, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testCancelEndpoint() {
  console.log('🧪 Testing Cancel Endpoint\n');

  // First, login as user
  console.log('1️⃣  Login as user...');
  try {
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'user@example.com',
      password: 'password123',
    });
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Cookies: ${loginRes.headers['set-cookie']?.join('; ')}\n`);

    if (loginRes.status !== 200) {
      console.error('❌ Login failed. Skipping cancel test.');
      return;
    }

    // Extract userToken cookie
    const cookies = loginRes.headers['set-cookie'] || [];
    const userTokenCookie = cookies.find((c) => c.includes('userToken='));
    if (!userTokenCookie) {
      console.error('❌ userToken cookie not found. Skipping cancel test.');
      return;
    }

    console.log('2️⃣  Fetching user orders...');
    const ordersRes = await makeRequest('GET', '/api/orders/my-orders', null, {
      Cookie: userTokenCookie,
    });
    console.log(`   Status: ${ordersRes.status}`);

    if (!Array.isArray(ordersRes.data) || ordersRes.data.length === 0) {
      console.error('❌ No orders found. Skipping cancel test.');
      return;
    }

    const order = ordersRes.data[0];
    const orderId = order._id;
    console.log(`   Found order: ${orderId}\n`);

    console.log('3️⃣  Testing PATCH /api/orders/:id/cancel with path param...');
    const patchRes = await makeRequest(
      'PATCH',
      `/api/orders/${orderId}/cancel`,
      null,
      { Cookie: userTokenCookie }
    );
    console.log(`   Status: ${patchRes.status}`);
    console.log(`   Response:`, patchRes.data);
    console.log();

    console.log('4️⃣  Testing POST /api/orders/cancel with body...');
    const postRes = await makeRequest(
      'POST',
      '/api/orders/cancel',
      { orderId },
      { Cookie: userTokenCookie }
    );
    console.log(`   Status: ${postRes.status}`);
    console.log(`   Response:`, postRes.data);
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testCancelEndpoint().catch(console.error);
