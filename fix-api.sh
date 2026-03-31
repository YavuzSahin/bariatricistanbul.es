#!/bin/bash

# Quick Fix for API & Admin - Bariatric Istanbul
# This creates a PHP proxy since cPanel doesn't support mod_proxy

echo "🔧 Fixing API & Admin (PHP Proxy Method)"
echo ""

HOME_DIR="/home/bariatrices"
PUBLIC_HTML="$HOME_DIR/public_html"
BACKEND_DIR="$HOME_DIR/bariatric-backend"

# ============================================
# STEP 1: Create API folder with PHP proxy
# ============================================
echo "📁 Creating API proxy..."

mkdir -p "$PUBLIC_HTML/api"

cat > "$PUBLIC_HTML/api/index.php" << 'PHPEOF'
<?php
// API Proxy - forwards requests to Python backend on port 8001
$BACKEND = 'http://127.0.0.1:8001';

$uri = $_SERVER['REQUEST_URI'];
$path = preg_replace('/^\/api/', '', $uri);
if (empty($path) || $path === '/') $path = '/api/';
elseif (strpos($path, '/api') !== 0) $path = '/api' . $path;

$url = $BACKEND . $path;
$ch = curl_init($url);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Forward headers
$headers = [];
foreach (getallheaders() as $k => $v) {
    if (!in_array(strtolower($k), ['host', 'content-length'])) {
        $headers[] = "$k: $v";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Method & Body
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

// Cookies
if (!empty($_COOKIE)) {
    $c = '';
    foreach ($_COOKIE as $k => $v) $c .= "$k=$v; ";
    curl_setopt($ch, CURLOPT_COOKIE, rtrim($c, '; '));
}

// Capture response cookies
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $h) {
    if (stripos($h, 'set-cookie:') === 0) {
        header($h, false);
    }
    return strlen($h);
});

$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    http_response_code(502);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Backend unavailable: ' . $err]));
}

http_response_code($code);
if ($type) header("Content-Type: $type");

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($method === 'OPTIONS') { http_response_code(200); exit; }

echo $response;
PHPEOF

echo "✅ PHP proxy created at $PUBLIC_HTML/api/index.php"

# ============================================
# STEP 2: Create .htaccess for API folder
# ============================================
cat > "$PUBLIC_HTML/api/.htaccess" << 'EOF'
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [L,QSA]
EOF

echo "✅ API .htaccess created"

# ============================================
# STEP 3: Update main .htaccess
# ============================================
echo "📝 Updating main .htaccess..."

cat > "$PUBLIC_HTML/.htaccess" << 'EOF'
RewriteEngine On

# Let /api folder handle API requests
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^ - [L]

# React Router - serve index.html for all other routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static files
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

echo "✅ Main .htaccess updated"

# ============================================
# STEP 4: Ensure backend is running
# ============================================
echo ""
echo "🔄 Checking backend..."

cd "$BACKEND_DIR"
if [ -f "status.sh" ]; then
    ./status.sh
else
    echo "⚠️  Backend scripts not found. Creating..."
    
    cat > start.sh << 'STARTEOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
source venv/bin/activate
nohup uvicorn server:app --host 127.0.0.1 --port 8001 > logs.txt 2>&1 &
echo $! > pid.txt
echo "✅ Backend started (PID: $(cat pid.txt))"
STARTEOF
    chmod +x start.sh
    
    cat > stop.sh << 'STOPEOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
[ -f pid.txt ] && kill $(cat pid.txt) 2>/dev/null && rm -f pid.txt
echo "✅ Stopped"
STOPEOF
    chmod +x stop.sh
    
    cat > status.sh << 'STATUSEOF'
#!/bin/bash
cd /home/bariatrices/bariatric-backend
if [ -f pid.txt ] && ps -p $(cat pid.txt) > /dev/null 2>&1; then
    echo "✅ Backend RUNNING (PID: $(cat pid.txt))"
else
    echo "❌ Backend NOT RUNNING"
fi
STATUSEOF
    chmod +x status.sh
fi

# Start if not running
if [ -f pid.txt ] && ps -p $(cat pid.txt) > /dev/null 2>&1; then
    echo "✅ Backend already running"
else
    echo "🚀 Starting backend..."
    ./start.sh
fi

# ============================================
# STEP 5: Test API
# ============================================
echo ""
echo "🧪 Testing API..."
sleep 2

RESULT=$(curl -s http://127.0.0.1:8001/api/ 2>&1)
if echo "$RESULT" | grep -q "Bariatric"; then
    echo "✅ Backend API working!"
else
    echo "❌ Backend API not responding"
    echo "   Check logs: tail -f $BACKEND_DIR/logs.txt"
fi

# ============================================
# DONE
# ============================================
echo ""
echo "=========================================="
echo "✅ FIX COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Test these URLs:"
echo "   Website: https://yourdomain.com/"
echo "   Admin:   https://yourdomain.com/admin"
echo "   API:     https://yourdomain.com/api/"
echo ""
echo "📋 If admin login fails, check:"
echo "   1. Backend running: cd $BACKEND_DIR && ./status.sh"
echo "   2. Backend logs: tail -f $BACKEND_DIR/logs.txt"
echo "   3. .env has correct ADMIN_EMAIL and ADMIN_PASSWORD"
echo ""
echo "🔧 Commands:"
echo "   Start:   $BACKEND_DIR/start.sh"
echo "   Stop:    $BACKEND_DIR/stop.sh"
echo "   Status:  $BACKEND_DIR/status.sh"
echo "   Logs:    tail -f $BACKEND_DIR/logs.txt"
echo ""
