# Bariatric Istanbul - cPanel Deployment Guide

## Important Notes

⚠️ **MongoDB Requirement**: cPanel shared hosting typically doesn't include MongoDB. You have two options:
1. **MongoDB Atlas** (Recommended) - Free cloud MongoDB
2. **VPS/Dedicated Server** with cPanel - Install MongoDB manually

---

## Option 1: Using MongoDB Atlas (Recommended for Shared Hosting)

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bariatric_istanbul
   ```
6. In "Network Access", add `0.0.0.0/0` to allow connections from anywhere

---

## Step 2: Upload Files to cPanel

### Via File Manager:

1. Login to cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your domain folder)
4. Create folder structure:
   ```
   public_html/
   ├── bariatric/           # Frontend files go here
   └── bariatric-api/       # Backend files go here (outside public_html is better)
   ```

### Better structure (recommended):
```
/home/username/
├── public_html/
│   └── bariatric/         # Frontend build files
├── bariatric-backend/     # Backend (outside public_html for security)
│   ├── server.py
│   ├── requirements.txt
│   └── .env
```

---

## Step 3: Setup Python Application (Backend)

### 3.1 Create Python App in cPanel

1. In cPanel, find **"Setup Python App"** or **"Python Selector"**
2. Click **"Create Application"**
3. Configure:
   - **Python version**: 3.11 (or highest available)
   - **Application root**: `bariatric-backend`
   - **Application URL**: `api.yourdomain.com` or `yourdomain.com/api`
   - **Application startup file**: `passenger_wsgi.py`
   - **Application Entry point**: `application`

4. Click **"Create"**

### 3.2 Create passenger_wsgi.py

In your `bariatric-backend` folder, create `passenger_wsgi.py`:

```python
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import the FastAPI app
from server import app

# Passenger WSGI expects 'application'
# For FastAPI, we need an ASGI to WSGI adapter
from asgiref.wsgi import WsgiToAsgi

# If your cPanel supports ASGI (Passenger 6+), use this:
application = app

# If cPanel only supports WSGI, uncomment below:
# from a]2wsgi import ASGIMiddleware
# application = ASGIMiddleware(app)
```

### 3.3 Upload Backend Files

Upload these files to `bariatric-backend/`:
- `server.py`
- `requirements.txt`
- `passenger_wsgi.py`
- `.env`

### 3.4 Create .env file

```env
MONGO_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bariatric_istanbul"
DB_NAME="bariatric_istanbul"
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
JWT_SECRET="your-random-64-character-secret-key-here"
ADMIN_EMAIL="admin@bariatricistanbul.com"
ADMIN_PASSWORD="your-secure-password"
```

### 3.5 Install Dependencies

1. In cPanel Python App page, click **"Enter to the virtual environment"**
2. Copy the command shown (like `source /home/user/virtualenv/bariatric-backend/3.11/bin/activate`)
3. Go to **Terminal** in cPanel
4. Run the activation command
5. Install dependencies:
   ```bash
   cd ~/bariatric-backend
   pip install -r requirements.txt
   pip install asgiref python-dotenv
   ```

### 3.6 Restart Python App

In cPanel Python App section, click **"Restart"** button.

---

## Step 4: Build & Upload Frontend

### 4.1 Build Frontend Locally

On your local machine:

```bash
cd frontend

# Create .env for production
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env

# Install and build
yarn install
yarn build
```

### 4.2 Upload Build Files

1. The `build` folder contains all static files
2. Upload contents of `build/` folder to `public_html/bariatric/` (or your domain root)

Upload structure:
```
public_html/bariatric/
├── index.html
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── favicon.ico
└── manifest.json
```

---

## Step 5: Configure .htaccess (URL Routing)

Create `.htaccess` in `public_html/bariatric/`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Handle API requests - proxy to Python backend
    RewriteCond %{REQUEST_URI} ^/api [NC]
    RewriteRule ^api/(.*)$ http://127.0.0.1:YOUR_PYTHON_APP_PORT/api/$1 [P,L]
    
    # Handle React Router - serve index.html for all routes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## Step 6: Setup Subdomain for API (Recommended)

Instead of proxy, you can use a subdomain:

1. In cPanel, go to **"Subdomains"**
2. Create `api.yourdomain.com`
3. Point it to your Python app directory
4. Update frontend `.env`:
   ```
   REACT_APP_BACKEND_URL=https://api.yourdomain.com
   ```
5. Rebuild frontend and re-upload

---

## Step 7: SSL Certificate

1. In cPanel, go to **"SSL/TLS"** or **"Let's Encrypt SSL"**
2. Install free SSL for your domain
3. Enable **"Force HTTPS"** redirect

---

## Alternative: Node.js Proxy (If Python App Issues)

If cPanel Python App doesn't work well with FastAPI, create a Node.js proxy:

### Create `proxy-server.js`:

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Serve React static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy API requests
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8001',
    changeOrigin: true
}));

// Handle React routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Troubleshooting

### Backend not working
1. Check Python app logs in cPanel
2. Verify `.env` file has correct MongoDB connection string
3. Test MongoDB connection:
   ```bash
   python -c "from pymongo import MongoClient; c = MongoClient('YOUR_MONGO_URL'); print(c.server_info())"
   ```

### 500 Internal Server Error
1. Check `error_log` in cPanel
2. Verify all Python dependencies are installed
3. Check file permissions (755 for directories, 644 for files)

### CORS errors
1. Ensure `CORS_ORIGINS` in backend `.env` includes your domain
2. Check `.htaccess` CORS headers

### React routes showing 404
1. Verify `.htaccess` is in the correct location
2. Check if `mod_rewrite` is enabled

---

## File Permissions

Set correct permissions via cPanel File Manager or Terminal:

```bash
# Directories
find ~/bariatric-backend -type d -exec chmod 755 {} \;
find ~/public_html/bariatric -type d -exec chmod 755 {} \;

# Files
find ~/bariatric-backend -type f -exec chmod 644 {} \;
find ~/public_html/bariatric -type f -exec chmod 644 {} \;

# Python files need execute
chmod 755 ~/bariatric-backend/passenger_wsgi.py
```

---

## Quick Checklist

- [ ] MongoDB Atlas account created and connection string obtained
- [ ] Backend files uploaded to `bariatric-backend/`
- [ ] `.env` file created with correct values
- [ ] Python app created in cPanel
- [ ] Dependencies installed via virtual environment
- [ ] Frontend built locally with production `.env`
- [ ] Frontend `build/` contents uploaded to `public_html/`
- [ ] `.htaccess` configured for React routing
- [ ] SSL certificate installed
- [ ] Tested: Homepage loads
- [ ] Tested: Admin login works (`/admin`)
- [ ] Tested: Lead form submits

---

## Support

If you encounter issues specific to your cPanel hosting:
1. Contact your hosting provider for Python/Node.js app support
2. Ask about MongoDB availability or use MongoDB Atlas
3. Verify Passenger version supports ASGI applications
