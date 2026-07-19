const { google } = require("googleapis");
const path = require("path");

// Load service account credentials
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../credentials.json"), // adjust if needed
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// Replace with your actual values
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME;

/**
 * Append a new lead row to Google Sheets
 */
async function appendLeadToSheet({ name, phone, message, timestamp }) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:D`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, phone, message, timestamp]],
      },
    });

    console.log("✅ Lead appended to Google Sheet");
  } catch (error) {
    console.error("❌ Error appending to Google Sheet:", error.message);
    throw error;
  }
}

module.exports = {
  appendLeadToSheet,
};
