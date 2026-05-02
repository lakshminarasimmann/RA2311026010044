/**
 * @module getToken
 * @description Obtains an access token from the evaluation service.
 *
 * Usage:
 *   1. Ensure CLIENT_ID and CLIENT_SECRET are set in .env
 *   2. Run: node src/auth/getToken.js
 *   3. Save the returned access_token to .env
 */

"use strict";

require("dotenv").config();

const http = require("http");
const config = require("../config");

if (!config.clientId || !config.clientSecret) {
  console.error("\n❌  CLIENT_ID and CLIENT_SECRET must be set in .env");
  console.error("    Run register.js first to obtain these.\n");
  process.exit(1);
}

const payload = JSON.stringify({
  clientID: config.clientId,
  clientSecret: config.clientSecret,
});

console.log("\n🔑 Requesting auth token...\n");

const options = {
  hostname: config.apiHost,
  port: 80,
  path: `${config.apiBasePath}/auth`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
  timeout: 10000,
};

const req = http.request(options, (res) => {
  let body = "";

  res.on("data", (chunk) => {
    body += chunk;
  });

  res.on("end", () => {
    console.log(`Status: ${res.statusCode}\n`);

    try {
      const data = JSON.parse(body);
      console.log("Response:", JSON.stringify(data, null, 2));

      const token = data.access_token || data.accessToken || data.token;
      if (token) {
        console.log("\n✅  Token obtained successfully!");
        console.log("─────────────────────────────────");
        console.log(`  ACCESS_TOKEN = ${token}`);
        console.log("─────────────────────────────────");
        console.log("\n👉  Save this token in your .env file.");
        console.log("    Also add it to vehicle_maintenance_scheduler/.env\n");
      } else {
        console.log("\n⚠️  Response received but access_token not found.");
        console.log("    Check the response above for details.\n");
      }
    } catch (parseErr) {
      console.log("Raw response:", body);
      console.error("\n❌  Failed to parse response:", parseErr.message);
    }
  });
});

req.on("error", (err) => {
  console.error(`\n❌  Auth request failed: ${err.message}`);
  console.error("    Ensure the evaluation service is reachable.\n");
});

req.on("timeout", () => {
  req.destroy();
  console.error("\n❌  Auth request timed out.\n");
});

req.write(payload);
req.end();
