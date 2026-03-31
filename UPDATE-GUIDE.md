# Bariatric Istanbul - Update Guide
## For Updating Running Production Website

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Update all | `./update.sh` |
| Backend only | See Step 2 below |
| Frontend only | See Step 3 below |
| Restart backend | `./restart.sh` |
| View logs | `tail -f logs.txt` |
| Check status | `./status.sh` |

---

## 🚀 OPTION 1: Automatic Update (Recommended)

SSH to your server and run:

```bash
cd /home/bariatrices
./update.sh
```

This will:
1. Pull latest code from GitHub
2. Update backend files
3. Restart backend
4. Rebuild frontend (if Node.js available)

---

## 🔧 OPTION 2: Manual Update Steps

### Step 1: SSH to Server
```bash
ssh bariatrices@your-server-ip
cd /home/bariatrices
```

### Step 2: Update Backend Only

```bash
# Pull latest code
cd /home/bariatrices/bariatric-repo
git pull

# Copy updated server.py
cp backend/server.py /home/bariatrices/bariatric-backend/

# Install new dependencies (if any)
cd /home/bariatrices/bariatric-backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Restart backend
./restart.sh

# Verify
./status.sh
tail -20 logs.txt
```

### Step 3: Update Frontend Only

**Option A: Build on Server (if Node.js available)**
```bash
cd /home/bariatrices/bariatric-repo
git pull

cd frontend
npm install
npm run build

# Copy build files (keep api folder intact)
rsync -av --exclude='api' --exclude='.htaccess' build/ /home/bariatrices/public_html/
```

**Option B: Build Locally & Upload**

On your LOCAL machine:
```bash
cd frontend
git pull
npm install
npm run build
```

Then upload `build/*` to server:
```bash
# Using SCP (exclude api folder)
scp -r build/* bariatrices@server:/home/bariatrices/public_html/

# OR use FTP/FileManager - upload build/* contents to public_html/
# ⚠️ DO NOT overwrite the /api folder!
```

---

## 📁 Important Files - DO NOT DELETE

These files are SERVER-SPECIFIC and should NOT be overwritten:

```
/home/bariatrices/
├── bariatric-backend/
│   └── .env                 ← Your secrets (never overwrite)
│
└── public_html/
    ├── api/                 ← PHP proxy (never delete)
    │   ├── index.php
    │   └── .htaccess
    └── .htaccess            ← Main routing (never delete)
```

---

## 🔄 Common Update Scenarios

### Changed Backend Code (server.py)
```bash
cd /home/bariatrices/bariatric-repo
git pull
cp backend/server.py ../bariatric-backend/
cd ../bariatric-backend
./restart.sh
```

### Added New Python Package
```bash
cd /home/bariatrices/bariatric-backend
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
deactivate
./restart.sh
```

### Changed Frontend Code
```bash
# On LOCAL machine
cd frontend
npm run build
# Upload build/* to server public_html/ (except /api folder)
```

### Changed Environment Variables (.env)
```bash
cd /home/bariatrices/bariatric-backend
nano .env
# Make changes, save
./restart.sh
```

### Added New Admin
Update `.env`:
```bash
cd /home/bariatrices/bariatric-backend
nano .env
# Change ADMIN_EMAIL and ADMIN_PASSWORD
./restart.sh
```

---

## 🧪 Testing After Update

### 1. Check Backend Running
```bash
cd /home/bariatrices/bariatric-backend
./status.sh
```

### 2. Test API
```bash
curl http://127.0.0.1:8001/api/
# Should return: {"message":"Bariatric Istanbul API"}

curl http://127.0.0.1:8001/api/content/testimonials
# Should return testimonials array
```

### 3. Test Website
Open in browser:
- Homepage: `https://yourdomain.com/`
- Admin login: `https://yourdomain.com/admin`
- Check sliders work
- Check form submits

---

## ❌ Rollback If Something Breaks

### Rollback Backend
```bash
cd /home/bariatrices/bariatric-repo
git log --oneline -5   # Find previous commit
git checkout <commit-hash> -- backend/server.py
cp backend/server.py ../bariatric-backend/
cd ../bariatric-backend
./restart.sh
```

### Rollback Frontend
```bash
# Restore from backup
cd /home/bariatrices
ls backups/   # Find latest backup
tar -xzf backups/frontend-YYYYMMDD-HHMMSS.tar.gz -C public_html/
```

---

## 📊 Monitoring

### Watch Backend Logs Live
```bash
tail -f /home/bariatrices/bariatric-backend/logs.txt
```

### Check Disk Space
```bash
df -h /home/bariatrices
```

### Check Backend Memory Usage
```bash
ps aux | grep uvicorn
```

---

## 🔐 Security Reminders

1. **Never commit .env to GitHub**
2. **Keep .env permissions secure:** `chmod 600 .env`
3. **Backup before major updates**
4. **Test on staging first if possible**

---

## 📞 Quick Commands Cheatsheet

```bash
# Navigate
cd /home/bariatrices/bariatric-backend

# Backend Control
./start.sh      # Start
./stop.sh       # Stop  
./restart.sh    # Restart
./status.sh     # Check status

# Logs
tail -f logs.txt           # Watch live
tail -100 logs.txt         # Last 100 lines
grep ERROR logs.txt        # Find errors

# Git
cd /home/bariatrices/bariatric-repo
git pull                   # Update code
git status                 # Check changes
git log --oneline -10      # Recent commits
```
