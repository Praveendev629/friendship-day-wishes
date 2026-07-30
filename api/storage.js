const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const filePath = path.join(__dirname, '..', 'friend-name.json');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const TABLE_NAME = 'friend_names';
const CREATED_AT_COLUMN = 'createdat';
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const isDev = !isProduction;

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
  if (!supabase) {
    if (isDev) return loadFileNames();
    throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order(CREATED_AT_COLUMN, { ascending: true });

    if (error) {
      throw error;
    }

    if (Array.isArray(data)) {
      return data.map((item) => ({ name: item.name, createdAt: item.createdat }));
    }

    return [];
  } catch (error) {
    if (isDev) {
      console.warn('Supabase read failed, using local file storage instead:', error);
      return loadFileNames();
    }
    throw error;
  }
}

async function saveNames(names) {
  if (!supabase) {
    if (isDev) {
      saveFileNames(names);
      return { success: true, source: 'file', warning: 'Supabase not configured' };
    }
    throw new Error('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  try {
    const latest = names[names.length - 1];
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ name: latest.name, createdat: latest.createdAt }]);

    if (error) throw error;
    return { success: true, source: 'supabase', data };
  } catch (error) {
    if (isDev) {
      console.warn('Supabase insert failed, using local file storage instead:', error);
      saveFileNames(names);
      return { success: true, source: 'file', warning: error.message };
    }
    throw error;
  }
}

module.exports = {
  loadSavedNames,
  saveNames,
};
