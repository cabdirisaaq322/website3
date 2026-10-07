# DownloadHub Hosting

## Render
1. Upload this project to GitHub.
2. Create a Render Web Service from the repository.
3. Use the included `Dockerfile` (or the included `render.yaml`).
4. Set a strong `ADMIN_KEY` in Render Environment Variables.
5. If you want uploaded APKs to survive restarts, configure Cloudflare R2 and set:
   - `STORAGE_DRIVER=r2`
   - `R2_ENDPOINT`
   - `R2_BUCKET`
   - `R2_ACCESS_KEY`
   - `R2_SECRET_KEY`
   - `R2_PUBLIC_URL` (optional, if you want public object URLs)

The app listens on Render's `PORT` automatically.

## Local
```bash
npm install
ADMIN_KEY=change-this-to-a-strong-random-key npm start
```
Open `/` for the store and `/admin` for the admin panel.

**Important:** Do not use `admin123` in production. Set `ADMIN_KEY` to a long random secret.
