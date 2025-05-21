let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minuten

export async function handler(event, context) {
  const now = Date.now();

  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return {
      statusCode: 200,
      body: JSON.stringify({ record: cachedData }),
      headers: { 'Cache-Control': 'public, max-age=60' }
    };
  }

  const BIN_ID = "682df6948a456b7966a2d92e";
  const ACCESS_KEY = "$2a$10$PqXzhtRUMzLMBE8zC5HmOuDWaX07Sep44ldTN.r7uerSNnFk8EH7G";

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Access-Key': ACCESS_KEY,
        'Content-Type': 'application/json'
      }
    });

    const json = await res.json();
    cachedData = json.record; // ✅ nur den Datenteil cachen
    lastFetchTime = now;

    return {
      statusCode: 200,
      body: JSON.stringify({ record: cachedData }),
      headers: { 'Cache-Control': 'public, max-age=60' }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fetch failed', details: err.toString() })
    };
  }
}
