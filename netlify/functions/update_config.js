const { Octokit } = require("@octokit/rest");

const OWNER = "Shaoshin10";
const REPO = "Metashi_WoW_HC-Event";
const CONFIG_PATH = "data/streamer_config.json";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  try {
    const newEntry = JSON.parse(event.body);

    // Bestehende Konfiguration laden
    const res = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: CONFIG_PATH,
    });

    const sha = res.data.sha;
    const content = Buffer.from(res.data.content, "base64").toString();
    const config = JSON.parse(content);

    // Streamer aktualisieren oder hinzufügen
    const index = config.findIndex(e => e.twitchName === newEntry.twitchName);
    if (index !== -1) {
      config[index].clips = newEntry.clips;
    } else {
      config.push(newEntry);
    }

    // Datei speichern
    const updatedContent = Buffer.from(JSON.stringify(config, null, 2)).toString("base64");
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: CONFIG_PATH,
      message: `✍️ Update Clips für ${newEntry.twitchName}`,
      content: updatedContent,
      sha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Erfolgreich gespeichert" }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
