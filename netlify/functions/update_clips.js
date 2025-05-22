// /netlify/functions/update_clips.js

const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Shaoshin10';
const REPO_NAME = 'Metashi_WoW_HC-Event';
const CONFIG_PATH = 'data/streamer_config.json';
const DATA_PATH = 'data/streamer_data.json';

// Helper: GitHub API request
async function githubRequest(path, method = 'GET', body = null) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API Fehler (${res.status}): ${text}`);
  }

  return await res.json();
}

// Get file content + SHA
async function getFile(path) {
  const data = await githubRequest(path);
  return {
    sha: data.sha,
    content: JSON.parse(Buffer.from(data.content, 'base64').toString())
  };
}

// Update file
async function updateFile(path, newContent, sha, message) {
  const encodedContent = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');
  await githubRequest(path, 'PUT', {
    message,
    content: encodedContent,
    sha
  });
}

exports.handler = async () => {
  try {
    // 1. streamer_config.json holen
    const { content: config } = await getFile(CONFIG_PATH);

    // 2. streamer_data.json holen
    const { content: data, sha } = await getFile(DATA_PATH);

    let updated = false;

    // 3. Clips aktualisieren
    const newData = data.map(entry => {
      const configEntry = config.find(c => c.twitchName === entry.twitchName);
      if (configEntry) {
        const newClips = configEntry.clips;
        const changed = JSON.stringify(entry.clips) !== JSON.stringify(newClips);
        if (changed) {
          updated = true;
          return {
            ...entry,
            clips: newClips,
            deaths: newClips.filter(c => c && c.trim() !== '').length
          };
        }
      }
      return entry;
    });

    if (!updated) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Keine Änderungen – kein Commit nötig.' })
      };
    }

    // 4. streamer_data.json aktualisieren
    await updateFile(DATA_PATH, newData, sha, '🔁 Update streamer_data.json mit neuen Clips');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '✅ streamer_data.json erfolgreich aktualisiert.' })
    };
  } catch (err) {
    console.error('❌ Fehler beim Update:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
