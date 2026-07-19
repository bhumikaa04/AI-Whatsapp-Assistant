// services/googleSheets.js
import { google } from 'googleapis';

class GoogleSheetsService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
  }

  async appendLead(lead) {
    const values = [[
      new Date().toISOString(),
      lead.phone,
      lead.name || '',
      lead.firstMessage || '',
      lead.status,
      lead.leadSource,
      lead.tags?.join(', ') || '',
      lead.lastActive.toISOString()
    ]];

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Leads!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });
  }

  async syncLeadsToSheet(leads) {
    const values = leads.map(lead => [
      lead.createdAt.toISOString(),
      lead.phone,
      lead.name || '',
      lead.firstMessage || '',
      lead.status,
      lead.leadSource,
      lead.tags?.join(', ') || '',
      lead.lastActive.toISOString()
    ]);

    // Clear existing data
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: 'Leads!A2:H'
    });

    // Append new data
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Leads!A2:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });
  }
}

export default new GoogleSheetsService();