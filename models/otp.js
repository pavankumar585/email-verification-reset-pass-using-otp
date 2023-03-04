const Joi = require("joi");
const moment = require("moment");
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 10,
    maxlength: 50,
  },
  otp: {
    type: String,
    required: true,
    minlength: 60,
    maxlenght: 60,
  },
  expiresIn: {
    type: Date,
    default: moment().add(5, "minutes"),
  },
});

const Otp = mongoose.model("Otp", otpSchema);

function validateEmail(email) {
  const schema = Joi.object({
    email: Joi.string().email().required().min(10).max(50),
  });

  return schema.validate(email);
}

module.exports.validate = validateEmail;
module.exports.Otp = Otp;
