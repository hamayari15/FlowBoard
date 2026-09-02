// One-off helper: creates a fresh Ethereal test-SMTP account and writes its
// credentials into Backend/.env. Run this whenever you see
// "535 Authentication failed" from Ethereal - the old test account expired.
//
// Usage (from Backend/):  node scripts/refresh_ethereal_account.js

const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("Requesting a new Ethereal test account...");
  const testAccount = await nodemailer.createTestAccount();

  console.log("New Ethereal test account created:");
  console.log("  user:", testAccount.user);
  console.log("  pass:", testAccount.pass);

  const envPath = path.join(__dirname, "..", ".env");
  let env = fs.readFileSync(envPath, "utf8");

  if (!/SMTP_USER\s*=/.test(env) || !/SMTP_PASS\s*=/.test(env)) {
    throw new Error("Could not find SMTP_USER / SMTP_PASS lines in .env - update it manually.");
  }

  env = env.replace(/SMTP_USER\s*=.*/,  `SMTP_USER = ${testAccount.user}`);
  env = env.replace(/SMTP_PASS\s*=.*/,  `SMTP_PASS = ${testAccount.pass}`);
  env = env.replace(/SMTP_HOST\s*=.*/,  `SMTP_HOST = ${testAccount.smtp.host}`);
  env = env.replace(/SMTP_PORT\s*=.*/,  `SMTP_PORT = ${testAccount.smtp.port}`);

  fs.writeFileSync(envPath, env);
  console.log("\nBackend/.env updated. Restart the server (node server.js) and try the invite again.");
})().catch((err) => {
  console.error("Failed to create/save a new Ethereal test account:", err.message);
  process.exit(1);
});
