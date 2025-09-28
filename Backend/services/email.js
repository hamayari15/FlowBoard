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
    await transporter.sendMail({
      from: `"FlowBoard Team" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
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
  
  await sendEmail(emailData.email, subject, emailTemplate);
}

module.exports = { sendEmail, sendInvitationEmail };
