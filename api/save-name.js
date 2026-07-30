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

function saveNames(names) {
  fs.writeFileSync(filePath, JSON.stringify(names, null, 2) + '\n', 'utf8');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const body = await parseJsonBody(req);
    const { name } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid name' }));
    }

    const payload = {
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    const names = loadSavedNames();
    names.push(payload);
    saveNames(names);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Unable to save name' }));
  }
};
