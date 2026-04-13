// server.js
// Node.js Express server for IVP / Yakeen API (SaudiByNin service)
// ✅ Credentials now loaded from .env file (secure & best practice)

const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// === CREDENTIALS FROM .env FILE ===
const CREDENTIALS = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  appId: process.env.APP_ID,
  appKey: process.env.APP_KEY,
};

// Validate that all keys are loaded
if (!CREDENTIALS.username || !CREDENTIALS.password || !CREDENTIALS.appId || !CREDENTIALS.appKey) {
  console.error("❌ Missing credentials in .env file. Please check your .env file.");
  process.exit(1);
}

// === API CONSTANTS FROM THE TECHNICAL INTEGRATION GUIDE ===
const BASE_URL = "https://yakeencore.api.elm.sa";
const LOGIN_URL = `${BASE_URL}/api/v2/yakeen/login`;
const DATA_URL = `${BASE_URL}/api/v1/yakeen/data`;

const SERVICE_IDENTIFIER = "9e8aef29-9e63-4b91-8aef-9ec240b1e624";
const USAGE_CODE = "USC20001";
const OPERATOR_ID = "100001010";

app.get("/", (req, res) => {
  res.status(200).json({ status: "hello world" });
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// POST /saudi-by-nin
// Body: { "nin": "1234567890", "birthDateG": "1990-01-01" }
app.post("/saudi-by-nin", async (req, res) => {
  try {
    const { nin, birthDateG } = req.body;

    if (!nin || !birthDateG) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: nin and birthDateG",
      });
    }

    // ==================== STEP 1: LOGIN (GET) ====================
    const loginHeaders = {
      "app-id": CREDENTIALS.appId,
      "app-key": CREDENTIALS.appKey,
      Username: CREDENTIALS.username,
      Password: CREDENTIALS.password,
    };

    const loginResponse = await axios.get(LOGIN_URL, { headers: loginHeaders });

    const accessToken = loginResponse.data.access_token;

    if (!accessToken) {
      throw new Error("Login failed - no access_token received");
    }

    // ==================== STEP 2: CALL SAUDI BY NIN DATA API ====================
    const dataParams = { nin, birthDateG };

    const dataHeaders = {
      authorization: `Bearer ${accessToken}`,
      "service-identifier": SERVICE_IDENTIFIER,
      "usage-code": USAGE_CODE,
      "operator-id": OPERATOR_ID,
      "app-id": CREDENTIALS.appId,
      "app-key": CREDENTIALS.appKey,
    };

    console.log({ dataHeaders, dataParams });

    const apiResponse = await axios.get(DATA_URL, {
      headers: dataHeaders,
      params: dataParams,
    });

    // SUCCESS
    return res.status(200).json({
      success: true,
      data: apiResponse.data,
    });
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || {
        message: error.message,
        status: error.response?.status,
      },
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Test endpoint → POST http://localhost:${PORT}/saudi-by-nin`);
  console.log(`   Body example: { "nin": "1234567890", "birthDateG": "1995-03-15" }`);
  console.log(`🔑 Credentials loaded from .env file`);
});
