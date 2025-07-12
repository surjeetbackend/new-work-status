const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Work = require('../models/Work');
const fs = require('fs');
const path = require('path');

console.log('fixed');
router.get('/generate-bill/token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const work = await Work.findOne({ token_no: token }).populate('client_id');
    if (!work) return res.status(404).json({ message: 'Work not found' });

    const doc = new PDFDocument();
    const filename = `Bill-${work.token_no}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    //  Title
    doc.fontSize(20).text('Construction Work Bill', { align: 'center' }).moveDown();

    //  Basic Info
    doc.fontSize(12)
      .text(`Client: ${work.client_id?.name || 'N/A'}`)
      .text(`Token No: ${work.token_no}`)
      .text(`Work Type: ${work.work_type || 'N/A'}`)
      .text(`Location: ${work.location || 'N/A'}`)
      .moveDown();

    //  Bill Image
    if (work.account?.bills?.length > 0) {
      const fileUrl = work.account.bills[0];
      const filePath = path.join(__dirname, '..', 'public', ...fileUrl.split('/').filter(Boolean));

      if (fs.existsSync(filePath)) {
        doc.image(filePath, { fit: [400, 200], align: 'center' }).moveDown();
      } else {
        doc.text('⚠️ Bill image not found.');
      }
    }

    // Expenses
    doc.fontSize(14).text('Expenses:', { underline: true }).moveDown(0.5);

    let total = 0;
    if (work.account?.expenses?.length > 0) {
      work.account.expenses.forEach((exp, i) => {
        doc.text(`${i + 1}. ${exp.description} - ₹${exp.amount}`);
        total += Number(exp.amount);
      });
    } else {
      doc.text('No expenses submitted.');
    }

    doc.moveDown().fontSize(14).text(`Total: ₹${total}`, { bold: true });

    doc.end();

    //  Mark bill generated
    work.billGenerated = true;
    await work.save();

  } catch (err) {
    console.error('❌ PDF generation error:', err.message);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});


// ✅ Get all account-filled works
router.get('/account-filled-works', async (req, res) => {
  try {
    const filledWorks = await Work.find({ 'account.filled': true });
    res.json(filledWorks);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
