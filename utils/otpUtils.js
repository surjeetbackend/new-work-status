const twilio = require('twilio');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPSMS = async (phone, otp) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your OTP is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

module.exports = { generateOTP, sendOTPSMS };
