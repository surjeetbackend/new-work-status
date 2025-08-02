const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const Work = require('../models/Work');

// Import all admin controller functions
const {
  approveWork,
  getPendingWorks,
  assignSupervisor,
  approveMaterial,
  getSupervisors,
  unassignSupervisor,
  updateSupervisorList,
  getAllWorks,
  getAllMaterialRequests,
  downloadMaterialRequestsCSV,
  downloadWorkSummaryCSV,
} = require('../controllers/adminController');

// Admin-only routes
router.get('/supervisors', verifyToken, authorizeRoles('admin'), getSupervisors);
router.get('/pending-works', verifyToken, authorizeRoles('admin'), getPendingWorks);
router.post('/approve-work', verifyToken, authorizeRoles('admin'), approveWork);
router.post('/assign-supervisors', verifyToken, authorizeRoles('admin'), assignSupervisor);
router.post('/unassign-supervisor', verifyToken, authorizeRoles('admin'), unassignSupervisor);
router.post('/update-supervisors', verifyToken, authorizeRoles('admin'), updateSupervisorList);
router.post('/approve-material', verifyToken, authorizeRoles('admin'), approveMaterial);
router.get('/all-works', verifyToken, authorizeRoles('admin'), getAllWorks);
router.get('/material-requests', verifyToken, authorizeRoles('admin'), getAllMaterialRequests);
// router.get('/download/material-requests', verifyToken, authorizeRoles('admin'), downloadMaterialRequestsCSV);
router.get('/download/work-summary', verifyToken, authorizeRoles('admin'), downloadWorkSummaryCSV);

// Supervisor-only route (token-based work lookup)
router.get('/work-by-token/:token', verifyToken, authorizeRoles('supervisor'), async (req, res) => {
  try {
    const work = await Work.findOne({ token_no: req.params.token }).populate('client_id', 'name email');
    if (!work) return res.status(404).json({ error: 'Work not found' });
    res.json(work);
  } catch (err) {
    console.error('❌ Error fetching work by token:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
