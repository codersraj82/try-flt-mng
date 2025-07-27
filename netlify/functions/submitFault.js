// netlify/functions/submitFault.js
export async function handler(event) {
  try {
    const body = JSON.parse(event.body);

    const sheetUrl = process.env.SHEET_WEBAPP_URL;
    const res = await fetch(sheetUrl, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result: data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}
