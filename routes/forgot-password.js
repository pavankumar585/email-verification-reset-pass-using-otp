const Joi = require("joi");
const moment = require("moment");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const validator = require("../middleware/validator");
const { User } = require("../models/user");
const { Otp, validate } = require("../models/otp");
const generateOtp = require("../utils/generateOtp");
const sendMail = require("../utils/sendMail");

router.post("/", [validator(validate)], async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  const user = await User.findOne({ email });

  if (!user) return res.status(400).send("invalid email.");

  if (!user.isVerified)
    return res
      .status(400)
      .send("Email hasn't been verified yet. Check your inbox.");

  const emailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Reset Password",
    html: `<p>Verify your email with the code below.</p>
           <p><b>${otp}</b></p>
           <p>This code expires in 10 minutes</p>`,
  };

  await Otp.deleteOne({ email });

  const newOtp = new Otp({ email, otp });
  newOtp.otp = await bcrypt.hash(newOtp.otp, 10);
  await newOtp.save();

  await sendMail(emailOptions);
  res.send(newOtp);
});

router.post("/reset", [validator(validateRequest)], async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid email.");

  const matchedOtp = await Otp.findOne({ email });
  if (!matchedOtp) return res.status(400).send("No otp record found.");

  if (moment(matchedOtp.expiresIn).isBefore(moment())) {
    await Otp.deleteOne({ email });
    res.status(400).send("Code has expired. Request for new one.");
    return;
  }

  const validOtp = await bcrypt.compare(otp, matchedOtp.otp);
  if (!validOtp)
    return res.status(400).send("Invalid code passed. Check your inbox.");

  await Otp.deleteOne({ email });

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { $set: { password: hashed } });

  res.send({ email, passwordReset: true });
});

function validateRequest(req) {
  const schema = Joi.object({
    email: Joi.string().email().required().min(10).max(50),
    otp: Joi.string().required().min(4).max(4),
    newPassword: Joi.string().required().min(8).max(50),
  });

  return schema.validate(req);
}

module.exports = router;
