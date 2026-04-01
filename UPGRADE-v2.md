# Bariatric Istanbul - Upgrade Guide v2.0
## Spanish SEO + Blog + Surgeon/Hospital Admin + Cookie Consent

---

## What's New in This Update

- Full Spanish translation (all sections)
- SEO/AEO optimization for "La cirugía de manga gástrica en Turquía"
- Blog section with 3 SEO-optimized articles
- Editable Surgeon section in Admin
- Editable Hospital section in Admin
- Cookie consent banner (GDPR compliant)
- Official logo integrated (navbar, footer, admin, favicon)
- Dynamic sitemap.xml
- robots.txt

---

## UPGRADE STEPS

### Step 1: SSH to Your Server

```bash
ssh bariatrices@your-server-ip
cd /home/bariatrices
```

---

### Step 2: Pull Latest Code

```bash
cd /home/bariatrices/bariatric-repo
git pull
```

---

### Step 3: Update Backend

```bash
# Copy updated server.py
cp backend/server.py /home/bariatrices/bariatric-backend/

# Copy updated requirements (no new packages, but keeps versions in sync)
cp backend/requirements-server.txt /home/bariatrices/bariatric-backend/requirements.txt

# Restart backend
cd /home/bariatrices/bariatric-backend
./restart.sh

# Verify backend is running with Spanish seed
./status.sh
curl http://127.0.0.1:8001/api/
# Should return: {"message":"Bariatric Istanbul API - Cirugía Bariátrica en Turquía"}

# Test new endpoints
curl http://127.0.0.1:8001/api/content/surgeon
curl http://127.0.0.1:8001/api/content/hospital
curl http://127.0.0.1:8001/api/content/blog
curl http://127.0.0.1:8001/api/sitemap.xml
```

**NOTE:** The first startup after update will automatically seed Spanish content for:
- Surgeon (Dr. Mehmet Yilmaz)
- Hospital (JCI accredited facility)
- 3 Blog posts (SEO optimized)

This ONLY happens if those collections are empty. Your existing transformations, testimonials, videos, and itinerary data will NOT be touched.

---

### Step 4: Build & Deploy Frontend

**Option A: Build on Server (if Node.js available)**

```bash
cd /home/bariatrices/bariatric-repo/frontend

# Make sure .env has your domain
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env

# Install & build
npm install
npm run build

# Deploy to public_html (PRESERVE api/ folder and .htaccess)
rsync -av --exclude='api' --exclude='.htaccess' build/ /home/bariatrices/public_html/
```

**Option B: Build Locally & Upload**

On your LOCAL machine:
```bash
cd frontend/
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env
npm install
npm run build
```

Then upload `build/*` contents to your server's `public_html/` folder via:
- cPanel File Manager
- FTP/SFTP
- SCP: `scp -r build/* bariatrices@server:/home/bariatrices/public_html/`

**IMPORTANT: DO NOT overwrite these files on your server:**
- `/public_html/api/` folder (PHP proxy)
- `/public_html/.htaccess` (routing rules)

---

### Step 5: Upload Logo Files

Make sure these logo files are in your `public_html/` folder:
- `logo.png` (main logo - used in navbar, footer, favicon)
- `logo-b.png` (alternate version)

They should already be included in the build, but verify:
```bash
ls -la /home/bariatrices/public_html/logo.png
ls -la /home/bariatrices/public_html/logo-b.png
ls -la /home/bariatrices/public_html/robots.txt
```

---

### Step 6: Update .htaccess (If Needed)

Your existing `.htaccess` should work fine. But if Admin panel auth fails, add this line BEFORE other rewrite rules:

```apache
# Pass Authorization header to PHP (required for admin panel)
RewriteEngine On
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

Full recommended `.htaccess` for `public_html/`:

```apache
RewriteEngine On

# Pass Authorization header
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# Route /api requests to PHP proxy
RewriteCond %{REQUEST_URI} ^/api [NC]
RewriteRule ^api/(.*)$ /api/index.php [L,QSA]

# React Router - serve index.html for all other routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule . /index.html [L]

# Security
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>

# Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

---

## VERIFY EVERYTHING

### 1. Backend
```bash
cd /home/bariatrices/bariatric-backend
./status.sh
curl http://127.0.0.1:8001/api/content/surgeon
curl http://127.0.0.1:8001/api/content/hospital
curl http://127.0.0.1:8001/api/content/blog
curl http://127.0.0.1:8001/api/sitemap.xml
```

### 2. Website (open in browser)
- Homepage: `https://yourdomain.com/` - Should show Spanish content with logo
- Blog: `https://yourdomain.com/blog` - Should show 3 articles
- Blog post: `https://yourdomain.com/blog/manga-gastrica-turquia-guia-completa`
- Admin login: `https://yourdomain.com/admin`
- Admin dashboard: All 7 tabs (Transformaciones, Testimonios, Videos, Itinerario, Cirujano, Hospital, Blog)
- Cookie banner: Clear your browser cookies, reload - should see consent banner at bottom

### 3. SEO Check
- View page source - should see Spanish meta tags, Schema.org structured data
- Check `https://yourdomain.com/robots.txt`
- Check `https://yourdomain.com/api/sitemap.xml` (goes through PHP proxy)

---

## NEW ADMIN FEATURES

After logging in at `/admin`:

| Tab | What It Does |
|-----|--------------|
| Cirujano | Edit surgeon name, bio, photo, credentials (single item) |
| Hospital | Edit hospital name, description, features (single item) |
| Blog | Create/edit/delete SEO blog posts with meta tags |

Blog posts have these SEO fields:
- Title, Slug (URL), Excerpt
- Content (HTML editor)
- Meta Title, Meta Description
- Keywords (one per line)
- Published toggle

---

## DATABASE CHANGES

New MongoDB collections (auto-created on first startup):

| Collection | Type | Notes |
|-----------|------|-------|
| `surgeon` | Single document | Replace on save |
| `hospital` | Single document | Replace on save |
| `blog` | Multiple documents | Full CRUD |

Existing collections are NOT modified:
- `users` (admin account)
- `transformations`
- `testimonials`
- `video_testimonials`
- `itinerary`

---

## TROUBLESHOOTING

### Blog pages show blank / 404
- Verify `.htaccess` React Router rule is working
- The `/blog` and `/blog/:slug` routes need to serve `index.html`

### Admin panel auth fails
- Make sure `.htaccess` passes Authorization header (see Step 6)
- Check PHP proxy at `public_html/api/index.php` forwards the `Authorization` header

### Sitemap not accessible
- `https://yourdomain.com/api/sitemap.xml` goes through PHP proxy
- Test directly: `curl http://127.0.0.1:8001/api/sitemap.xml`

### Spanish content not showing
- Backend auto-seeds Spanish data ONLY if collections are empty
- If you had old English data, it persists - update via Admin panel
- To force re-seed: drop the collection in MongoDB Atlas, then restart backend

### Cookie banner not showing
- Clear localStorage in browser (F12 > Application > localStorage > delete `cookie_consent`)
- Or open in incognito/private window

---

## QUICK COMMANDS

```bash
# Backend
cd /home/bariatrices/bariatric-backend
./start.sh       # Start
./stop.sh        # Stop
./restart.sh     # Restart
./status.sh      # Check status
tail -f logs.txt # Watch logs

# Test APIs
curl http://127.0.0.1:8001/api/
curl http://127.0.0.1:8001/api/content/blog
curl http://127.0.0.1:8001/api/content/surgeon
curl http://127.0.0.1:8001/api/content/hospital
curl http://127.0.0.1:8001/api/sitemap.xml
```
