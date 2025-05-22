const clientId = "ahbdg12dbfz1h536z4oixln6rw4cm5";
const accessToken = "evivsdf11txng1f48e3zqumxflprgq";

let streamerRows = [];

async function fetchLiveStatus(username) {
  try {
    // Twitch-ID abrufen
    const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const userData = await userRes.json();
    const user = userData.data?.[0];
    if (!user) return false;

    // Stream-Status prüfen
    const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const streamData = await streamRes.json();
    const stream = streamData.data?.[0];

    // Nur wenn Spiel "World of Warcraft"
    return stream && stream.game_name === "World of Warcraft";
  } catch (err) {
    console.error(`❌ Fehler bei Livestatus für ${username}:`, err);
    return false;
  }
}

async function loadStreamers() {
  const res = await fetch('/data/streamer_data.json');
  const data = await res.json();

  // Basisdaten vorbereiten
  streamerRows = data.map(streamer => {
    const deaths = streamer.clips.filter(c => c?.trim()).length;
    return {
      ...streamer,
      deaths,
      twitchUrl: `https://www.twitch.tv/${streamer.twitchName}`,
      clipsHtml: streamer.clips.map(c =>
        c?.trim() ? `<td><a href="${c}" target="_blank">Clip</a></td>` : '<td>-</td>'
      ).join(''),
      isLive: false
    };
  });

  renderTable();
  updateLiveStatus();
}

function renderTable() {
  const tbody = document.getElementById('streamer-table');
  tbody.innerHTML = '';

  for (const row of streamerRows) {
    const liveBadge = row.isLive ? '<span class="live-badge">LIVE</span>' : '';
    tbody.innerHTML += `
      <tr>
        <td>
          <a href="${row.twitchUrl}" target="_blank">
            <img class="avatar" src="${row.avatar}" alt="avatar">
            ${row.displayName}
          </a> ${liveBadge}
        </td>
        ${row.clipsHtml}
        <td>${row.deaths}/3</td>
      </tr>`;
  }
}

async function updateLiveStatus() {
  for (const row of streamerRows) {
    row.isLive = await fetchLiveStatus(row.twitchName);
  }
  renderTable();
}

// Sortierung (optional – bei Bedarf aktivieren)
function sortTable(byKey, ascending = true) {
  streamerRows.sort((a, b) => {
    if (byKey === 'name') {
      return ascending
        ? a.displayName.localeCompare(b.displayName)
        : b.displayName.localeCompare(a.displayName);
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
