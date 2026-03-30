#!/bin/bash

# Bariatric Istanbul - cPanel Deploy (No Python App)
# Uses nohup to run backend in background

set -e

echo "🏥 Bariatric Istanbul - cPanel Deployment"
echo "=========================================="

# Configuration
HOME_DIR="/home/bariatrices"
BACKEND_DIR="$HOME_DIR/bariatric-backend"
FRONTEND_DIR="$HOME_DIR/public_html/bariatric"
REPO_URL="https://github.com/YOUR_USERNAME/YOUR_REPO.git"  # UPDATE THIS

# Get user inputs
echo ""
read -p "Enter your GitHub repo URL: " REPO_URL
read -p "Enter your domain (e.g., bariatricistanbul.com): " DOMAIN
read -p "Enter backend port (default 8001): " PORT
PORT=${PORT:-8001}

echo ""
echo "📥 Cloning repository..."
cd "$HOME_DIR"

# Clone or pull
if [ -d "bariatric-repo" ]; then
    cd bariatric-repo
    git pull
else
    git clone "$REPO_URL" bariatric-repo
    cd bariatric-repo
fi

# ============================================
# BACKEND SETUP
# ============================================
echo ""
echo "🐍 Setting up Backend..."

# Copy backend files
mkdir -p "$BACKEND_DIR"
cp -r backend/* "$BACKEND_DIR/"
cd "$BACKEND_DIR"

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

deactivate

echo "✅ Backend dependencies installed"

# ============================================
# FRONTEND SETUP  
# ============================================
echo ""
echo "⚛️ Setting up Frontend..."

cd "$HOME_DIR/bariatric-repo/frontend"

# Check if node/npm available
if command -v node &> /dev/null; then
    # Create .env for build
    cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}
EOF
    
    # Install and build
    if command -v yarn &> /dev/null; then
        yarn install
        yarn build
    else
        npm install
        npm run build
    fi
    
    # Copy build to public_html
    mkdir -p "$FRONTEND_DIR"
    rm -rf "$FRONTEND_DIR"/*
    cp -r build/* "$FRONTEND_DIR/"
    
    echo "✅ Frontend built and deployed"
else
    echo "⚠️  Node.js not found. Please build frontend locally and upload to:"
    echo "    $FRONTEND_DIR/"
fi

# ============================================
# CREATE .HTACCESS
# ============================================
echo ""
echo "📝 Creating .htaccess..."

cat > "$FRONTEND_DIR/.htaccess" << 'EOF'
RewriteEngine On

# Redirect API calls to backend
RewriteCond %{REQUEST_URI} ^/api [NC]
RewriteRule ^api/(.*)$ http://127.0.0.1:8001/api/$1 [P,L]

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Caching
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
EOF

# ============================================
# CREATE BACKEND START/STOP SCRIPTS
# ============================================
echo ""
echo "📝 Creating management scripts..."

# Start script
cat > "$BACKEND_DIR/start.sh" << EOF
#!/bin/bash
cd $BACKEND_DIR
source venv/bin/activate
nohup uvicorn server:app --host 127.0.0.1 --port $PORT > logs.txt 2>&1 &
echo \$! > pid.txt
echo "✅ Backend started on port $PORT (PID: \$(cat pid.txt))"
EOF
chmod +x "$BACKEND_DIR/start.sh"

# Stop script
cat > "$BACKEND_DIR/stop.sh" << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
if [ -f pid.txt ]; then
    PID=$(cat pid.txt)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        rm pid.txt
        echo "✅ Backend stopped (PID: $PID)"
    else
        echo "⚠️  Process not running"
        rm pid.txt
    fi
else
    echo "⚠️  No PID file found. Try: pkill -f uvicorn"
fi
EOF
chmod +x "$BACKEND_DIR/stop.sh"

# Restart script
cat > "$BACKEND_DIR/restart.sh" << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
./stop.sh
sleep 2
./start.sh
EOF
chmod +x "$BACKEND_DIR/restart.sh"

# Status script
cat > "$BACKEND_DIR/status.sh" << EOF
#!/bin/bash
cd $BACKEND_DIR
if [ -f pid.txt ]; then
    PID=\$(cat pid.txt)
    if ps -p \$PID > /dev/null 2>&1; then
        echo "✅ Backend running (PID: \$PID) on port $PORT"
        echo "📋 Last logs:"
        tail -5 logs.txt
    else
        echo "❌ Backend not running (stale PID file)"
    fi
else
    echo "❌ Backend not running"
fi
EOF
chmod +x "$BACKEND_DIR/status.sh"

# ============================================
# SET PERMISSIONS
# ============================================
echo ""
echo "🔒 Setting permissions..."
chmod 600 "$BACKEND_DIR/.env"
find "$FRONTEND_DIR" -type d -exec chmod 755 {} \;
find "$FRONTEND_DIR" -type f -exec chmod 644 {} \;

# ============================================
# ADD TO CRONTAB FOR AUTO-START
# ============================================
echo ""
read -p "Add backend to crontab for auto-start on reboot? (y/n): " ADD_CRON
if [ "$ADD_CRON" = "y" ]; then
    (crontab -l 2>/dev/null | grep -v "bariatric-backend/start.sh"; echo "@reboot $BACKEND_DIR/start.sh") | crontab -
    echo "✅ Added to crontab"
fi

# ============================================
# START BACKEND
# ============================================
echo ""
read -p "Start backend now? (y/n): " START_NOW
if [ "$START_NOW" = "y" ]; then
    cd "$BACKEND_DIR"
    ./start.sh
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📁 Locations:"
echo "   Frontend: $FRONTEND_DIR/"
echo "   Backend:  $BACKEND_DIR/"
echo ""
echo "🔧 Backend Commands:"
echo "   Start:   $BACKEND_DIR/start.sh"
echo "   Stop:    $BACKEND_DIR/stop.sh"
echo "   Restart: $BACKEND_DIR/restart.sh"
echo "   Status:  $BACKEND_DIR/status.sh"
echo "   Logs:    tail -f $BACKEND_DIR/logs.txt"
echo ""
echo "🌐 URLs:"
echo "   Website: https://${DOMAIN}/"
echo "   Admin:   https://${DOMAIN}/admin"
echo "   API:     https://${DOMAIN}/api/"
echo ""
echo "⚠️  IMPORTANT: Make sure .env file exists at:"
echo "   $BACKEND_DIR/.env"
echo ""
