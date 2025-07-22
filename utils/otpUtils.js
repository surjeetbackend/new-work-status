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

// ✅ Login alert SMS
const sendLoginAlertSMS = async (phone) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    await client.messages.create({
      body: `⚠️ You have successfully logged in. If this wasn’t you, contact support immediately.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } catch (err) {
    console.error('❌ Failed to send login alert SMS:', err.message);
  }
};

module.exports = {
  generateOTP,
  sendOTPSMS,
  sendLoginAlertSMS, // 👈 export added
};
