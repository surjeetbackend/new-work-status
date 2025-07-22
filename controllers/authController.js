const User = require('../models/User');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPSMS ,  sendLoginAlertSMS  } = require('../utils/otpUtils');

const otpStore = {};

exports.registerSendOTP = async (req, res) => {
  try {
    const { name, email, phone, city, role } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ error: 'Phone already registered' });

    const otp = generateOTP();
    otpStore[phone] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
      userData: { name, email, phone, city, role },
    };

    await sendOTPSMS(phone, otp);
    res.json({ message: 'OTP sent for registration' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.registerVerifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const record = otpStore[phone];

    if (!record || Date.now() > record.expires)
      return res.status(400).json({ error: 'OTP expired or invalid' });

    if (record.otp !== otp)
      return res.status(400).json({ error: 'Incorrect OTP' });

    const { name, email,city, role } = record.userData;
    const user = await User.create({ name, email, phone, city , role });

    delete otpStore[phone];
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginSendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    otpStore[phone] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    await sendOTPSMS(phone, otp);
    res.json({ message: 'OTP sent for login' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.loginVerifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const record = otpStore[phone];

    if (!record || Date.now() > record.expires)
      return res.status(400).json({ error: 'OTP expired or invalid' });

    if (record.otp !== otp)
      return res.status(400).json({ error: 'Incorrect OTP' });

    let user = await User.findOne({ phone });
    let isNew = false;

    if (!user) {
      user = await User.create({ phone, name: 'New User' });
      isNew = true;
    }

    delete otpStore[phone];

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Send alert SMS after login
    await sendLoginAlertSMS(phone);

    res.json({
      message: isNew ? `Welcome, ${user.name}! Thanks for joining.` : `Welcome back, ${user.name}!`,
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

     

//  without phone number ------


// exports.registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await User.create({ name, email, password: hashedPassword, role });
//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

// exports.loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ error: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: '1d',
//     });

//     res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }; 
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password'); // don't send password
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
