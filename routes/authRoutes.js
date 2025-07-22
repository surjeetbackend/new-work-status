const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  registerSendOTP,
  registerVerifyOTP,
  loginSendOTP,
  loginVerifyOTP,
  getProfile
} = require('../controllers/authController');

router.post('/register/send-otp', registerSendOTP);
router.post('/register/verify-otp', registerVerifyOTP);
router.post('/login/send-otp', loginSendOTP);
router.post('/login/verify-otp', loginVerifyOTP);

// ✅ Protect the profile route
router.get('/profile', verifyToken, getProfile);

module.exports = router;
