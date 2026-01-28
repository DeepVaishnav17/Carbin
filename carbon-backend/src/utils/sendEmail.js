const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // connectionTimeout: 10000, // 10 seconds
      // socketTimeout: 10000,     // 10 seconds
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.log("❌ Email error:", err);
    throw err;
  }
};

module.exports = sendEmail;
