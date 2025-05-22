const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Shaoshin10';
const REPO_NAME = 'Metashi_WoW_HC-Event';
const CONFIG_PATH = 'data/streamer_config.json';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const newEntry = JSON.parse(event.body);

    // Schritt 1: Alte config holen
    const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_PATH}`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    const fileData = await getRes.json();
    const sha = fileData.sha;
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

    // Schritt 2: Update oder Eintrag hinzufügen
    const existing = content.find(e => e.twitchName === newEntry.twitchName);
    if (existing) {
      existing.clips = newEntry.clips;
    } else {
      content.push(newEntry);
    }

    // Schritt 3: Neues File erzeugen (base64 codiert)
    const updatedBase64 = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // Schritt 4: Commit an GitHub senden
    const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CONFIG_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `📝 Update Clips für ${newEntry.twitchName}`,
        content: updatedBase64,
        sha
      })
    });

    if (!putRes.ok) throw new Error("Speichern fehlgeschlagen");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '✅ Konfiguration erfolgreich aktualisiert' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
