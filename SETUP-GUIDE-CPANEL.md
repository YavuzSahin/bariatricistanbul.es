# Bariatric Istanbul - Complete Setup Guide (cPanel)
## From Zero to Live Website

---

## 📋 PREREQUISITES

Before starting, you need:
1. ✅ cPanel hosting access (SSH enabled)
2. ✅ Domain pointed to your server
3. ✅ GitHub repository with the code
4. ✅ MongoDB Atlas account (free) - https://cloud.mongodb.com

---

## STEP 1: Create MongoDB Atlas Database (Free)

### 1.1 Create Account
1. Go to https://cloud.mongodb.com
2. Click "Try Free" → Sign up with Google/Email
3. Choose "FREE" tier (M0 Sandbox)

### 1.2 Create Cluster
1. Click "Build a Database"
2. Select "FREE - Shared"
3. Choose region closest to your server
4. Click "Create Cluster" (takes 1-3 minutes)

### 1.3 Create Database User
1. Go to "Database Access" (left menu)
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter username: `bariatricadmin`
5. Click "Autogenerate Secure Password" → **COPY THIS PASSWORD**
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.4 Allow Network Access
1. Go to "Network Access" (left menu)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (adds 0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" (left menu)
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string, looks like:
   ```
   mongodb+srv://bariatricadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. **SAVE THIS - You'll need it later**

---

## STEP 2: SSH to Your Server

### 2.1 Connect via SSH
```bash
ssh bariatrices@your-server-ip
# Or use cPanel Terminal
```

### 2.2 Go to Home Directory
```bash
cd /home/bariatrices
```

---

## STEP 3: Install Required Software

### 3.1 Check Python Version
```bash
python3 --version
```
You need Python 3.8+. If not installed, contact your hosting provider.

### 3.2 Check if pip is available
```bash
pip3 --version
```

### 3.3 Check Node.js (for building frontend)
```bash
node --version
npm --version
```
If not available, we'll build frontend locally instead.

---

## STEP 4: Clone Your Repository

```bash
cd /home/bariatrices

# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git bariatric-repo

# Verify
ls bariatric-repo/
```

You should see: `backend/` `frontend/` folders

---

## STEP 5: Setup Backend

### 5.1 Create Backend Directory
```bash
mkdir -p /home/bariatrices/bariatric-backend
cp -r /home/bariatrices/bariatric-repo/backend/* /home/bariatrices/bariatric-backend/
cd /home/bariatrices/bariatric-backend
```

### 5.2 Create Python Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 5.3 Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

If requirements.txt is missing, install manually:
```bash
pip install fastapi uvicorn motor pydantic python-dotenv bcrypt PyJWT python-multipart email-validator
```

### 5.4 Create .env File
```bash
nano .env
```

Paste this (UPDATE THE VALUES):
```env
MONGO_URL="mongodb+srv://bariatricadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
DB_NAME="bariatric_istanbul"
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com,http://yourdomain.com"
JWT_SECRET="paste-random-string-here-make-it-64-characters-long-and-random"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="YourSecurePassword123"
```

**To generate JWT_SECRET, run:**
```bash
openssl rand -hex 32
```

Save and exit: `Ctrl+X` → `Y` → `Enter`

### 5.5 Test Backend
```bash
source venv/bin/activate
python -c "from server import app; print('✅ Backend OK')"
```

### 5.6 Deactivate Virtual Environment
```bash
deactivate
```

---

## STEP 6: Create Backend Management Scripts

### 6.1 Create start.sh
```bash
cat > /home/bariatrices/bariatric-backend/start.sh << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
source venv/bin/activate
nohup uvicorn server:app --host 127.0.0.1 --port 8001 > logs.txt 2>&1 &
echo $! > pid.txt
echo "✅ Backend started (PID: $(cat pid.txt))"
EOF
chmod +x /home/bariatrices/bariatric-backend/start.sh
```

### 6.2 Create stop.sh
```bash
cat > /home/bariatrices/bariatric-backend/stop.sh << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
if [ -f pid.txt ]; then
    kill $(cat pid.txt) 2>/dev/null
    rm -f pid.txt
    echo "✅ Backend stopped"
else
    pkill -f "uvicorn server:app"
    echo "✅ Backend stopped"
fi
EOF
chmod +x /home/bariatrices/bariatric-backend/stop.sh
```

### 6.3 Create restart.sh
```bash
cat > /home/bariatrices/bariatric-backend/restart.sh << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
./stop.sh
sleep 2
./start.sh
EOF
chmod +x /home/bariatrices/bariatric-backend/restart.sh
```

### 6.4 Create status.sh
```bash
cat > /home/bariatrices/bariatric-backend/status.sh << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
if [ -f pid.txt ] && ps -p $(cat pid.txt) > /dev/null 2>&1; then
    echo "✅ Backend RUNNING (PID: $(cat pid.txt))"
    echo "📋 Recent logs:"
    tail -10 logs.txt
else
    echo "❌ Backend NOT RUNNING"
fi
EOF
chmod +x /home/bariatrices/bariatric-backend/status.sh
```

### 6.5 Start Backend
```bash
cd /home/bariatrices/bariatric-backend
./start.sh
```

### 6.6 Verify Backend Running
```bash
./status.sh
curl http://127.0.0.1:8001/api/
```

Should return: `{"message":"Bariatric Istanbul API"}`

---

## STEP 7: Setup Frontend

### Option A: Build on Server (if Node.js available)

```bash
cd /home/bariatrices/bariatric-repo/frontend

# Create .env
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env

# Install & Build
npm install
npm run build

# Copy to public_html
mkdir -p /home/bariatrices/public_html/bariatric
cp -r build/* /home/bariatrices/public_html/bariatric/
```

### Option B: Build Locally & Upload

On your LOCAL computer:
```bash
cd frontend/

# Create .env
echo "REACT_APP_BACKEND_URL=https://yourdomain.com" > .env

# Install & Build
npm install
npm run build
```

Then upload `build/` folder contents to `/home/bariatrices/public_html/bariatric/` via:
- cPanel File Manager
- FTP/SFTP
- SCP: `scp -r build/* bariatrices@server:/home/bariatrices/public_html/bariatric/`

---

## STEP 8: Create .htaccess for Frontend

```bash
cat > /home/bariatrices/public_html/bariatric/.htaccess << 'EOF'
RewriteEngine On

# Proxy API requests to backend
RewriteCond %{REQUEST_URI} ^/api [NC]
RewriteRule ^api/(.*)$ http://127.0.0.1:8001/api/$1 [P,L]

# React Router - serve index.html for all routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /bariatric/index.html [L]

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
EOF
```

---

## STEP 9: Set File Permissions

```bash
# Backend
chmod 700 /home/bariatrices/bariatric-backend/*.sh
chmod 600 /home/bariatrices/bariatric-backend/.env

# Frontend
find /home/bariatrices/public_html/bariatric -type d -exec chmod 755 {} \;
find /home/bariatrices/public_html/bariatric -type f -exec chmod 644 {} \;
```

---

## STEP 10: Auto-Start Backend on Reboot

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "@reboot /home/bariatrices/bariatric-backend/start.sh") | crontab -

# Verify
crontab -l
```

---

## STEP 11: Test Everything

### 11.1 Check Backend
```bash
cd /home/bariatrices/bariatric-backend
./status.sh
```

### 11.2 Test API
```bash
curl http://127.0.0.1:8001/api/
curl http://127.0.0.1:8001/api/content/testimonials
```

### 11.3 Test Website
Open in browser:
- Homepage: `https://yourdomain.com/bariatric/`
- Admin: `https://yourdomain.com/bariatric/admin`

---

## 📁 FINAL DIRECTORY STRUCTURE

```
/home/bariatrices/
├── bariatric-backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env              ← Your secrets (chmod 600)
│   ├── venv/             ← Python virtual environment
│   ├── start.sh
│   ├── stop.sh
│   ├── restart.sh
│   ├── status.sh
│   ├── logs.txt          ← Backend logs
│   └── pid.txt           ← Process ID
│
├── bariatric-repo/       ← Git repository
│   ├── backend/
│   └── frontend/
│
└── public_html/
    └── bariatric/        ← Frontend build
        ├── index.html
        ├── static/
        └── .htaccess
```

---

## 🔧 USEFUL COMMANDS

```bash
# Backend
cd /home/bariatrices/bariatric-backend
./start.sh          # Start backend
./stop.sh           # Stop backend
./restart.sh        # Restart backend
./status.sh         # Check status
tail -f logs.txt    # Watch logs live

# Update from GitHub
cd /home/bariatrices/bariatric-repo
git pull
cp -r backend/* /home/bariatrices/bariatric-backend/
cd /home/bariatrices/bariatric-backend
./restart.sh
```

---

## ❌ TROUBLESHOOTING

### Backend won't start
```bash
cd /home/bariatrices/bariatric-backend
source venv/bin/activate
python server.py
# Check error messages
```

### API returns 500 error
```bash
tail -50 /home/bariatrices/bariatric-backend/logs.txt
```

### MongoDB connection failed
- Check MONGO_URL in .env
- Verify IP whitelist in MongoDB Atlas (0.0.0.0/0)
- Test: `curl http://127.0.0.1:8001/api/`

### Frontend shows blank page
- Check browser console (F12)
- Verify REACT_APP_BACKEND_URL matches your domain
- Rebuild frontend if needed

### Admin login not working
- Check ADMIN_EMAIL and ADMIN_PASSWORD in .env
- Restart backend after .env changes

---

## ✅ CHECKLIST

- [ ] MongoDB Atlas account created
- [ ] Database user created with password
- [ ] Network access set to 0.0.0.0/0
- [ ] Connection string copied
- [ ] Repository cloned to server
- [ ] Backend dependencies installed
- [ ] Backend .env created with correct values
- [ ] Backend started and running
- [ ] Frontend built with correct REACT_APP_BACKEND_URL
- [ ] Frontend uploaded to public_html/bariatric/
- [ ] .htaccess created
- [ ] Website loads: https://yourdomain.com/bariatric/
- [ ] Admin works: https://yourdomain.com/bariatric/admin
- [ ] Crontab set for auto-restart

---

## 🔐 YOUR CREDENTIALS

Save these somewhere safe:

```
Website URL: https://yourdomain.com/bariatric/
Admin URL: https://yourdomain.com/bariatric/admin
Admin Email: (from .env ADMIN_EMAIL)
Admin Password: (from .env ADMIN_PASSWORD)

MongoDB Atlas: https://cloud.mongodb.com
MongoDB User: bariatricadmin
MongoDB Password: (your password)

SSH: ssh bariatrices@your-server-ip
```
