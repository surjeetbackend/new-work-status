const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Work = require('../models/Work'); // adjust if path is different

exports.requestMaterial = async (req, res) => {
  const { workId, materialRequests } = req.body;
  const supervisorId = req.user?._id;
  const supervisorName = req.user?.name;

  if (!supervisorId) {
    return res.status(401).json({ error: 'Unauthorized: Supervisor ID missing' });
  }

  if (!workId) {
    return res.status(400).json({ error: 'Work ID is required' });
  }

  if (!Array.isArray(materialRequests) || materialRequests.length === 0) {
    return res.status(400).json({ error: 'No material requests provided' });
  }

  try {
    const work = await Work.findById(workId);
    if (!work) return res.status(404).json({ error: 'Work not found' });

    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    for (const item of materialRequests) {
      if (
        !item.item ||
        typeof item.item !== 'string' ||
        !item.quantity ||
        typeof item.quantity !== 'number' ||
        !item.requiredDate ||
        isNaN(new Date(item.requiredDate).getTime())
      ) {
        return res.status(400).json({
          error:
            'Each material request must have valid item (string), quantity (number), and requiredDate (valid date)',
        });
      }

      // Save to MongoDB
      work.materialRequests.push({
        item: item.item,
        quantity: item.quantity,
        requiredDate: new Date(item.requiredDate),
        requestedAt: timestamp,
        supervisor: supervisorId,
        approved: false,
      });

      // ✅ Append to Excel
      const excelDir = path.join(__dirname, '..', 'public', 'excel');
      if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

      const filePath = path.join(excelDir, `${work.token_no}.xlsx`);
      let worksheet, workbook;

      if (fs.existsSync(filePath)) {
        workbook = XLSX.readFile(filePath);
        worksheet = workbook.Sheets[workbook.SheetNames[0]];
      } else {
        workbook = XLSX.utils.book_new();
        worksheet = XLSX.utils.aoa_to_sheet([
          ['Token No', 'Supervisor', 'Item', 'Quantity', 'Required Date', 'Requested At', 'Approved', 'Approved At'],
        ]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
      }

      const newRow = [
        work.token_no,
        supervisorName || 'N/A',
        item.item,
        item.quantity,
        item.requiredDate,
        formattedDate,
        'Pending',
        '',
      ];

      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      sheetData.push(newRow);

      const newSheet = XLSX.utils.aoa_to_sheet(sheetData);
      workbook.Sheets[workbook.SheetNames[0]] = newSheet;

      XLSX.writeFile(workbook, filePath);
    }

    await work.save();
    res.json({ message: 'Material requests submitted', work });
  } catch (err) {
    console.error('❌ Material request error:', err);
    res.status(500).json({ error: 'Request failed', details: err.message });
  }
};


