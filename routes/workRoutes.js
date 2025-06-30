// routes/workRoutes.js
const express = require('express');
const router = express.Router();
const { createWork } = require('../controllers/workController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const Work = require('../models/Work'); // ✅ Required for get route

// POST /api/work/submit
router.post('/submit', verifyToken, authorizeRoles('client'), createWork);

// GET /api/work/my-works
router.get('/my-works', verifyToken, authorizeRoles('client'), async (req, res) => {
  try {
    const works = await Work.find({ client_id: req.user._id }).sort({ createdAt: -1 });
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/my-works', verifyToken, authorizeRoles('client'), async (req, res) => {
  try {
    const works = await Work.find({ client_id: req.user._id })
      .populate('assigned_to', 'name') // only get supervisor name
      .populate('approved_by', 'name'); // if you track admin approval
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
