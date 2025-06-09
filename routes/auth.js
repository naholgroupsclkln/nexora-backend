const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Sign Up API
router.post('/signup', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      username,
      dob,
      gender,
      email,
      password,
      region
    } = req.body;

    // 🔍 Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username Not Available' });
    }

    // ✅ Create new user
    const newUser = new User({
      firstName,
      lastName,
      fullName,
      username,
      dob,
      gender,
      email,
      password,
      region
    });

    await newUser.save();
    return res.status(201).json({ message: 'Account Created Successfully' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error Creating Account',
      error: error.message
    });
  }
});

// 🔁 Password Reset API
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: 'Email and New Password are required'
      });
    }

    // 🔍 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User Not Found' });
    }

    // 🔑 Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password Updated Successfully' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error Updating Password',
      error: error.message
    });
  }
});

module.exports = router;
