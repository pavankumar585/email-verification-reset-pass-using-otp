const Joi = require("joi");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    minlength: 10,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 60,
    maxlength: 60,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.genAuthToken = function () {
  const { _id, isAdmin } = this;

  return jwt.sign({ _id, isAdmin }, process.env.JWT_PRIVATE_KEY);
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(50),
    email: Joi.string().email().required().min(10).max(50),
    password: Joi.string().required().min(8).max(50),
  });

  return schema.validate(user);
}

module.exports.User = User;
module.exports.validate = validateUser;
