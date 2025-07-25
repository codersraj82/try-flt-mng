export async function handler(event, context) {
  const url = process.env.SHEET_WEBAPP_URL;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data), // ✅ Must be array of faults
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
