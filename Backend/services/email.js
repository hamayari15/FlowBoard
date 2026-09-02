const nodemailer = require("nodemailer");
const { getEmailTemplate } = require("./emailTemplates");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: `"FlowBoard Team" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);

    // When SMTP is a test/catch-all account (e.g. Ethereal), the email never
    // reaches a real inbox. nodemailer gives us a preview URL in that case so
    // we can actually see what was sent, instead of it disappearing silently.
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📬 Preview this email (test SMTP, not a real inbox): ${previewUrl}`);
    }

    return { success: true, previewUrl: previewUrl || null };
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return { success: false, error: err.message };
  }
}

// Enhanced email sending function with templates
async function sendInvitationEmail(type, emailData) {
  const emailTemplate = getEmailTemplate(type, emailData);
  
  const subjects = {
    WORKSPACE_ADD_EXISTING: `Welcome to ${emailData.workspaceName}! 🎉`,
    WORKSPACE_INVITE_NEW: `You're invited to join ${emailData.workspaceName}! 📧`,
    PROJECT_ADD_EXISTING: `Added to project: ${emailData.projectName} 🚀`,
    PROJECT_INVITE_NEW: `Project invitation: ${emailData.projectName} 🎯`
  };

  const subject = subjects[type] || `Invitation from FlowBoard`;
  
  return sendEmail(emailData.email, subject, emailTemplate);
}

module.exports = { sendEmail, sendInvitationEmail };
