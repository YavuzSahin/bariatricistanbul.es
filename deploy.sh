#!/bin/bash

# Bariatric Istanbul - Quick Deploy Script
# Run this on your server after uploading the project files

set -e

echo "🏥 Bariatric Istanbul - Deployment Script"
echo "=========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please don't run as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., bariatricistanbul.com): " DOMAIN
read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)

echo ""
echo "📦 Installing system dependencies..."
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install yarn and pm2
sudo npm install -g yarn pm2

# Install MongoDB if not present
if ! command -v mongod &> /dev/null; then
    echo "📦 Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

echo ""
echo "🐍 Setting up Backend..."
cd backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="bariatric_istanbul"
CORS_ORIGINS="https://${DOMAIN},https://www.${DOMAIN}"
JWT_SECRET="${JWT_SECRET}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
EOF

deactivate
cd ..

echo ""
echo "⚛️ Building Frontend..."
cd frontend

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}
EOF

yarn install
yarn build
cd ..

echo ""
echo "🚀 Setting up PM2..."
cd backend
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bariatric-backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001',
    cwd: process.cwd(),
    env: { NODE_ENV: 'production' },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
cd ..

echo ""
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/bariatric-istanbul << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        root $(pwd)/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root $(pwd)/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/bariatric-istanbul /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "🔒 Setting up SSL..."
sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${ADMIN_EMAIL}

echo ""
echo "🔥 Configuring Firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo ""
echo "✅ Deployment Complete!"
echo "=========================================="
echo "🌐 Website: https://${DOMAIN}"
echo "🔐 Admin Panel: https://${DOMAIN}/admin"
echo "📧 Admin Email: ${ADMIN_EMAIL}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check backend status"
echo "  pm2 logs bariatric-backend  - View backend logs"
echo "  pm2 restart bariatric-backend - Restart backend"
echo ""
