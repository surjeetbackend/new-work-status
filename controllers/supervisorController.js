const Work = require('../models/Work');
const fs = require('fs');
const path = require('path');

// ✅ Get approved works assigned to the current supervisor

exports.getApprovedWorks = async (req, res) => {
  try {
    const allWorks = await Work.find({
      approvalStatus: 'Approved'
    })
      .populate('client_id', 'name email')
      .populate('history.supervisor', 'name email')
       .populate('approvalBy', 'name')
      .populate('assignedBy', 'name')
            .populate('assigned_to', 'name');
   
   
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
    const { estimatedTime, laborRequired, workId } = req.body;

    if (!workId || !estimatedTime || !laborRequired) {
      return res.status(400).json({ error: 'All fields are required' });
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

    work.estimatedTime = estimatedTime;
    work.laborRequired = laborRequired;
    work.status = 'In Progress';

    await work.save();
    res.status(200).json({ message: 'Work started successfully', work });
  } catch (err) {
    console.error('❌ startWork error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
  console.log(work.startPhoto);

};

// ✅ Complete Work
exports.completeWork = async (req, res) => {
  try {
    const { workId } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const isAssigned = work.history.some(h =>
      h.supervisor?.toString() === req.user._id.toString() && !h.unassignedOn
    );
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to complete this work' });
    }

    if (work.status !== 'In Progress') {
      return res.status(400).json({ error: 'Work must be In Progress to complete' });
    }

    if (req.file) {
      const completionPhotoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      work.completionPhoto = completionPhotoUrl;
    }

    work.status = 'Completed';
    await work.save();

    res.json({ message: 'Work marked as completed', work });
  } catch (err) {
    console.error('❌ completeWork error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Material Request
exports.requestMaterial = async (req, res) => {
  try {
    const { workId, materialRequest } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const isAssigned = work.history.some(h =>
      h.supervisor?.toString() === req.user._id.toString() && !h.unassignedOn
    );
    if (!isAssigned) {
      return res.status(403).json({ error: 'Not authorized to request material' });
    }

    work.materialRequest = materialRequest;
    await work.save();

    res.json({ message: 'Material request submitted', work });
  } catch (err) {
    console.error('❌ requestMaterial error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Account Entry (single bill photo + expenses)
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

// ✅ Submit account section (multiple bills upload)
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
