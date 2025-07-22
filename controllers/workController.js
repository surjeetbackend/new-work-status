const Work = require('../models/Work');
const generateToken = require('../utils/tokenGenerator');

exports.createWork = async (req, res) => {
  console.log('🛠️ Submitting work for user:', req.user.email);

  try {
    const token_no = 'W-' + Date.now().toString().slice(-4); // Or your logic
    const newWork = new Work({
      client_id: req.user._id,
      token_no,
      description: req.body.description,
      location: req.body.location,
      work_type: req.body.work_type,
      requirement: req.body.requirement,
      contact_name:req.body.contact_name,
      contact_phone:req.body.contact_phone,
    });

    await newWork.save();
    res.status(201).json({ message: 'Work submitted', token_no });
  } catch (err) {
    console.error('❌ Work submission error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

