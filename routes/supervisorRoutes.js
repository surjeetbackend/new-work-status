const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); 

const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getApprovedWorks,
  startWork,
  completeWork,
  requestMaterial,
  accountEntryHandler,
  submitAccountDetails,
} = require('../controllers/supervisorController');
const Work = require('../models/Work'); // ✅ Missing import

// ✅ Get approved/assigned works for supervisor
router.get(
  '/approved-works',
  verifyToken,
  authorizeRoles('supervisor'),
  getApprovedWorks
);

// ✅ Start work (with start photo upload)
router.post(
  '/start-work',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.single('startPhoto'),
  startWork
);

// ✅ Complete work (with completion photo upload)
router.post(
  '/complete-work',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.single('completionPhoto'),
  completeWork
);

// ✅ Request material
router.post(
  '/material-request',
  verifyToken,
  authorizeRoles('supervisor'),
  requestMaterial
);

// ✅ Submit account section (bills + expenses)
router.post(
  '/submit-account/:token_no',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.array('bills', 5),
  submitAccountDetails
);

// ✅ Add single expense entry with photo
router.post(
  '/account-entry',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.single('billPhoto'),
  accountEntryHandler
);

// ✅ Get work by token (used in AccountPage)
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

// ✅ Final export
module.exports = router;
