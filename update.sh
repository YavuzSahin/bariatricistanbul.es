#!/bin/bash

# ============================================
# Bariatric Istanbul - UPDATE GUIDE
# For updating a RUNNING production website
# ============================================

# Your server paths
HOME_DIR="/home/bariatrices"
REPO_DIR="$HOME_DIR/bariatric-repo"
BACKEND_DIR="$HOME_DIR/bariatric-backend"
FRONTEND_DIR="$HOME_DIR/public_html"

echo "🔄 Bariatric Istanbul - Update Script"
echo "======================================"
echo ""

# ============================================
# STEP 1: Pull Latest Code from GitHub
# ============================================
echo "📥 Step 1: Pulling latest code..."
cd "$REPO_DIR"
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Check your repo."
    exit 1
fi
echo "✅ Code updated"
echo ""

# ============================================
# STEP 2: Update Backend
# ============================================
echo "🐍 Step 2: Updating backend..."

# Copy new backend files (except .env)
cp "$REPO_DIR/backend/server.py" "$BACKEND_DIR/"
cp "$REPO_DIR/backend/requirements.txt" "$BACKEND_DIR/"

# Install any new dependencies
cd "$BACKEND_DIR"
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate

echo "✅ Backend files updated"

# Restart backend
echo "🔄 Restarting backend..."
./stop.sh 2>/dev/null
sleep 2
./start.sh

echo "✅ Backend restarted"
echo ""

# ============================================
# STEP 3: Update Frontend
# ============================================
echo "⚛️ Step 3: Updating frontend..."

cd "$REPO_DIR/frontend"

# Check if Node.js available
if command -v node &> /dev/null; then
    echo "   Installing dependencies..."
    npm install --silent
    
    echo "   Building..."
    npm run build
    
    # Backup current frontend (just in case)
    echo "   Backing up current frontend..."
    mkdir -p "$HOME_DIR/backups"
    tar -czf "$HOME_DIR/backups/frontend-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$FRONTEND_DIR" . 2>/dev/null
    
    # Copy new build (preserve api folder and .htaccess)
    echo "   Deploying new frontend..."
    rsync -av --exclude='api' --exclude='.htaccess' build/ "$FRONTEND_DIR/"
    
    echo "✅ Frontend updated"
else
    echo "⚠️  Node.js not available on server"
    echo "   Build frontend LOCALLY and upload build/* to $FRONTEND_DIR/"
fi

echo ""

# ============================================
# STEP 4: Verify Everything Works
# ============================================
echo "🧪 Step 4: Verifying..."

# Check backend
cd "$BACKEND_DIR"
./status.sh

# Test API
API_TEST=$(curl -s http://127.0.0.1:8001/api/ 2>&1)
if echo "$API_TEST" | grep -q "Bariatric"; then
    echo "✅ API responding"
else
    echo "❌ API not responding - check logs"
fi

echo ""
echo "======================================"
echo "✅ UPDATE COMPLETE!"
echo "======================================"
echo ""
echo "🌐 Test your website:"
echo "   https://yourdomain.com/"
echo "   https://yourdomain.com/admin"
echo ""
echo "📋 If issues, check:"
echo "   Backend logs: tail -f $BACKEND_DIR/logs.txt"
echo "   Restart: $BACKEND_DIR/restart.sh"
echo ""
