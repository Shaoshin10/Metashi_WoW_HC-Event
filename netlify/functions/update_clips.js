const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch");

const OWNER = "Shaoshin10";
const REPO = "Metashi_WoW_HC-Event";
const CONFIG_PATH = "data/streamer_config.json";
const DATA_PATH = "data/streamer_data.json";

exports.handler = async function () {
  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  try {
    // 1. streamer_config.json holen
    const configRes = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: CONFIG_PATH,
    });

    const configContent = Buffer.from(configRes.data.content, "base64").toString();
    const config = JSON.parse(configContent);

    // 2. streamer_data.json holen
    const dataRes = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: DATA_PATH,
    });

    const dataSha = dataRes.data.sha;
    const dataContent = Buffer.from(dataRes.data.content, "base64").toString();
    const data = JSON.parse(dataContent);

    // 3. Clips aktualisieren
    let updated = false;

    const updatedData = data.map(entry => {
      const configEntry = config.find(c => c.twitchName === entry.twitchName);
      if (configEntry) {
        const newClips = configEntry.clips;
        const clipsChanged = JSON.stringify(entry.clips) !== JSON.stringify(newClips);
        if (clipsChanged) {
          updated = true;
          return { ...entry, clips: newClips, deaths: newClips.filter(c => c && c.trim() !== "").length };
        }
      }
      return entry;
    });

    // 4. Nur wenn sich was geändert hat
    if (!updated) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Keine Änderungen – kein Commit nötig." }),
      };
    }

    const updatedJson = JSON.stringify(updatedData, null, 2);
    const contentEncoded = Buffer.from(updatedJson).toString("base64");

    // 5. streamer_data.json aktualisieren
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: DATA_PATH,
      message: "⏱ Update streamer_data.json mit neuen Clips",
      content: contentEncoded,
      sha: dataSha,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ streamer_data.json erfolgreich aktualisiert." }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
