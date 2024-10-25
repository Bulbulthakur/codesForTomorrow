const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "jasmin92@ethereal.email",
    pass: "gqbbSQUQhcpJwpPPhd",
  },
});

exports.signup = async (req, res) => {
  const { fname, lname, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fname,
      lname,
      email,
      phone,
      password: hashedPassword,
    });
    res
      .status(201)
      .json({ status: true, user, message: "User Register Successfully" });
  } catch (error) {
    res.status(500).json({ status: false, error: "Something went wrong" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ status: false, error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res
      .status(200)
      .json({ status: true, user, token, message: "User Login Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.forgetPass = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.tokenTime = new Date();
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`; // Update as needed

    const mailOptions = {
      from: "Bulbul",
      to: user.email,
      subject: "Password Reset",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to email",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.resetPass = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, confirmPassword } = req.body;

    const user = await User.findOne({ where: { id: id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.tokenTime = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
