// routes/workRoutes.js
const express = require('express');
const router = express.Router();
const { createWork,clientFeedback } = require('../controllers/workController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const Work = require('../models/Work'); 


router.post('/submit', verifyToken, authorizeRoles('client'), createWork);


router.get('/my-works', verifyToken, authorizeRoles('client'), async (req, res) => {
  try {
    const works = await Work.find({ client_id: req.user._id })
      .populate('assigned_to', 'name email phone')
      .populate('approvalBy', 'name'); 
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/client-feedback/:id',verifyToken,authorizeRoles('client'),clientFeedback);

module.exports = router;
