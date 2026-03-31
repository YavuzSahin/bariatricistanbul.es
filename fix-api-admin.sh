#!/bin/bash

# Fix for Bariatric Istanbul - API & Admin Not Working
# Run this on your server

echo "🔧 Fixing API & Admin Issues..."
echo ""

HOME_DIR="/home/bariatrices"
BACKEND_DIR="$HOME_DIR/bariatric-backend"
FRONTEND_DIR="$HOME_DIR/public_html"

# Get domain
read -p "Enter your domain (e.g., bariatricistanbul.com): " DOMAIN

echo ""
echo "=========================================="
echo "The problem: cPanel doesn't support API proxy"
echo "Solution: Use subdomain api.${DOMAIN} for backend"
echo "=========================================="
echo ""

# ============================================
# STEP 1: Update .htaccess (remove broken proxy)
# ============================================
echo "📝 Updating .htaccess..."

cat > "$FRONTEND_DIR/.htaccess" << 'EOF'
RewriteEngine On

# Handle React Router - serve index.html for all non-file routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
EOF

echo "✅ .htaccess updated"

# ============================================
# STEP 2: Update Backend CORS
# ============================================
echo ""
echo "📝 Updating backend .env CORS..."

# Update CORS in backend .env
if [ -f "$BACKEND_DIR/.env" ]; then
    # Backup
    cp "$BACKEND_DIR/.env" "$BACKEND_DIR/.env.backup"
    
    # Update CORS line
    sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=\"https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN},https://api.${DOMAIN}\"|" "$BACKEND_DIR/.env"
    
    echo "✅ Backend CORS updated"
else
    echo "⚠️  Backend .env not found at $BACKEND_DIR/.env"
fi

# ============================================
# STEP 3: Update Backend to listen on 0.0.0.0
# ============================================
echo ""
echo "📝 Updating backend start script..."

cat > "$BACKEND_DIR/start.sh" << EOF
#!/bin/bash
cd $BACKEND_DIR
source venv/bin/activate
# Listen on all interfaces so subdomain can reach it
nohup uvicorn server:app --host 0.0.0.0 --port 8001 > logs.txt 2>&1 &
echo \$! > pid.txt
echo "✅ Backend started on port 8001 (PID: \$(cat pid.txt))"
echo "🌐 API URL: https://api.${DOMAIN}/api/"
EOF
chmod +x "$BACKEND_DIR/start.sh"

echo "✅ start.sh updated"

# ============================================
# STEP 4: Restart Backend
# ============================================
echo ""
echo "🔄 Restarting backend..."
cd "$BACKEND_DIR"
./stop.sh 2>/dev/null
sleep 2
./start.sh

# ============================================
# INSTRUCTIONS
# ============================================
echo ""
echo "=========================================="
echo "✅ SERVER CONFIGURATION DONE!"
echo "=========================================="
echo ""
echo "🚨 NOW YOU NEED TO DO THESE IN cPanel:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP A: Create API Subdomain"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Login to cPanel"
echo "2. Go to 'Subdomains'"
echo "3. Create subdomain: api"
echo "   - Subdomain: api"
echo "   - Domain: ${DOMAIN}"
echo "   - Document Root: /home/bariatrices/api_proxy"
echo "4. Click 'Create'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP B: Create API Proxy Folder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Run this command:"
echo ""
echo "mkdir -p /home/bariatrices/api_proxy"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP C: Rebuild Frontend with new API URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "On your LOCAL machine:"
echo ""
echo "cd frontend/"
echo "echo 'REACT_APP_BACKEND_URL=https://api.${DOMAIN}' > .env"
echo "npm run build"
echo ""
echo "Then upload build/* to /home/bariatrices/public_html/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 After completing above steps:"
echo "   Website: https://${DOMAIN}/"
echo "   Admin:   https://${DOMAIN}/admin"
echo "   API:     https://api.${DOMAIN}/api/"
echo ""
