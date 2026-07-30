const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const filePath = path.join(__dirname, 'friend-name.json');

function loadSavedNames() {
  if (!fs.existsSync(filePath)) return [];

  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      const normalized = [parsed];
      saveNames(normalized);
      return normalized;
    }

    return [];
  } catch (error) {
    console.warn('Could not parse friend-name.json, starting a fresh array.', error);
    saveNames([]);
    return [];
  }
}

function saveNames(names) {
  fs.writeFileSync(filePath, JSON.stringify(names, null, 2) + '\n', 'utf8');
}

app.post('/save-name', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' });
  }

  const payload = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  const names = loadSavedNames();
  names.push(payload);

  try {
    saveNames(names);
    res.json({ success: true, file: 'friend-name.json' });
  } catch (error) {
    console.error('Failed to save name:', error);
    res.status(500).json({ error: 'Unable to save name' });
  }
});

app.get('/friend-names', (req, res) => {
  const names = loadSavedNames();
  res.json(names);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
