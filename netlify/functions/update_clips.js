// /netlify/functions/update_clips.js

const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Shaoshin10';
const REPO_NAME = 'Metashi_WoW_HC-Event';
const CONFIG_PATH = 'data/streamer_config.json';
const DATA_PATH = 'data/streamer_data.json';

// GitHub API
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

async function getFile(path) {
  const data = await githubRequest(path);
  return {
    sha: data.sha,
    content: JSON.parse(Buffer.from(data.content, 'base64').toString())
  };
}

async function updateFile(path, newContent, sha, message) {
  const contentBase64 = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');
  return githubRequest(path, 'PUT', {
    message,
    content: contentBase64,
    sha
  });
}

exports.handler = async () => {
  try {
    const { content: config } = await getFile(CONFIG_PATH);
    const { sha } = await getFile(DATA_PATH); // wir brauchen nur das SHA zum Überschreiben

    // streamer_data komplett neu aufbauen
    const rebuiltData = config.map(entry => ({
      twitchName: entry.twitchName,
      clips: entry.clips,
      deaths: entry.clips.filter(c => c && c.trim() !== '').length,
      displayName: entry.displayName || entry.twitchName,
      profileImageUrl: entry.profileImageUrl || '',
      twitchUrl: `https://www.twitch.tv/${entry.twitchName}`,
      isLive: false
    }));

    await updateFile(DATA_PATH, rebuiltData, sha, '🔁 Komplett neu generierte streamer_data.json');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '✅ streamer_data.json vollständig neu erstellt.' })
    };
  } catch (err) {
    console.error('❌ Fehler beim Neuaufbau:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
