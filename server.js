const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// ✅ MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ✅ Root Route (Browser Access Message)
app.get("/", (req, res) => {
  res.send("✅ NEXORA Server Run Successfully!");
});

// ✅ User Schema
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  fullName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  dob: String,
  gender: String,
  region: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

// ✅ OTP Schema
const OTPSchema = new mongoose.Schema({
  email: String,
  code: String,
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 mins
});
const OTP = mongoose.model("OTP", OTPSchema);

// ✅ Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ 6-digit Code Generator
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 🔸 API: Sign Up
app.post("/api/signup", async (req, res) => {
  const {
    firstName, lastName, fullName,
    username, email, password,
    dob, gender, region
  } = req.body;

  if (!firstName || !lastName || !fullName || !username || !email || !password || !dob || !gender || !region) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: "Username or Email already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      fullName,
      username,
      email,
      password,
      dob,
      gender,
      region
    });
    await user.save();

    const code = generateOTP();
    await OTP.create({ email, code });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "NEXORA Email Verification Code",
      text: `Your verification code is: ${code}`
    });

    res.status(201).json({ message: "User registered. OTP sent." });
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

// 🔹 API: Send New Code (Resend)
app.post("/api/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const code = generateOTP();

  try {
    await OTP.deleteMany({ email }); // delete old codes
    await OTP.create({ email, code });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "NEXORA Email Verification Code",
      text: `Your verification code is: ${code}`
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ Resend Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// 🔹 API: Verify Code
app.post("/api/verify-code", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code required" });

  try {
    const entry = await OTP.findOne({ email, code });
    if (!entry) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    await OTP.deleteOne({ _id: entry._id });
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("❌ Verification Error:", err);
    res.status(500).json({ message: "Verification failed", error: err.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
