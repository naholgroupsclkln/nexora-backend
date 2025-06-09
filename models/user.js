// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  fullName: String,
  username: { type: String, unique: true },
  email: String,
  password: String,
  dob: String,
  gender: String,
  region: String
});

module.exports = mongoose.model('User', userSchema);
