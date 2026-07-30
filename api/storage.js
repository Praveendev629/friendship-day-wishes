const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const filePath = path.join(__dirname, '..', 'friend-name.json');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const TABLE_NAME = 'friend_names';

function loadFileNames() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8').trim();
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.warn('Could not parse friend-name.json:', error);
    return [];
  }
}

function saveFileNames(names) {
  fs.writeFileSync(filePath, JSON.stringify(names, null, 2) + '\n', 'utf8');
}

async function loadSavedNames() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('createdAt', { ascending: true });

      if (error) {
        console.warn('Supabase read failed, falling back to file storage:', error);
      } else if (Array.isArray(data)) {
        return data.map((item) => ({ name: item.name, createdAt: item.createdAt }));
      }
    } catch (error) {
      console.warn('Supabase query failed, falling back to file storage:', error);
    }
  }

  return loadFileNames();
}

async function saveNames(names) {
  if (supabase) {
    try {
      const latest = names[names.length - 1];
      const { error } = await supabase
        .from(TABLE_NAME)
        .insert([{ name: latest.name, createdAt: latest.createdAt }]);

      if (!error) {
        return;
      }

      console.warn('Supabase write failed, falling back to file storage:', error);
    } catch (error) {
      console.warn('Supabase insert failed, falling back to file storage:', error);
    }
  }

  saveFileNames(names);
}

module.exports = {
  loadSavedNames,
  saveNames,
};
