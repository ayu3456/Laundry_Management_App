const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new student
// @access  Public
router.post('/register', async (req, res) => {
  const { name, rollNumber, email, password, hostel, room } = req.body;

  try {
    const userExists = await User.findOne({ rollNumber });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({
      name,
      rollNumber,
      email,
      password,
      role: 'student', // Force student role for public registration
      hostel,
      room
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { loginId, password } = req.body; // loginId can be email or rollNumber

  try {
    // Check for email or rollNumber
    const user = await User.findOne({ 
        $or: [{ email: loginId }, { rollNumber: loginId }] 
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ error: 'Invalid email/roll number or password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
