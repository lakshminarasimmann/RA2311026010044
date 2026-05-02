/**
 * @module register
 * @description One-time registration script.
 *
 * Usage:
 *   1. Fill in .env with your registration details
 *   2. Run: node src/auth/register.js
 *   3. Save the returned clientID and clientSecret to .env
 */

"use strict";

require("dotenv").config();

const http = require("http");
const config = require("../config");

const payload = JSON.stringify({
  email: config.registration.email,
  name: config.registration.name,
  mobileNo: config.registration.mobileNo,
  githubUsername: config.registration.githubUsername,
  rollNo: config.registration.rollNo,
  accessCode: config.registration.accessCode,
});

console.log("\n📝 Registering with Evaluation Service...\n");
console.log("Payload:", JSON.stringify(JSON.parse(payload), null, 2), "\n");

const options = {
  hostname: config.apiHost,
  port: 80,
  path: `${config.apiBasePath}/register`,
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

      if (data.clientID && data.clientSecret) {
        console.log("\n✅  Registration successful!");
        console.log("─────────────────────────────────");
        console.log(`  CLIENT_ID     = ${data.clientID}`);
        console.log(`  CLIENT_SECRET = ${data.clientSecret}`);
        console.log("─────────────────────────────────");
        console.log("\n👉  Save these values in your .env file.\n");
      } else {
        console.log("\n⚠️  Response received but clientID/clientSecret not found.");
        console.log("    Check the response above for details.\n");
      }
    } catch (parseErr) {
      console.log("Raw response:", body);
      console.error("\n❌  Failed to parse response:", parseErr.message);
    }
  });
});

req.on("error", (err) => {
  console.error(`\n❌  Registration request failed: ${err.message}`);
  console.error("    Ensure the evaluation service is reachable.\n");
});

req.on("timeout", () => {
  req.destroy();
  console.error("\n❌  Registration request timed out.\n");
});

req.write(payload);
req.end();
