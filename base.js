const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const { customAlphabet } = require('nanoid');
const { getDB, save } = require('./db');
const Storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', etag: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Local dev: save to disk. Production (STORAGE_DRIVER=r2/s3): keep in memory,
// routes stream buffer straight to cloud via Storage.saveBuffer().
const isCloud = (process.env.STORAGE_DRIVER || 'local') !== 'local';
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e6) + '-' + safe);
  }
});
const upload = isCloud
  ? multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024*1024*1024 } })
  : multer({ storage: diskStorage, limits: { fileSize: 1024*1024*1024 } });

function slugify(s){ return (s||'app').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'app'; }
function fmtSize(b){ if(!b) return '—'; if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; if(b<1073741824) return (b/1048576).toFixed(1)+' MB'; return (b/1073741824).toFixed(2)+' GB'; }
function publicApp(a){
  return { id:a.id, name:a.name, slug:a.slug, developer:a.developer, category:a.category, version:a.version, os:a.os, license:a.license, size:a.size, sizeText:fmtSize(a.size), downloads:a.downloads, views:a.views, rating:a.rating, ratingCount:a.ratingCount, featured:a.featured, trending:a.trending, verified:a.verified, description:(a.description||'').slice(0,220), icon:a.icon, updatedAt:a.updatedAt };
}
function adminAuth(req, res, next) {
  const db = getDB();
  const key = req.headers['x-admin-key'];
  if (key && key === db.settings.adminKey) return next();
  return res.status(401).json({ error: 'Unauthorized admin. Send x-admin-key header.' });
}

module.exports = { app, upload, nanoid, slugify, fmtSize, publicApp, adminAuth, Storage, getDB, save };
