import { google } from "googleapis";

export async function handler(event, context) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "dly_rpt", // Sheet name
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return {
        statusCode: 200,
        body: JSON.stringify({ faults: [] }),
      };
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row, index) => {
      const rowData = {};
      headers.forEach((header, i) => {
        rowData[header] = row[i] || "";
      });
      rowData._id = index + 2; // Row number (1-based + header)
      return rowData;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ faults: data }),
    };
  } catch (error) {
    console.error("Fetch Faults Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch faults." }),
    };
  }
}
