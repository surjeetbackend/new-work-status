const express = require('express');
const router = express.Router();

// const { registerUser, loginUser } = require('../controllers/authController');
const {registerSendOTP,registerVerifyOTP,loginSendOTP,loginVerifyOTP } = require('../controllers/authController');


router.post('/register/send-otp', registerSendOTP);
router.post('/register/verify-otp', registerVerifyOTP);


router.post('/login/send-otp', loginSendOTP);
router.post('/login/verify-otp', loginVerifyOTP);

// router.post('/register', registerUser);
// router.post('/login', loginUser);

module.exports = router;
