const BIN_ID = "682df6948a456b7966a2d92e";
const ACCESS_KEY = "$2a$10$PqXzhtRUMzLMBE8zC5HmOuDWaX07Sep44ldTN.r7uerSNnFk8EH7G";
const clientId = "ahbdg12dbfz1h536z4oixln6rw4cm5";
const accessToken = "evivsdf11txng1f48e3zqumxflprgq";

let streamerRows = [];

async function fetchStreamerStatus(username) {
  try {
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const userData = await userRes.json();
    const user = userData.data?.[0];
    if (!user) return null;

    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const streamData = await streamRes.json();
    const isLive = streamData.data?.length > 0;

    return {
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url,
      isLive,
      twitchUrl: `https://www.twitch.tv/${username}`
    };
  } catch (err) {
    console.error("Fehler bei Twitch-Status:", err);
    return null;
  }
}

async function loadStreamers() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: {
      'X-Access-Key': ACCESS_KEY,
      'Content-Type': 'application/json'
    }
  });

  const result = await res.json();
  const data = result.record;
  streamerRows = [];

  for (const streamer of data) {
    const status = await fetchStreamerStatus(streamer.twitchName);
    if (!status) continue;

    const deaths = streamer.clips.filter(c => c && c.trim() !== "").length;

    streamerRows.push({
      name: status.displayName,
      nameHtml: `
        <a href="${status.twitchUrl}" target="_blank">
          <img class="avatar" src="${status.profileImageUrl}" alt="avatar">
          ${status.displayName}
        </a> ${status.isLive ? '<span class="live-badge">LIVE</span>' : ''}`,
      clipsHtml: streamer.clips.map(c =>
        c && c.trim() !== "" ? `<td><a href="${c}" target="_blank">Clip</a></td>` : '<td>-</td>'
      ).join(''),
      deaths
    });
  }

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('streamer-table');
  tbody.innerHTML = '';
  for (const row of streamerRows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.nameHtml}</td>
      ${row.clipsHtml}
      <td>${row.deaths}/3</td>
    `;
    tbody.appendChild(tr);
  }
}

function sortTable(byKey, ascending = true) {
  streamerRows.sort((a, b) => {
    if (byKey === 'name') {
      return ascending
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (byKey === 'deaths') {
      return ascending ? a.deaths - b.deaths : b.deaths - a.deaths;
    }
    return 0;
  });
  renderTable();
}

let nameSortAsc = true;
let deathsSortAsc = true;

document.addEventListener('DOMContentLoaded', () => {
  loadStreamers();

  document.getElementById('sort-name').addEventListener('click', () => {
    sortTable('name', nameSortAsc);
    nameSortAsc = !nameSortAsc;
  });

  document.getElementById('sort-deaths').addEventListener('click', () => {
    sortTable('deaths', deathsSortAsc);
    deathsSortAsc = !deathsSortAsc;
  });
});
