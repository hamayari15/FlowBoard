const express = require("express");
const router = express.Router();
const { sendEmail } = require("../services/email");

// test endpoint: http://localhost:3000/testEmail/send
router.get("/send", async (req, res) => {
  await sendEmail(
    "invitee@example.com",
    "Test Email from Workspace App",
    "<h2>Hello 🎉 your Nodemailer setup works!</h2>"
  );
  res.send("Test email sent (check your inbox)");
});

module.exports = router;
