// /netlify/functions/generate_streamer_data.js
const { Octokit } = require("@octokit/rest");
const fetch = require('node-fetch');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Shaoshin10';
const REPO_NAME = 'Metashi_WoW_HC-Event';
const CONFIG_PATH = 'data/streamer_config.json';
const OUTPUT_PATH = 'data/streamer_data.json';

const clientId = 'ahbdg12dbfz1h536z4oixln6rw4cm5';
const accessToken = 'evivsdf11txng1f48e3zqumxflprgq';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

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
    console.error(`Fehler beim Abrufen von Twitch-Infos für ${twitchName}`, e);
    return null;
  }
}

async function getFileContent(path) {
  const { data } = await octokit.rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path
  });

  const content = Buffer.from(data.content, 'base64').toString();
  return JSON.parse(content);
}

async function updateFile(path, content, message) {
  const { data: current } = await octokit.rest.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path
  });

  const sha = current.sha;

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path,
    message,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    sha
  });
}

export async function handler() {
  try {
    const config = await getFileContent(CONFIG_PATH);
    const result = [];

    for (const streamer of config) {
      const status = await fetchStreamerStatus(streamer.twitchName);
      if (!status) continue;

      const deaths = streamer.clips.filter(c => c && c.trim() !== '').length;

      result.push({
        ...status,
        clips: streamer.clips,
        deaths,
        isLive: false // kann separat geprüft werden
      });
    }

    await updateFile(OUTPUT_PATH, result, 'Update streamer_data.json');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'streamer_data.json wurde erfolgreich aktualisiert.' })
    };
  } catch (err) {
    console.error('Fehler beim Generieren:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
