const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.post('/save-name', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name' });
  }

  const payload = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  const filePath = path.join(__dirname, 'friend-name.json');
  fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Failed to save name:', err);
      return res.status(500).json({ error: 'Unable to save name' });
    }
    res.json({ success: true, file: 'friend-name.json' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
