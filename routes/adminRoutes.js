const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/User'); 
const Work = require('../models/Work');

const {
  approveWork,
  getPendingWorks,
  assignSupervisor,
  approveMaterialRequest,
  getSupervisors,
  unassignSupervisor,
  updateSupervisorList,
  getAllWorks
} = require('../controllers/adminController');
router.get('/supervisors', verifyToken, authorizeRoles('admin'), getSupervisors);
router.get('/pending-works', verifyToken, authorizeRoles('admin'), getPendingWorks);
router.post('/approve-work', verifyToken, authorizeRoles('admin'), approveWork);
router.post('/assign-supervisors', verifyToken, authorizeRoles('admin'), assignSupervisor);
router.post('/unassign-supervisor', verifyToken, authorizeRoles('admin'), unassignSupervisor);
router.post('/update-supervisors', verifyToken, authorizeRoles('admin'), updateSupervisorList);
router.post('/approve-material', verifyToken, authorizeRoles('admin'), approveMaterialRequest);
router.get('/all-works', verifyToken, authorizeRoles('admin'), getAllWorks);

router.get(
  '/work-by-token/:token',
  verifyToken,
  authorizeRoles('supervisors'),
  async (req, res) => {
    try {
      const work = await Work.findOne({ token_no: req.params.token })
        .populate('client_id', 'name email');

      if (!work) {
        return res.status(404).json({ error: 'Work not found' });
      }

      res.json(work);
    } catch (err) {
      console.error('❌ Error fetching work by token:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
