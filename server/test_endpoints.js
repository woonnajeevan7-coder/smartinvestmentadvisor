const BASE_URL = 'http://localhost:5001/api';
const testEmail = `sec_tester_${Date.now()}@example.com`;
const testPassword = 'SecurePassword123!';
let jwtToken = null;

async function runTests() {
  console.log("🏁 Starting Secure API Endpoint Verification Tests...");

  try {
    // 1. Unauthenticated Request Check (Expect 401)
    console.log("\n[Test 1] Testing GET /me without token (Expecting 401)...");
    const unauthRes = await fetch(`${BASE_URL}/me`);
    console.log("Status:", unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected status 401, got ${unauthRes.status}`);
    }
    console.log("✅ Correctly rejected unauthenticated request");

    // 2. POST /register with password
    console.log(`\n[Test 2] Testing POST /register for ${testEmail}...`);
    const regRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Secure Architect Bot", email: testEmail, password: testPassword })
    });
    console.log("Status:", regRes.status);
    const regData = await regRes.json();
    if (regRes.status !== 201) {
      console.error("Register response error:", regData);
      throw new Error(`Register failed with status ${regRes.status}`);
    }
    console.log("✅ User registered successfully. ID:", regData.user?.id);

    // 3. POST /login with password (Expecting JWT token)
    console.log("\n[Test 3] Testing POST /login...");
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    console.log("Status:", loginRes.status);
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) {
      console.error("Login response error:", loginData);
      throw new Error(`Login failed with status ${loginRes.status}`);
    }
    jwtToken = loginData.token;
    if (!jwtToken) {
      throw new Error("Login did not return a JWT token");
    }
    console.log("✅ Logged in successfully. Token acquired.");

    // Define authenticated headers
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    };

    // 4. Invalid Token Request Check (Expect 403)
    console.log("\n[Test 4] Testing GET /me with invalid token (Expecting 403)...");
    const badTokenRes = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': 'Bearer bad_token_here' }
    });
    console.log("Status:", badTokenRes.status);
    if (badTokenRes.status !== 403) {
      throw new Error(`Expected status 403, got ${badTokenRes.status}`);
    }
    console.log("✅ Correctly rejected invalid token request");

    // 5. GET /me (Expected 200 with JWT)
    console.log("\n[Test 5] Testing GET /me with valid token...");
    const meRes = await fetch(`${BASE_URL}/me`, { headers: authHeaders });
    console.log("Status:", meRes.status);
    const meData = await meRes.json();
    if (meRes.status !== 200) {
      throw new Error(`GET /me failed with status ${meRes.status}`);
    }
    console.log("✅ Successfully retrieved profile. Balance:", meData.user?.balance);

    // 6. POST /analyze-user (Payload Validation & Database Profile Save)
    console.log("\n[Test 6] Testing POST /analyze-user (Onboarding update)...");
    const analyzeRes = await fetch(`${BASE_URL}/analyze-user`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        age: 28,
        income: 7500,
        savings: 22000,
        duration: 'Long Term',
        risk: 8
      })
    });
    console.log("Status:", analyzeRes.status);
    const analyzeData = await analyzeRes.json();
    if (analyzeRes.status !== 200) {
      console.error("Analyze user error:", analyzeData);
      throw new Error(`Analyze user failed with status ${analyzeRes.status}`);
    }
    console.log("✅ User profile analyzed and saved. Category:", analyzeData.category);

    // 7. Input Validation Checks (Expect 400)
    console.log("\n[Test 7] Testing invalid payload validation rules (Expecting 400)...");
    const badPayloadRes = await fetch(`${BASE_URL}/analyze-user`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        age: 12, // Underage (must be >= 18)
        income: -100, // Invalid income
        savings: 50,
        duration: 'Very Long Term', // Invalid duration option
        risk: 11 // Invalid risk score (1-10)
      })
    });
    console.log("Status:", badPayloadRes.status);
    const badPayloadData = await badPayloadRes.json();
    if (badPayloadRes.status !== 400) {
      throw new Error(`Expected status 400, got ${badPayloadRes.status}`);
    }
    console.log("Response fields:", badPayloadData.details?.map(d => d.field).join(', '));
    console.log("✅ Input validation schema successfully rejected invalid parameters");

    // 8. GET /market
    console.log("\n[Test 8] Testing GET /market...");
    const marketRes = await fetch(`${BASE_URL}/market`, { headers: authHeaders });
    console.log("Status:", marketRes.status);
    if (marketRes.status !== 200) {
      throw new Error(`GET /market failed with status ${marketRes.status}`);
    }
    const marketData = await marketRes.json();
    console.log(`✅ Market fetch success. Return count: ${marketData.length}`);

    // 9. POST /wallet/update (Deposit $20,000)
    console.log("\n[Test 9] Testing POST /wallet/update (Deposit)...");
    const depRes = await fetch(`${BASE_URL}/wallet/update`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'Deposit',
        amount: 20000,
        method: 'Wire Transfer'
      })
    });
    console.log("Status:", depRes.status);
    const depData = await depRes.json();
    if (depRes.status !== 200) {
      console.error("Deposit error:", depData);
      throw new Error(`Deposit failed with status ${depRes.status}`);
    }
    console.log("✅ Wallet deposit completed:", depData.message);

    // 10. POST /trade/buy (Buy AAPL)
    console.log("\n[Test 10] Testing POST /trade/buy (Buy AAPL)...");
    const buyRes = await fetch(`${BASE_URL}/trade/buy`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        price: 180.00
      })
    });
    console.log("Status:", buyRes.status);
    const buyData = await buyRes.json();
    if (buyRes.status !== 200) {
      console.error("Buy error:", buyData);
      throw new Error(`Buy asset failed with status ${buyRes.status}`);
    }
    console.log("✅ Asset purchased successfully:", buyData.message);

    // 11. GET /holdings
    console.log("\n[Test 11] Testing GET /holdings...");
    const holdingsRes = await fetch(`${BASE_URL}/holdings`, { headers: authHeaders });
    console.log("Status:", holdingsRes.status);
    const holdingsData = await holdingsRes.json();
    if (holdingsRes.status !== 200) {
      throw new Error(`GET holdings failed with status ${holdingsRes.status}`);
    }
    console.log("✅ Holdings verified:", holdingsData);

    // 12. POST /trade/sell (Sell AAPL)
    console.log("\n[Test 12] Testing POST /trade/sell (Sell AAPL)...");
    const sellRes = await fetch(`${BASE_URL}/trade/sell`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'AAPL',
        quantity: 4,
        price: 185.00
      })
    });
    console.log("Status:", sellRes.status);
    const sellData = await sellRes.json();
    if (sellRes.status !== 200) {
      console.error("Sell error:", sellData);
      throw new Error(`Sell asset failed with status ${sellRes.status}`);
    }
    console.log("✅ Asset sold successfully:", sellData.message);

    // 13. GET /history
    console.log("\n[Test 13] Testing GET /history...");
    const historyRes = await fetch(`${BASE_URL}/history`, { headers: authHeaders });
    console.log("Status:", historyRes.status);
    const historyData = await historyRes.json();
    if (historyRes.status !== 200) {
      throw new Error(`GET history failed with status ${historyRes.status}`);
    }
    console.log(`✅ History logs parsed. Record count: ${historyData.length}`);

    // 14. GET /ai/recommend
    console.log("\n[Test 14] Testing GET /ai/recommend...");
    const aiRecRes = await fetch(`${BASE_URL}/ai/recommend`, { headers: authHeaders });
    console.log("Status:", aiRecRes.status);
    const aiRecData = await aiRecRes.json();
    if (aiRecRes.status !== 200) {
      throw new Error(`GET AI recommendations failed with status ${aiRecRes.status}`);
    }
    console.log(`✅ AI recommendations acquired via ${aiRecData.source}. Count: ${aiRecData.recommendations?.length}`);

    // 15. POST /ai/chat
    console.log("\n[Test 15] Testing POST /ai/chat...");
    const aiChatRes = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        message: 'How is my portfolio diversified?',
        sessionId: 'test-secure-session'
      })
    });
    console.log("Status:", aiChatRes.status);
    const aiChatData = await aiChatRes.json();
    if (aiChatRes.status !== 200) {
      throw new Error(`POST AI chat failed with status ${aiChatRes.status}`);
    }
    console.log("✅ AI chat reply excerpt:", aiChatData.reply?.slice(0, 100) + "...");

    // 16. POST /logout
    console.log("\n[Test 16] Testing POST /logout...");
    const logoutRes = await fetch(`${BASE_URL}/logout`, { method: 'POST', headers: authHeaders });
    console.log("Status:", logoutRes.status);
    if (logoutRes.status !== 200) {
      throw new Error(`POST logout failed with status ${logoutRes.status}`);
    }
    console.log("✅ Session terminated successfully.");

    console.log("\n🎉 All Production Security Verification Tests Passed Successfully!");
  } catch (err) {
    console.error("\n❌ Test verification failed with error:", err.message);
  }
}

runTests();
