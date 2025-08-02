// utils/sheetUtils.js
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

async function createSheetAndWriteToken(token_no) {
  const spreadsheet = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title: `Work Token - ${token_no}`,
      },
      sheets: [{
        properties: { title: 'Material Requests' },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: [
              { userEnteredValue: { stringValue: 'Token Number' } },
              { userEnteredValue: { stringValue: token_no } },
            ],
          }, {
            values: [
              { userEnteredValue: { stringValue: 'Material' } },
              { userEnteredValue: { stringValue: 'Quantity' } },
              { userEnteredValue: { stringValue: 'Requested By' } },
              { userEnteredValue: { stringValue: 'Requested At' } },
              { userEnteredValue: { stringValue: 'Approved' } },
              { userEnteredValue: { stringValue: 'Approved At' } },
            ],
          }],
        }],
      }],
    },
  });

  const sheetLink = spreadsheet.data.spreadsheetUrl;
  return sheetLink;
}

module.exports = {
  createSheetAndWriteToken,
};
