
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
      console.log('🔥 Error in updateSupervisorList:', err);
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
      .populate('assignedBy', 'name email')
      .populate('materialRequests.supervisor', 'name email');

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

      
      work.materialRequests[requestIndex].approved = true;
      work.materialRequests[requestIndex].approvedAt = new Date();
    

      await work.save();

      res.json({ success: true, message: 'Material request approved.' });
    } catch (err) {
      console.error('Error approving material:', err);
      res.status(500).json({ error: 'Server error' });
    }
  };


  
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
exports.getAllMaterialRequests = async (req, res) => {
  try {
    const works = await Work.find({ "materialRequests.0": { $exists: true } })
      .select("token_no materialRequests")
      .populate("materialRequests.supervisor", "name email");

    res.status(200).json(works);
  } catch (err) {
    console.error('❌ Error fetching material requests:', err);
    res.status(500).json({ error: 'Failed to fetch material requests' });
  }
};

  
// exports.downloadCSVAllWorks = async (req, res) => {
//   try {
//     const works = await Work.find({})
//       .populate('client_id', 'name')
//       .populate('materialRequests.supervisor', 'name');

//     if (!works.length) {
//       return res.status(404).send("No works found");
//     }

  
//     let csvContent = '\uFEFF';

    
//     csvContent += 'WORKS SUMMARY\n';
//     csvContent += '"Token No","Client Name","Approval Status","Status","Created At"\n';

   
//     works.forEach(work => {
//       const clientName = work.client_id?.name || '-';
//       const createdAt = work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-IN') : '-';

//       const workRow = [
//         `"${work.token_no}"`,
//         `"${clientName}"`,
//         `"${work.approvalStatus || '-'}"`,
//         `"${work.status || '-'}"`,
//         `"${createdAt}"`
//       ].join(',');

//       csvContent += workRow + '\n';
//     });

    
//     csvContent += '\n';

   
//     for (const work of works) {
//       csvContent += `"Material Requests for Token No: ${work.token_no}"\n`;
//       csvContent += `"Item","Quantity","Required Date","Supervisor","Requested At","Approved","Approved At"\n`;

//       if (work.materialRequests && work.materialRequests.length > 0) {
//         work.materialRequests.forEach(req => {
//           const item = req.item || '-';
//           const quantity = req.quantity != null ? req.quantity : '-';
//           const requiredDate = req.requiredDate ? new Date(req.requiredDate).toLocaleDateString('en-IN') : '-';
//           const supervisor = req.supervisor?.name || '-';
//           const requestedAt = req.requestedAt
//             ? new Date(req.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
//             : '-';
//           const approved = req.approved ? 'Yes' : 'No';
//           const approvedAt = req.approvedAt
//             ? new Date(req.approvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
//             : '-';

//           const row = [
//             `"${item}"`,
//             quantity,
//             `"${requiredDate}"`,
//             `"${supervisor}"`,
//             `"${requestedAt}"`,
//             `"${approved}"`,
//             `"${approvedAt}"`
//           ].join(',');

//           csvContent += row + '\n';
//         });
//       } else {
//         csvContent += '"No material requests"\n';
//       }

      
//       csvContent += '\n';
//     }

    
//     res.setHeader("Content-Type", "text/csv; charset=utf-8");
//     res.setHeader("Content-Disposition", `attachment; filename=AllWorks_MaterialRequests.csv`);

   
//     res.status(200).send(csvContent);

