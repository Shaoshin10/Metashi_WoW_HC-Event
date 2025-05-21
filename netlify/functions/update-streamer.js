// Neue Version von update-streamer.js für JSONBin.io
// Du brauchst: deine BIN_ID und deinen API_KEY von jsonbin.io

const BIN_ID = "682df6948a456b7966a2d92e"; // Deine Bin-ID
const API_KEY = "$2a$10$PqXzhtRUMzLMBE8zC5HmOuDWaX07Sep44ldTN.r7uerSNnFk8EH7G"; // API-Key von JSONBin

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const newEntry = JSON.parse(event.body);

    // Bestehende Daten abrufen
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!getRes.ok) throw new Error("Fehler beim Laden der bestehenden Daten");

    const currentData = (await getRes.json()).record;

    // Streamer suchen oder anhängen
    const updatedData = [...currentData];
    const existing = updatedData.find(s => s.twitchName === newEntry.twitchName);

    if (existing) {
      existing.clips = newEntry.clips;
    } else {
      updatedData.push(newEntry);
    }

    // Daten zurück speichern
    const updateRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'X-Master-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    if (!updateRes.ok) throw new Error("Fehler beim Speichern der Daten");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Erfolgreich gespeichert" })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fehler beim Schreiben', details: error.message })
    };
  }
};
