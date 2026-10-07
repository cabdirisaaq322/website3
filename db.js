// Simple JSON file DB - swap to Postgres/Mongo later, API stays same
const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'db.json');

const DEFAULT_DB = {
  apps: [],
  categories: [
    { slug: 'action', name: 'Action', icon: '🎮' },
    { slug: 'social', name: 'Social', icon: '💬' },
    { slug: 'tools', name: 'Tools', icon: '🛠️' },
    { slug: 'music', name: 'Music & Audio', icon: '🎵' },
    { slug: 'video', name: 'Video Players', icon: '🎬' },
    { slug: 'photography', name: 'Photography', icon: '📷' },
    { slug: 'productivity', name: 'Productivity', icon: '📊' },
    { slug: 'lifestyle', name: 'Lifestyle', icon: '🌟' }
  ],
  reviews: [],
  hero: [
    { title: 'Shadow Strike: Elite', sub: 'AAA FPS on mobile — 5v5 ranked & battle royale', btn: 'Download Now', link: '/app/shadow-strike-elite', img: null },
    { title: 'BeatBox Music', sub: 'Stream 100M songs offline with lyrics & equalizer', btn: 'Get the App', link: '/app/beatbox-music', img: null },
    { title: 'Turbo Browser X', sub: 'Blazing fast browser — saves 60% data', btn: 'Install Free', link: '/app/turbo-browser-x', img: null }
  ],
  settings: { siteName: 'DownLoadHub', adminKey: process.env.ADMIN_KEY || 'change-me' }
};

function applyEnvSettings(db) {
  db.settings = db.settings || {};
  db.settings.siteName = db.settings.siteName || 'DownLoadHub';
  if (process.env.ADMIN_KEY) db.settings.adminKey = process.env.ADMIN_KEY;
  if (!db.settings.adminKey) db.settings.adminKey = 'change-me';
  return db;
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    seed();
    return applyEnvSettings(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  }
  try {
    return applyEnvSettings(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  } catch { return applyEnvSettings(JSON.parse(JSON.stringify(DEFAULT_DB))); }
}
function save(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function getDB() { return load(); }

function seed() {
  const db = load();
  if (db.apps.length) return;
  const now = Date.now();
  const demo = [
    { name: 'Turbo Browser X', slug: 'turbo-browser-x', developer: 'Turbo Labs', category: 'tools', version: '4.2.1', os: 'Android 8.0+', license: 'Free', size: 28400000, downloads: 1523401, views: 3200000, rating: 4.5, ratingCount: 23100, featured: true, trending: true, verified: true, description: 'Blazing fast lightweight browser with ad-block, dark mode and private vault. Saves up to 60% data.', changelog: 'v4.2.1: faster engine, fixed video downloader, new themes.', icon: null, screenshots: [], updatedAt: now - 86400000*1 },
    { name: 'Pixel Camera Pro', slug: 'pixel-camera-pro', developer: 'Pixel Studio', category: 'photography', version: '3.9.0', os: 'Android 9.0+', license: 'Free', size: 64200000, downloads: 892110, views: 1500000, rating: 4.3, ratingCount: 12400, featured: true, trending: true, verified: true, description: 'DSLR-like manual controls, RAW capture, 100+ filters, night mode AI denoise.', changelog: 'Added AI portrait blur + RAW export.', icon: null, screenshots: [], updatedAt: now - 86400000*2 },
    { name: 'BeatBox Music', slug: 'beatbox-music', developer: 'BeatBox Inc', category: 'music', version: '7.1.4', os: 'Android 7.0+', license: 'Free', size: 38900000, downloads: 2210400, views: 5100000, rating: 4.7, ratingCount: 45200, featured: true, trending: true, verified: true, description: 'Stream & download 100M songs, offline mode, lyrics, equalizer, no ads in Lite mode.', changelog: 'Offline playlists fixed, new equalizer presets.', icon: null, screenshots: [], updatedAt: now - 86400000*3 },
    { name: 'ChatWave Messenger', slug: 'chatwave-messenger', developer: 'WaveSoft', category: 'social', version: '12.5.0', os: 'Android 8.0+', license: 'Free', size: 52100000, downloads: 5400200, views: 9000000, rating: 4.4, ratingCount: 89100, featured: false, trending: true, verified: true, description: 'Secure chats, channels, stickers, video calls up to 32 people, cloud sync.', changelog: 'Stories + HD video calls.', icon: null, screenshots: [], updatedAt: now - 86400000*4 },
    { name: 'Shadow Strike: Elite', slug: 'shadow-strike-elite', developer: 'Nova Games', category: 'action', version: '2.3.9', os: 'Android 9.0+', license: 'Free', size: 412000000, downloads: 3100500, views: 7000000, rating: 4.6, ratingCount: 67800, featured: true, trending: true, verified: true, description: 'AAA FPS on mobile. 5v5 ranked, battle royale, 120fps support, controller ready.', changelog: 'New map Desert Storm + anti-cheat v3.', icon: null, screenshots: [], updatedAt: now - 86400000*5 },
    { name: 'StreamPlay HD', slug: 'streamplay-hd', developer: 'StreamPlay', category: 'video', version: '5.0.2', os: 'Android 7.0+', license: 'Free', size: 45600000, downloads: 1890000, views: 2800000, rating: 4.2, ratingCount: 18900, featured: false, trending: false, verified: true, description: 'Play any format 4K, subtitles auto-download, Chromecast, background pop-up.', changelog: 'HEVC hardware decoding improved.', icon: null, screenshots: [], updatedAt: now - 86400000*9 }
  ];
  demo.forEach((a, i) => {
    a.id = 'demo' + (i+1);
    a.fileUrl = null; // no file yet - download generates placeholder
    a.versions = [{ version: a.version, changelog: a.changelog, size: a.size, updatedAt: a.updatedAt }];
    a.createdAt = now - 86400000*30;
  });
  db.apps = demo;
  save(db);
}

module.exports = { getDB, save };
