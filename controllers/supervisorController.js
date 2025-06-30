const Work = require('../models/Work');
const User = require('../models/User');

const fs = require('fs');
const path = require('path');


exports.getApprovedWorks = async (req, res) => {
  try {
    const works = await Work.find({
      $or: [
        { status: 'Assigned' },
        { status: 'In Progress' },
        { status: 'Completed', 'account.filled': false }
      ]
    })
      .populate('client_id', 'name email')
      .populate('approvalBy', 'name email')
      .populate('assignedBy', 'name email');

    res.json(works);
  } catch (err) {
    console.error('Error fetching approved works:', err);
    res.status(500).json({ error: 'Failed to fetch works' });
  }
};



// ✅ 2. Start work with estimatedTime, laborRequired, startPhoto
exports.startWork = async (req, res) => {
  try {
    const { estimatedTime, laborRequired } = req.body;
    const workId = req.body.workId;

    if (!workId || !estimatedTime || !laborRequired) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    // ✅ Fixed: Use full URL
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
};



// ✅ 3. Complete work with photo
exports.completeWork = async (req, res) => {
  try {
    const { workId } = req.body;
    const work = await Work.findById(workId);

    if (!work) return res.status(404).json({ error: 'Work not found' });
    if (String(work.assigned_to) !== String(req.user._id))
      return res.status(403).json({ error: 'Not authorized' });

    if (work.status !== 'In Progress')
      return res.status(400).json({ error: 'Work must be In Progress to complete' });

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



// ✅ 4. Material request
exports.requestMaterial = async (req, res) => {
  try {
    const { workId, materialRequest } = req.body;
    const work = await Work.findById(workId);

    if (!work) return res.status(404).json({ error: 'Work not found' });
    if (String(work.assigned_to) !== String(req.user._id)) return res.status(403).json({ error: 'Not authorized' });

    work.materialRequest = materialRequest;
    await work.save();

    res.json({ message: 'Material request submitted', work });
  } catch (err) {
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
      expenses: [...(work.account?.expenses || []), ...JSON.parse(expenses)]
    };

    await work.save();
    res.json({ message: 'Account details saved', account: work.account });
  } catch (err) {
    console.error('Account details error:', err);
    res.status(500).json({ error: 'Failed to save account details' });
  }
};
