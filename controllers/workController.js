const Work = require('../models/Work');
const generateToken = require('../utils/tokenGenerator');

exports.createWork = async (req, res) => {
  console.log('🛠️ Submitting work for user:', req.user.email);

  try {
  
    const lastWork = await Work.findOne().sort({ createdAt: -1 }).select('token_no').lean();

    let serial = 101; 

    if (lastWork && lastWork.token_no) {
      const lastSerial = parseInt(lastWork.token_no.split('-')[1]); 
      if (!isNaN(lastSerial)) {
        serial = lastSerial + 1;
      }
    }

    const token_no = `W-${serial}`;

   
    const newWork = new Work({
      client_id: req.user._id,
      token_no,
      description: req.body.description,
      location: req.body.location,
      work_type: req.body.work_type,
      requirement: req.body.requirement,
      contact_name: req.body.contact_name,
      contact_phone: req.body.contact_phone,
    });

    await newWork.save();
    res.status(201).json({ message: 'Work submitted', token_no });

  } catch (err) {
    console.error('❌ Work submission error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.clientFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const work = await Work.findById(id);
    if (!work) return res.status(404).json({ message: "Work not found" });

    
    if (work.feedback && work.feedback.givenBy === "Client" && work.feedback.message) {
      return res.status(400).json({
        message: "Feedback already submitted",
        feedback: work.feedback,
      });
    }

  
    work.feedback = {
      givenBy: "Client",
      message: comment.trim(),
      date: new Date(),
    };

    await work.save();

    res.status(200).json({
      message: "Feedback submitted successfully",
      feedback: work.feedback,
    });
  } catch (error) {
    console.error("Error in clientFeedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};



