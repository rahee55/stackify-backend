const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    trim: true // MODERN: Removes accidental spaces like " tariq "
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, // MODERN: "User@Email.com" becomes "user@email.com"
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
}, { timestamps: true });

// MODERN FIX: No 'next' parameter needed with async/await
UserSchema.pre('save', async function () {
  // 1. If password wasn't modified, exit immediately
  if (!this.isModified('password')) return;

  // 2. Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to check password during login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);