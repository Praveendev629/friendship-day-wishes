const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'friend-name.json');

function loadSavedNames() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch (error) {
    console.warn('Could not parse friend-name.json:', error);
  }
  return [];
}

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const names = loadSavedNames();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(names));
};