//   } catch (err) {
//     console.error("❌ Error downloading CSV:", err);
//     res.status(500).send("Internal Server Error");
//   }
// };
exports.downloadMaterialRequestsByToken = async (req, res) => {
  try {
    const token = req.params.token;

    const work = await Work.findOne({ token_no: token, "materialRequests.0": { $exists: true } })
      .populate("client_id", "name")
      .populate("materialRequests.supervisor", "name");

    if (!work) {
      return res.status(404).json({ error: "No material requests found for this token." });
    }

    const workbook = XLSX.utils.book_new();

    const sheetData = [
      [
        "Item",
        "Quantity",
        "Required Date",
        "Supervisor",
        "Requested At",
        "Approved",
        "Approved At",
      ],
    ];

    work.materialRequests.forEach(req => {
      sheetData.push([
        req.item || '-',
        req.quantity || '-',
        req.requiredDate
          ? new Date(req.requiredDate).toLocaleDateString('en-IN')
          : '-',
        req.supervisor?.name || '-',
        req.requestedAt
          ? new Date(req.requestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '-',
        req.approved ? 'Yes' : 'No',
        req.approvedAt
          ? new Date(req.approvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '-',
      ]);
    });

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName = work.token_no?.toString().substring(0, 31) || "MaterialRequests";
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=MaterialRequests_${token}.xlsx`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error("❌ Error generating Excel for token:", err);
    res.status(500).send("Failed to generate Excel file.");
  }
};

exports.downloadWorkSummaryCSV = async (req, res) => {
  try {
    const works = await Work.find({})
      .populate('client_id', 'name')
      .populate('supervisor', 'name')
      .populate('approvalBy', 'name')
      .populate('assignedBy', 'name');

    let csvContent = '\uFEFF'; 
    csvContent += 'Token No,Client Name,Approval Status,Status,Created At,Approved By,Supervisors,Assigned By,Started At,Completed At\n';

    works.forEach(work => {
      const row = [
        `"${work.token_no}"`,
        `"${work.client_id?.name || '-'}"`,
        `"${work.approvalStatus || '-'}"`,
        `"${work.status || '-'}"`,
        `"${work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-IN') : '-'}"`,
        `"${work.approvalBy?.name || '-'}"`,
        `"${work.supervisor?.map(s => s.name).join('; ') || '-'}"`,
        `"${work.assignedBy?.name || '-'}"`,
        `"${work.startedAt ? new Date(work.startedAt).toLocaleDateString('en-IN') : '-'}"`,
        `"${work.completedAt ? new Date(work.completedAt).toLocaleDateString('en-IN') : '-'}"`
      ].join(',');

      csvContent += row + '\n';
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=WorkSummary.csv`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error("❌ Error generating WorkSummary CSV:", err);
    res.status(500).send("Internal Server Error");
  }
};
exports.approveCompletedWork = async (req, res) => {
  try {
    const { workId, feedback, reason } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    if (!work.pendingCompletion) {
      return res.status(400).json({ error: 'No pending completion to approve' });
    }

    if (feedback === 'Reopen') {
      if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'Reason is required for reopening' });
      }

      work.status = 'Reopened';
      work.reopen = {
        isReopened: true,
        reason,
        reopenedAt: new Date()
      };

      work.pendingCompletion = false;
      work.completionApproved = false;

      await work.save();
      return res.json({ message: 'Work reopened by admin', work });

    } else if (feedback === 'Good' || !feedback) {
      work.status = 'Completed';
      work.completedAt = new Date();
      work.pendingCompletion = false;
      work.completionApproved = true;
      work.reopen = {
        isReopened: false,
        reason: '',
        reopenedAt: null
      };

      await work.save();
      return res.json({ message: 'Work marked as completed', work });

    } else {
      return res.status(400).json({ error: 'Invalid feedback value. Use Good or Reopen.' });
    }
  } catch (err) {
    console.error('❌ Error in approveCompletedWork:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.adminFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, reason } = req.body; 

    const work = await Work.findById(id);
    if (!work) return res.status(404).json({ message: 'Work not found' });

    if (feedback === 'Good') {
 
      work.status = 'Completed';
      work.reopen = { isReopened: false, reason: '', reopenedAt: null };
    } else if (feedback === 'Reopen') {
      if (!reason || reason.trim() === '') {
        return res.status(400).json({ message: 'Reason is required for reopening' });
      }

    
      work.status = 'In Progress';
      work.reopen = {
        isReopened: true,
        reason,
        reopenedAt: new Date()
      };
    } else {
      return res.status(400).json({ message: 'Invalid feedback option' });
    }

    if (!work.feedbackHistory) {
      work.feedbackHistory = [];
    }
    work.feedbackHistory.push({
      feedback,
      reason: reason || null,
      givenAt: new Date()
    });

    await work.save();
    res.json({ message: 'Feedback submitted successfully', work });

  } catch (error) {
    console.error('Admin feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


