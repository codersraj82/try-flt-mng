const fetch = require("node-fetch");

export async function handler(event, context) {
  const baseUrl = process.env.SHEET_WEBAPP_URL;
  const type = event.queryStringParameters?.type || "faults";

  if (event.httpMethod === "GET") {
    // === GET: Fetch existing data ===
    let url = `${baseUrl}?sheet=${
      type === "routes" ? "Route_Details" : "dly_rpt"
    }`;

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

  if (event.httpMethod === "POST") {
    // === POST: Add new fault ===
    try {
      const body = JSON.parse(event.body);

      const response = await fetch(baseUrl, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.text(); // or .json() if your script returns JSON

      return {
        statusCode: 200,
        body: result,
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // Unsupported HTTP method
  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method Not Allowed" }),
  };
}
