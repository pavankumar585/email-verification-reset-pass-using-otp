const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

async function sendMail(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
}

module.exports = sendMail;
