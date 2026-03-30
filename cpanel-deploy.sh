#!/bin/bash

# Bariatric Istanbul - cPanel Deploy Script
# Directory: /home/bariatrices/

set -e

echo "🏥 Bariatric Istanbul - cPanel Deployment"
echo "=========================================="

# Configuration
HOME_DIR="/home/bariatrices"
BACKEND_DIR="$HOME_DIR/bariatric-backend"
FRONTEND_DIR="$HOME_DIR/public_html/bariatric"

# Get user inputs
echo ""
read -p "Enter your domain (e.g., bariatricistanbul.com): " DOMAIN
read -p "Enter MongoDB Atlas URL (mongodb+srv://...): " MONGO_URL
read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)

echo ""
echo "📁 Creating directories..."
mkdir -p "$BACKEND_DIR"
mkdir -p "$FRONTEND_DIR"

# ============================================
# BACKEND SETUP
# ============================================
echo ""
echo "🐍 Setting up Backend..."
cd "$BACKEND_DIR"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install fastapi uvicorn motor pydantic python-dotenv bcrypt PyJWT python-multipart email-validator

# Create requirements.txt
pip freeze > requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL="${MONGO_URL}"
DB_NAME="bariatric_istanbul"
CORS_ORIGINS="https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN}"
JWT_SECRET="${JWT_SECRET}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
EOF

echo "✅ Backend .env created"

# Create passenger_wsgi.py for cPanel
cat > passenger_wsgi.py << 'EOF'
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from server import app
application = app
EOF

echo "✅ passenger_wsgi.py created"

# Create startup script for manual run
cat > start.sh << 'EOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
EOF
chmod +x start.sh

deactivate

# ============================================
# FRONTEND SETUP
# ============================================
echo ""
echo "⚛️ Setting up Frontend..."
cd "$FRONTEND_DIR"

# Create .htaccess for React routing
cat > .htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /bariatric/
    
    # Handle React Router
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /bariatric/index.html [L]
</IfModule>

# Caching
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

# Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
EOF

echo "✅ .htaccess created"

# ============================================
# SET PERMISSIONS
# ============================================
echo ""
echo "🔒 Setting permissions..."
find "$BACKEND_DIR" -type d -exec chmod 755 {} \;
find "$BACKEND_DIR" -type f -exec chmod 644 {} \;
chmod 755 "$BACKEND_DIR/venv/bin/"*
chmod 755 "$BACKEND_DIR/start.sh"
chmod 600 "$BACKEND_DIR/.env"

find "$FRONTEND_DIR" -type d -exec chmod 755 {} \;
find "$FRONTEND_DIR" -type f -exec chmod 644 {} \;

# ============================================
# PRINT INSTRUCTIONS
# ============================================
echo ""
echo "=========================================="
echo "✅ DEPLOYMENT SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "📋 NEXT STEPS:"
echo ""
echo "1️⃣  Upload server.py to: $BACKEND_DIR/"
echo "    (Copy from your local machine or Emergent)"
echo ""
echo "2️⃣  Upload frontend build files to: $FRONTEND_DIR/"
echo "    (Run 'yarn build' locally first, then upload build/* contents)"
echo ""
echo "3️⃣  In cPanel, go to 'Setup Python App':"
echo "    • Python version: 3.11"
echo "    • Application root: bariatric-backend"
echo "    • Application URL: ${DOMAIN}/api or api.${DOMAIN}"
echo "    • Startup file: passenger_wsgi.py"
echo "    • Entry point: application"
echo ""
echo "4️⃣  In Python App, click 'Run pip install' with requirements.txt"
echo ""
echo "5️⃣  Restart the Python application"
echo ""
echo "=========================================="
echo "🔐 ADMIN CREDENTIALS:"
echo "    URL: https://${DOMAIN}/bariatric/admin"
echo "    Email: ${ADMIN_EMAIL}"
echo "    Password: (as entered)"
echo "=========================================="
echo ""
echo "📁 File Locations:"
echo "    Backend: $BACKEND_DIR/"
echo "    Frontend: $FRONTEND_DIR/"
echo "    Backend .env: $BACKEND_DIR/.env"
echo ""
