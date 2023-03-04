const Joi = require("joi");
const bcrypt = require("bcrypt");
const moment = require("moment");
const express = require("express");
const router = express.Router();
const validator = require("../middleware/validator");
const { Otp, validate } = require("../models/otp");
const { User } = require("../models/user");
const generateOtp = require("../utils/generateOtp");
const sendMail = require("../utils/sendMail");

router.post("/", [validator(validate)], async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  const user = await User.findOne({ email });

  if (!user) return res.status(400).send("Invalid email.");

  if (user.isVerified)
    return res.status(400).send("Email has already been verified.");

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<p>Verify your email with the code below.</p>
           <p><b>${otp}</b></p>
           <p>This code expires in 10 minutes</p>`,
  };

  await Otp.deleteOne({ email });

  const newOtp = new Otp({ email, otp });
  newOtp.otp = await bcrypt.hash(newOtp.otp, 10);
  await newOtp.save();

  await sendMail(mailOptions);
  res.send(newOtp);
});

router.post("/verify", [validator(validateRequest)], async (req, res) => {
  const { email, otp } = req.body;
  let user = await User.findOne({ email });
  if (!user) return res.status(400).send("Invalid email.");

  if (user.isVerified)
    return res.status(400).send("Email has already been verified.");

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

  await User.updateOne({ email }, { $set: { isVerified: true } });

  res.send({ email, isVerified: true });
});

function validateRequest(req) {
  const schema = Joi.object({
    email: Joi.string().email().required().min(10).max(50),
    otp: Joi.string().required().min(4).max(4),
  });

  return schema.validate(req);
}

module.exports = router;
