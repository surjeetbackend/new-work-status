const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
// In Mongo shell or Mongoose
const mongoose = require('mongoose');
const User = require('../models/User'); 



const {

     approveWork,
  getPendingWorks,
  assignSupervisor,
 approveMaterialRequest,
  getSupervisors,
  getAllWorks,
  // generateBillByToken 

} = require('../controllers/adminController');

router.get('/supervisors', verifyToken, authorizeRoles('admin'), getSupervisors);
router.get('/pending-works', verifyToken, authorizeRoles('admin'), getPendingWorks);
router.post('/approve-work', verifyToken, authorizeRoles('admin'), approveWork);
router.post('/assign-supervisor', verifyToken, authorizeRoles('admin'), assignSupervisor);
router.post('/approve-material', verifyToken, approveMaterialRequest);
router.get('/all-works', verifyToken, authorizeRoles('admin'), getAllWorks);
// router.get('/generate-bill/token/:tokenNo', verifyToken, generateBillByToken);
router.get(
  '/work-by-token/:token',
  verifyToken,
  authorizeRoles('supervisor'),
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
