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
  getReopenedWorks
} = require('../controllers/supervisorController');
const Work = require('../models/Work'); 


router.get(
  '/approved-works',
  verifyToken,
  authorizeRoles('supervisor'),
  getApprovedWorks
);


router.post(
  '/start-work',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.single('startPhoto'),
  startWork
);

router.post(
  '/complete-work',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.fields([
    { name: 'completionPhotos', maxCount: 4 } 
  ]),
  completeWork
);


router.post(
  '/material-request',
  verifyToken,
  authorizeRoles('supervisor'),
  requestMaterial
);

router.post(
  '/submit-account/:token_no',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.array('bills', 5),
  submitAccountDetails
);


router.post(
  '/account-entry',
  verifyToken,
  authorizeRoles('supervisor'),
  upload.single('billPhoto'),
  accountEntryHandler
);


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
      console.error(' Error fetching work by token:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
// Admin action (after supervisor completion)
router.post("/work/:id/admin-action", async (req, res) => {
  const { status } = req.body;
  const work = await Work.findById(req.params.id);

  if (!work) return res.status(404).json({ msg: "Work not found" });

  if (status === "good") {
    work.reopen = { status: "closed", by: "admin" };
    work.status = "completed";
  
  } else if (status === "reopen") {
    work.reopen = { status: "reopened", by: "admin" };
    work.status = "in-progress"; 

  }

  await work.save();
  res.json(work);
});


router.post("/work/:id/client-action", async (req, res) => {
  const { status } = req.body;
  const work = await Work.findById(req.params.id);

  if (!work) return res.status(404).json({ msg: "Work not found" });

  if (status === "good") {
    work.reopen = { status: "closed", by: "client" };

  } else if (status === "reopen") {
    work.reopen = { status: "reopened", by: "client" };
    work.status = "in-progress";
    
  }

  await work.save();
  res.json(work);
});
// Supervisor Rework (jab client/admin reopen kare to supervisor start kare)
router.post("/work/:id/supervisor-rework", verifyToken, authorizeRoles("supervisor"), async (req, res) => {
  try {
    const work = await Work.findById(req.params.id);
    if (!work) return res.status(404).json({ msg: "Work not found" });

    // Sirf reopen wali work pe hi action ho
    if (!work.reopen || work.reopen.status !== "reopened") {
      return res.status(400).json({ msg: "This work is not reopened" });
    }

    // Supervisor ne rework start kiya
    work.status = "in-progress"; // ya "under-rework"
    work.reopen = {
      status: "in-progress",
      by: "supervisor",
      startedAt: new Date()
    };

    await work.save();
    res.json({ msg: "Supervisor started rework", work });

  } catch (err) {
    console.error("❌ Supervisor rework error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});


router.get("/reopened/supervisor", verifyToken, authorizeRoles("supervisor"), getReopenedWorks);
module.exports = router;
