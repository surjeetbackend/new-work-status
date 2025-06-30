const Work = require('../models/Work');
const generateToken = require('../utils/tokenGenerator');

exports.createWork = async (req, res) => {
  try {
    const { description, location, work_type, requirement } = req.body;

    if (!description || !location || !work_type || !requirement) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const token_no = generateToken();

    const newWork = await Work.create({
      client_id: req.user._id, // ✅ Correct field name
      token_no,
      description,
      location,
      work_type,
      requirement,
      status: 'Submitted',
    });

    res.status(201).json({
      message: 'Work submitted successfully',
      token_no,
      work: newWork
    });

  } catch (err) {
    console.error('❌ Work creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
