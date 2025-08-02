const express = require('express');
const router = express.Router();

const Work = require('../models/Work');
const fs = require('fs');
const path = require('path');

router.get('/generate-bill/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const work = await Work.findOne({ token_no: token })
      .populate('client_id approvalBy assignedBy history.supervisor').populate('client_id', 'name');

    if (!work) return res.status(404).json({ message: 'Work not found' });

    const doc = new PDFDocument();
    const filename = `Bill-${work.token_no}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(22).text(' Construction Work Bill', { align: 'center' }).moveDown(1);

    // Section: Work Info
    doc.fontSize(14).text(' Work Details', { underline: true }).moveDown(0.3);
    doc.fontSize(12)
      .text(`Token No      : ${work.token_no}`)
      .text(`Work Type     : ${work.work_type || 'N/A'}`)
      .text(`Location      : ${work.location || 'N/A'}`)
      .text(`Status        : ${work.status}`)
      .text(`Approval Status: ${work.approvalStatus}`)
      .moveDown();

    // Section: People Involved
    doc.fontSize(14).text(' Participants', { underline: true }).moveDown(0.3);
    doc.fontSize(12)
      .text(`Client         : ${work.client_id?.name || 'N/A'}`)
      .text(`Approved By    : ${work.approvalBy?.name || 'N/A'}`)
      .text(`Assigned By    : ${work.assignedBy?.name || 'N/A'}`);

    const activeSupervisors = work.history?.filter(h => !h.unassignedOn).map(h => h.supervisor?.name).filter(Boolean);
    doc.text(`Supervisor(s)  : ${activeSupervisors?.join(', ') || '-'}`).moveDown();

    // Section: Timing & Labor
    doc.fontSize(14).text(' Work Estimation', { underline: true }).moveDown(0.3);
    doc.fontSize(12)
      .text(`Estimated Time : ${work.estimatedTime || '-'} `)
      .text(`Labour Required: ${work.laborRequired || '-'}`)
      .text(`Material Req.  : ${work.materialRequest || '-'}`)
      .moveDown();

    // Section: Bill Photo
    // doc.fontSize(14).text(' Bill Image', { underline: true }).moveDown(0.5);
    // if (work.account?.bills?.length > 0) {
    //   const fileUrl = work.account.bills[0];
    //   const filePath = path.join(__dirname, '..', 'public', ...fileUrl.split('/').filter(Boolean));

    //   if (fs.existsSync(filePath)) {
    //     doc.image(filePath, { fit: [400, 200], align: 'center' }).moveDown();
    //   } else {
    //     doc.text(' Bill image not found').moveDown();
    //   }
    // } else {
    //   doc.text(' No bill image uploaded').moveDown();
    // }

    // Section: Expense
    doc.fontSize(14).text(' Expenses Breakdown', { underline: true }).moveDown(0.5);
    let total = 0;
    if (work.account?.expenses?.length > 0) {
      work.account.expenses.forEach((exp, i) => {
       doc.text(`${i + 1}. ${exp.description} - ${Number(exp.amount).toLocaleString('en-IN')}${'/-'}`);

        total += Number(exp.amount);
      });
    } else {
      doc.text('No expenses submitted.');
    }

    doc.moveDown()
      .fontSize(14)
      .fillColor('black')
      .text('------------------------------')
      .fontSize(16)
      .fillColor('green')
      .text(`Total Amount: ${total}${'/-'}`, { align: 'left' })
      .fillColor('black')
      .text('------------------------------')
      .moveDown();

    doc.fontSize(12).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();

    // Update bill generation status
    work.billGenerated = true;
    await work.save();

  } catch (err) {
    console.error(' PDF generation error:', err.message);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});


// ✅ Get all account-filled works
router.get('/account-filled-works', async (req, res) => {
  try {
    const filledWorks = await Work.find({ 'account.filled': true })
      .populate('client_id', 'name')
      .populate('approvalBy', 'name')
.populate('assignedBy', 'name')

    res.json(filledWorks);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
 
