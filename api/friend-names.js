const { loadSavedNames } = require('./storage');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const names = await loadSavedNames();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(names));
};
