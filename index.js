const express = require("express");
const app = express();
require("dotenv").config();
require("./config/db")();
const users = require("./routes/users");
const auth = require("./routes/auth");
const emailVerification = require("./routes/email-verification");
const forgotPassword = require("./routes/forgot-password");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/email-verification", emailVerification);
app.use("/api/forgot-password", forgotPassword);

const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
