// netlify/functions/update-streamer.js
const fs = require('fs');
const path = require('path');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const newData = JSON.parse(event.body);
  const filePath = path.resolve(__dirname, '../../streamer_data.json');
  const existing = JSON.parse(fs.readFileSync(filePath));

  const updated = existing.map(entry =>
    entry.name === newData.name ? { ...entry, deaths: newData.deaths, clips: newData.clips } : entry
  );

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

  return { statusCode: 200, body: 'OK' };
};