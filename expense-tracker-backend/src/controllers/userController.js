const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
console.log("BcryptJS version:", bcrypt.version);
// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public

const registerUser = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all fields');
  }

  name = name.trim();
  email = email.trim();
  password = password.trim();

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // ✅ Hash password correctly
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('🔐 Generated hash during register:', hashedPassword);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('--- LOGIN DEBUG ---');
  console.log('Incoming email:', email);
  console.log('Incoming password:', password);

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    console.log('No user found');
    res.status(400);
    throw new Error('Invalid email or password');
  }

//   console.log('Stored hash:', user.password);
//   const isMatch = await bcrypt.compare(password, user.password);
//   console.log('Compare result:', isMatch);
//   console.log('--- END DEBUG ---');

  if (!isMatch) {
    res.status(400);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});


// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
};
