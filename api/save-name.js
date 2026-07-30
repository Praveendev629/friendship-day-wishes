const { loadSavedNames, saveNames } = require('./storage');

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
    const names = await loadSavedNames();
    names.push(payload);
    const result = await saveNames(names);

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, storage: result.source, warning: result.warning || null }));
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Unable to save name' }));
  }
};
