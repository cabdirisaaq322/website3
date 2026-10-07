// STORAGE: local dev, Cloudflare R2/S3 in production.
// Dev: files -> ./uploads/, served at /uploads/*
// Prod: STORAGE_DRIVER=r2 + env -> cloud, downloads redirect to signed URL.
const fs = require('fs');
const path = require('path');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let s3 = null;
function s3Client() {
  if (s3) return s3;
  const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
  s3 = {
    client: new S3Client({
      region: process.env.S3_REGION || 'auto', endpoint,
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY || process.env.S3_ACCESS_KEY, secretAccessKey: process.env.R2_SECRET_KEY || process.env.S3_SECRET_KEY },
      forcePathStyle: !!process.env.S3_ENDPOINT && !process.env.R2_ENDPOINT,
    }),
    bucket: process.env.R2_BUCKET || process.env.S3_BUCKET,
    PutObjectCommand, GetObjectCommand, getSignedUrl,
  };
  return s3;
}

const Storage = {
  driver: process.env.STORAGE_DRIVER || 'local',
  async saveBuffer(file, prefix) {
    if (this.driver === 'local') return null;
    const { client, bucket, PutObjectCommand } = s3Client();
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = (prefix || 'apk') + '/' + Date.now() + '-' + Math.round(Math.random() * 1e6) + '-' + safe;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype || 'application/octet-stream' }));
    const pub = process.env.R2_PUBLIC_URL;
    return { key, url: pub ? pub.replace(/\/$/, '') + '/' + key : 's3://' + bucket + '/' + key };
  },
  async downloadUrl(stored) {
    if (!stored) return null;
    if (stored.startsWith('http')) return stored;
    if (stored.startsWith('s3://')) {
      const { client, GetObjectCommand, getSignedUrl } = s3Client();
      const key = stored.replace(/^s3:\/\/[^/]+\//, '');
      return getSignedUrl(client, new GetObjectCommand({ Bucket: process.env.R2_BUCKET || process.env.S3_BUCKET, Key: key }), { expiresIn: 3600 });
    }
    return stored;
  },
  saveFile(file) { return '/uploads/' + file.filename; },
  urlFor(p) { return p; },
};
module.exports = Storage;
