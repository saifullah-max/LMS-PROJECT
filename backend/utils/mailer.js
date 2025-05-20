const nodemailer = require("nodemailer");

// Configure with your SMTP credentials in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(to, otp) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM, // e.g. "LMS Support <no-reply@school.com>"
    to,
    subject: "Your LMS Password Reset Code",
    text: `Your password reset code is: ${otp}\n\nIt expires in 10 minutes.`,
  });
  console.log("OTP email sent:", info.messageId);
}

module.exports = { sendOTPEmail };
