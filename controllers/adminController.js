// controllers/adminController.js
const Work = require('../models/Work');
const User = require('../models/User');

exports.getPendingWorks = async (req, res) => {
  try {
    const works = await Work.find({ approvalStatus: 'Pending' }).populate('client_id', 'name email');
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
    work.approvalBy = req.user._id; // ✅ Fix this line

    await work.save();

    res.json({ message: 'Work approved by admin', work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignSupervisor = async (req, res) => {
  

  try {
    
    const { workId, supervisorId } = req.body;

    if (!workId || !supervisorId) {
      return res.status(400).json({ error: 'workId and supervisorId are required' });
    }

    const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' });
    if (!supervisor) {
      return res.status(400).json({ error: 'Supervisor not found or invalid role' });
    }

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ error: 'Work not found' });
    }

    if (work.approvalStatus !== 'Approved') {
      return res.status(400).json({ error: 'Work must be approved before assigning a supervisor' });
    }

    work.assigned_to = supervisorId;
     work.assignedBy = req.user._id;
      console.log("➡️ User in req:", req.user);
  work.status = 'Assigned';
    work.status = 'Assigned';

    await work.save();
     await work.populate('assigned_to', 'name email');
     console.log(work.assigned_to)
    res.json({ message: 'Supervisor assigned successfully', work });
  } catch (err) {
    console.error('Assign supervisor error:', err);
    res.status(500).json({ error: err.message });
  }
  
};

exports.getAllWorks = async (req, res) => {
  try {
    const works = await Work.find({})
      .sort({ createdAt: -1 })
      .populate('client_id', 'name email')
      .populate('assigned_to', 'name email')
      .populate('approvalBy', 'name email')
      .populate('assignedBy', 'name email');

    res.status(200).json(works);
  } catch (err) {
    console.error('❌ Error in getAllWorks:', err);
    res.status(500).json({ error: 'Failed to fetch work requests' });
  }
};




exports.approveMaterialRequest = async (req, res) => {
  try {
    const { workId } = req.body;
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    work.materialApproved = true; 
    await work.save();

    res.json({ message: 'Material request approved', work });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// accountController.js
// exports.generateBillByToken = async (req, res) => {
//   const { tokenNo } = req.params;

//   try {
//     const work = await Work.findOne({ token_no: tokenNo })
//       .populate('client_id')
//       .populate('assigned_to');

//     if (!work) return res.status(404).json({ error: 'Work not found' });

//     // ✅ Use PDFKit or any method to generate bill
//     const PDFDocument = require('pdfkit');
//     const doc = new PDFDocument();

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=bill-${tokenNo}.pdf`);

//     doc.pipe(res);
//     doc.fontSize(20).text(`Work Bill: ${tokenNo}`);
//     doc.moveDown();
//     doc.fontSize(14).text(`Client: ${work.client_id.name} (${work.client_id.email})`);
//     doc.text(`Description: ${work.description}`);
//     doc.text(`Assigned To: ${work.assigned_to?.name || '—'}`);
//     doc.text(`Status: ${work.status}`);
//     // ... add more details if needed
//     doc.end();

//   } catch (err) {
//     console.error('❌ Error generating bill by token:', err);
//     res.status(500).json({ error: 'Failed to generate bill PDF' });
//   }
// };

