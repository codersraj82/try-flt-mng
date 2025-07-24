export async function handler(event, context) {
  try {
    // Your logic here
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Function running fine" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
