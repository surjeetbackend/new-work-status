// controllers/adminController.js
const Work = require('../models/Work');
const User = require('../models/User');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { format } = require('fast-csv');



exports.getPendingWorks = async (req, res) => {
  try {
    const works = await Work.find({ approvalStatus: 'open' }).populate('client_id', 'name email');
    res.json(works);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role: 'supervisor' }, 'name');
    res.json(supervisors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveWork = async (req, res) => {
  try {
    const { workId } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    work.approvalStatus = 'Approved';
    work.status = 'Approved';
    work.approvalBy = req.user._id;

    await work.save();
    res.json({ message: 'Work approved by admin', work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rejectWork = async (req, res) => {
  try {
    const { workId } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    work.approvalStatus = 'Rejected';
    work.status = 'Rejected';
    work.approvalBy = req.user._id;

    await work.save();
    res.json({ message: 'Work rejected by admin', work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// exports.assignSupervisor = async (req, res) => {
//   try {
//     const { workId, supervisorIds } = req.body;

//     if (!workId || !Array.isArray(supervisorIds)) {
//       return res.status(400).json({ error: 'workId and supervisorIds[] are required' });
//     }

//     const work = await Work.findById(workId);
//     if (!work) return res.status(404).json({ error: 'Work not found' });

//     if (work.approvalStatus !== 'Approved') {
//       return res.status(400).json({ error: 'Work must be approved first' });
//     }

//     const currentSupervisors = work.supervisor.map(id => id.toString());
//     const newOnes = supervisorIds.filter(id => !currentSupervisors.includes(id));

//     newOnes.forEach(id => {
//       work.supervisor.push(id);
//       work.history.push({ supervisor: id, assignedOn: new Date() });
//     });

//     work.assignedBy = req.user._id;
//     work.status = 'Assigned';
//     await work.save();

//     res.json({ message: 'Supervisors assigned', work });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.assignSupervisor = async (req, res) => {
  try {
    const { workId, supervisorIds } = req.body;

    if (!workId || !Array.isArray(supervisorIds)) {
      return res.status(400).json({ error: 'workId and supervisorIds[] are required' });
    }

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    if (work.approvalStatus !== 'Approved') {
      return res.status(400).json({ error: 'Work must be approved first' });
    }

    const currentSupervisors = work.supervisor.map(id => id.toString());
    const newSupervisors = supervisorIds.filter(id => !currentSupervisors.includes(id));

    newSupervisors.forEach(id => {
      work.supervisor.push(id);
      work.history.push({
        supervisor: id,
        assignedOn: new Date(),
        unassignedOn: null,
      });
    });

    work.status = 'Assigned';
    work.assignedBy = req.user._id;
    await work.save();

    res.json({ message: 'Supervisors assigned', work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// exports.unassignSupervisor = async (req, res) => {
//   try {
//     const { workId, supervisorId } = req.body;

//     const work = await Work.findById(workId);
//     if (!work) return res.status(404).json({ error: 'Work not found' });

//     if (!work.supervisor.includes(supervisorId)) {
//       return res.status(400).json({ error: 'Supervisor not assigned to this work' });
//     }

//     work.supervisor = work.supervisor.filter(id => id.toString() !== supervisorId);

//     const historyEntry = [...work.history].reverse().find(
//       entry => entry.supervisor.toString() === supervisorId && !entry.unassignedOn
//     );
//     if (historyEntry) historyEntry.unassignedOn = new Date();

//     await work.save();
//     res.json({ message: 'Supervisor unassigned', work });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.unassignSupervisor = async (req, res) => {
  try {
    const { workId, supervisorId } = req.body;

    if (!workId || !supervisorId) {
        console.error('❌ Missing fields:', { workId, supervisorId });
      return res.status(400).json({ error: 'workId and supervisorId are required' });
    }

    const work = await Work.findById(workId);
      console.error('❌ Work not found:', workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    //
    const supId = new mongoose.Types.ObjectId(supervisorId);

    work.supervisor = work.supervisor.filter(
      id => !id.equals(supId)
    );

    const lastEntry = [...work.history].reverse().find(
      h => h.supervisor.equals(supId) && !h.unassignedOn
    );

    if (lastEntry) {
      lastEntry.unassignedOn = new Date();
    }

    await work.save();
    res.json({ message: 'Supervisor unassigned successfully', work });
  } catch (err) {
    console.error('❌ Error in unassignSupervisor:', err);
    res.status(500).json({ error: err.message });
  }
};
exports.updateSupervisorList = async (req, res) => {
  try {
    const { workId, supervisorIds } = req.body;
    // console.log('Payload:', { workId, supervisorIds });

    if (!workId || !Array.isArray(supervisorIds)) {
      return res.status(400).json({ error: 'workId and supervisorIds[] are required' });
    }

    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

 
    const oldSupervisorSet = new Set(work.supervisor.map(id => id.toString()));
    const newSupervisorSet = new Set(supervisorIds);

    work.supervisor.forEach(id => {
      if (!newSupervisorSet.has(id.toString())) {
        work.history.push({
          supervisor: id,
          unassignedOn: new Date(),
        });
      }
    });

   
    supervisorIds.forEach(id => {
      if (!oldSupervisorSet.has(id.toString())) {
        work.history.push({
          supervisor: id,
          assignedOn: new Date(),
        });
      }
    });

    work.supervisor = supervisorIds;
    work.assignedBy = req.user._id;
    work.assignedAt = new Date();

    await work.save();

    res.json({ message: 'Supervisor list updated', work });
  } catch (err) {
    console.log('🔥 Error in updateSupervisorList:', err); // ✅ Fixed here
    res.status(500).json({ error: err.message });
  }
};


exports.getAllWorks = async (req, res) => {
  try {
    const works = await Work.find({})
      .sort({ createdAt: -1 })
      .populate('client_id', 'name email')
      .populate('supervisor', 'name email')
      .populate('approvalBy', 'name email')
      .populate('assignedBy', 'name email');

    res.status(200).json(works);
  } catch (err) {
    console.error('❌ Error in getAllWorks:', err);
    res.status(500).json({ error: 'Failed to fetch work requests' });
  }
};



exports.approveMaterial = async (req, res) => {
  try {
    const { workId, requestIndex } = req.body;

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    if (!work.materialRequests || !work.materialRequests[requestIndex]) {
      return res.status(400).json({ error: 'Invalid request index' });
    }

    // Approve the material request
    work.materialRequests[requestIndex].approved = true;
    work.materialRequests[requestIndex].approvedAt = new Date();
  

    await work.save();

    res.json({ success: true, message: 'Material request approved.' });
  } catch (err) {
    console.error('Error approving material:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Helper to extract sheet ID
function extractSheetId(sheetUrl) {
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};


exports.updateWorkStatus = async (req, res) => {
  try {
    const { workId, newStatus } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    if (newStatus === 'In Progress' && !work.startedAt) {
      work.startedAt = new Date();
    }
    if (newStatus === 'Completed' && !work.completedAt) {
      work.completedAt = new Date();
    }

    work.status = newStatus;
    await work.save();

    res.json({ message: 'Status updated', work });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.downloadCSVByToken = async (req, res) => {
  const tokenNo = req.params.tokenNo;

  try {
    const work = await Work.findOne({ token_no: tokenNo }).populate("materialRequests.supervisor", "name");
    if (!work) return res.status(404).send("Work not found");

    let csvContent = "Item,Quantity,Required Date,Supervisor,Requested At\n";

    work.materialRequests.forEach((req) => {
      const row = [
        `"${req.item || '-'}"`,
        `${req.quantity || '-'}`,
        `${req.requiredDate ? new Date(req.requiredDate).toLocaleDateString('en-IN') : '-'}`,
        `"${req.supervisor?.name || '-'}"`,
        `${req.requestedAt ? new Date(req.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-'}`,
      ].join(',');
      csvContent += row + '\n';
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=Material-${tokenNo}.csv`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error("❌ Error downloading CSV:", err);
    res.status(500).send("Internal Server Error");
  }
};
