const Work = require('../models/Work');
const fs = require('fs');
const path = require('path');
const { appendMaterialRequest } = require('../utils/googleSheets');
const { logMaterialRequestToSheet } = require('../utils/googleSheets');

exports.requestMaterial = async (req, res) => {
  const { workId, materialRequests } = req.body;
  const supervisorId = req.user._id;

  if (!Array.isArray(materialRequests) || materialRequests.length === 0) {
    return res.status(400).json({ error: 'No material requests provided' });
  }

  try {
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const timestamp = new Date();

    for (const item of materialRequests) {
      if (!item.item || !item.quantity || !item.requiredDate) {
        return res.status(400).json({ error: 'Each material request must have item, quantity, and requiredDate' });
      }
      work.materialRequests.push({
        item: item.item,
        quantity: item.quantity,
        requiredDate: item.requiredDate,
        requestedAt: timestamp,
        supervisor: supervisorId,
        approved: false,
      });
    }

    await work.save();

    res.json({ message: 'Material requests submitted', work });
  } catch (err) {
    console.error('❌ Material request error:', err);
    res.status(500).json({ error: 'Request failed', details: err.message });
  }
};




exports.getApprovedWorks = async (req, res) => {
  try {
    const allWorks = await Work.find({
      approvalStatus: 'Approved'
    })
      .populate('client_id', 'name email')
      .populate('history.supervisor', 'name email')
       .populate('approvalBy', 'name')
      .populate('assignedBy', 'name')
            .populate('assigned_to', 'name').select('+sheetLink');
   
   
    const filtered = allWorks.filter(work =>
      work.history.some(h =>
        h.supervisor &&
        h.assignedOn &&
        !h.unassignedOn &&
        (
          (h.supervisor._id && h.supervisor._id.equals(req.user._id)) ||
          (h.supervisor.equals && h.supervisor.equals(req.user._id))
        )
      )
    );

    console.log('✅ Final filtered works for supervisor:', filtered.map(w => w.token_no));
    res.json(filtered);
  } catch (err) {
    console.error('❌ Error in getApprovedWorks:', err);
    res.status(500).json({ error: 'Failed to fetch works' });
  }
};


exports.startWork = async (req, res) => {
  try {
    const { comment, workId } = req.body;

    if (!workId || !comment) {
      return res.status(400).json({ error: 'Work ID and comment are required' });
    }

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const isAssigned = work.history.some(h =>
      h.supervisor?.toString() === req.user._id.toString() && !h.unassignedOn
    );
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to start this work' });
    }

    if (req.file) {
      const startPhotoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      work.startPhoto = startPhotoUrl;
    }

    work.startComment = comment; 
    work.status = 'In Progress';

    await work.save();
    res.status(200).json({ message: 'Work started successfully', work });
  } catch (err) {
    console.error('❌ startWork error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.completeWork = async (req, res) => {
  try {
    const { workId } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const isAssigned = work.history.some(
      h => h.supervisor?.toString() === req.user._id.toString() && !h.unassignedOn
    );
    if (!isAssigned) return res.status(403).json({ error: 'Unauthorized' });

    if (work.status !== 'In Progress') {
      return res.status(400).json({ error: 'Work must be In Progress' });
    }

   
    if (req.files && req.files['completionPhotos']) {
      work.completionPhotos = work.completionPhotos || [];

      req.files['completionPhotos'].forEach(file => {
        const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        work.completionPhotos.push({ url, uploadedAt: new Date() });
      });
    }

  
    work.pendingCompletion = true;
    work.completionRequestedAt = new Date();

    await work.save();
    res.json({ message: 'Submitted for admin approval', work });
  } catch (err) {
    console.error('completeWork error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.accountEntryHandler = async (req, res) => {
  try {
    const { workId, expenses } = req.body;
    const billPhoto = req.file?.path;

    if (!workId || !expenses || !billPhoto) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const fileUrl = billPhoto.replace('public/', '');

    work.account = {
      filled: true,
      bills: [fileUrl],
      expenses: JSON.parse(expenses),
    };

    await work.save();

    res.json({ message: 'Account details saved successfully' });
  } catch (err) {
    console.error('❌ Account entry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.submitAccountDetails = async (req, res) => {
  try {
    const { workId, expenses } = req.body;

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const billUrls = req.files?.map(file => `public/uploads/bills/${file.filename}`) || [];

    work.account = {
      bills: [...(work.account?.bills || []), ...billUrls],
      expenses: [...(work.account?.expenses || []), ...JSON.parse(expenses)],
    };

    await work.save();
    res.json({ message: 'Account details saved', account: work.account });
  } catch (err) {
    console.error('❌ Account details error:', err);
    res.status(500).json({ error: 'Failed to save account details' });
  }
};

exports.getReopenedWorks = async (req, res) => {
  try {
    const works = await Work.find({ 
      "reopen.isReopened": true, 
      status: "Reopened" 
    })
    .populate("client_id", "name email")
    .populate("assigned_to", "name");

    res.json(works);
  } catch (err) {
    console.error("Error fetching reopened works:", err);
    res.status(500).json({ message: "Server error" });
  }
};
