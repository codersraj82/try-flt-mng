export async function handler(event, context) {
  const baseUrl = process.env.SHEET_WEBAPP_URL;
  const type = event.queryStringParameters?.type || "faults";

  // Append a query param to specify sheet tab, if your Apps Script endpoint supports it
  let url = `${baseUrl}?tab=${type === "routes" ? "Route_Details" : "dly_rpt"}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data), // Should be an array
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
