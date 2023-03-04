const _ = require("lodash");
const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const { User, validate } = require("../models/user");
const validator = require("../middleware/validator");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateId = require("../middleware/validateId");

router.get("/me", [auth], async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  res.send(user);
});

router.get("/", [auth, admin], async (req, res) => {
  const users = await User.find({ isAdmin: false }).select("-password");

  res.send(users);
});

router.get("/:id", [auth, admin, validateId], async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).send("User not found.");

  res.send(user);
});

router.post("/", [validator(validate)], async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already exist.");

  user = new User(req.body);
  user.password = await bcrypt.hash(user.password, 10);
  await user.save();

  user = _.pick(user, ["_id", "name", "email", "isVerified", "isAdmin"]);
  res.send(user);
});

router.delete("/:id", [validateId], async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).send("User not found.");

  res.send(user);
});

module.exports = router;
