
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Shaoshin10';
const REPO_NAME = 'Metashi_WoW_HC-Event';
const CONFIG_PATH = 'data/streamer_config.json';
const OUTPUT_PATH = 'data/streamer_data.json';

const clientId = 'ahbdg12dbfz1h536z4oixln6rw4cm5';
const accessToken = 'evivsdf11txng1f48e3zqumxflprgq';

// GitHub API helper
async function githubRequest(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API Fehler: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

// Get file content and SHA
async function getFile(path) {
  const data = await githubRequest(path);
  try {
    const parsedContent = JSON.parse(Buffer.from(data.content, 'base64').toString());
    return {
      sha: data.sha,
      content: parsedContent
    };
  } catch (e) {
    throw new Error(`Fehler beim Parsen von JSON in ${path}: ${e.message}`);
  }
}

// Update file content
async function updateFile(path, newContent, sha, message) {
  const base64Content = Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64');
  return githubRequest(path, 'PUT', {
    message,
    content: base64Content,
    sha
  });
}

// Twitch API
async function fetchStreamerStatus(twitchName) {
  try {
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = await userRes.json();
    const user = userData.data?.[0];
    if (!user) return null;

    return {
      twitchName,
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url,
      twitchUrl: `https://www.twitch.tv/${twitchName}`
    };
  } catch (e) {
    console.error(`❌ Fehler bei Twitch für ${twitchName}:`, e);
    return null;
  }
}

exports.handler = async () => {
  try {
    const { sha: configSha, content: config } = await getFile(CONFIG_PATH);
    const { sha: oldSha, content: oldData } = await getFile(OUTPUT_PATH);

    const streamerData = [];

    for (const entry of config) {
      const status = await fetchStreamerStatus(entry.twitchName);
      if (!status) continue;

      streamerData.push({
        ...status,
        clips: entry.clips,
        deaths: entry.clips.filter(c => c && c.trim() !== '').length,
        isLive: false
      });
    }

    await updateFile(OUTPUT_PATH, streamerData, oldSha, '⚙️ streamer_data.json aktualisiert');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '✅ streamer_data.json erfolgreich geschrieben.' })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
