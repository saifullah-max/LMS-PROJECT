const nodemailer = require("nodemailer");
const User = require("../model/User"); // Assuming you have a User model

// Configure nodemailer transporter with your SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendSubmissionEmail({
  toUserId,
  assignmentTitle,
  courseTitle,
  deadline,
  submissionUrl,
}) {
  // Lookup user's email and name
  const user = await User.findById(toUserId);
  if (!user) throw new Error("User not found for sending email");

  const mailOptions = {
    from: process.env.SMTP_FROM, // e.g. "LMS Support <no-reply@school.com>"
    to: user.email,
    subject: `Assignment Submitted: ${assignmentTitle}`,
    text: `Dear ${user.name},

Your submission for the assignment "${assignmentTitle}" in the course "${courseTitle}" has been received successfully.

Deadline: ${new Date(deadline).toLocaleString()}

You can view your submission here: ${submissionUrl}

Thank you,
LMS Team`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Submission confirmation email sent:", info.messageId);
}

module.exports = { sendSubmissionEmail };
