# Bariatric Istanbul - Deployment Guide

## Project Structure
```
bariatric-istanbul/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   ├── package.json      # Node dependencies
│   └── .env              # Frontend environment variables
└── docker-compose.yml    # Docker deployment (optional)
```

## Prerequisites

- **Server**: Ubuntu 20.04+ or similar Linux distribution
- **Node.js**: v18+ (for building frontend)
- **Python**: 3.11+
- **MongoDB**: 6.0+ (local or MongoDB Atlas)
- **Nginx**: For reverse proxy (recommended)
- **PM2**: For process management (recommended)

---

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2 yarn
```

---

## Step 2: Clone/Upload Project

```bash
# Create project directory
sudo mkdir -p /var/www/bariatric-istanbul
sudo chown $USER:$USER /var/www/bariatric-istanbul
cd /var/www/bariatric-istanbul

# Option A: Clone from Git (if you have a repo)
git clone https://your-repo-url.git .

# Option B: Upload via SCP from your local machine
# scp -r ./backend ./frontend user@your-server:/var/www/bariatric-istanbul/
```

---

## Step 3: Backend Setup

```bash
cd /var/www/bariatric-istanbul/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL="mongodb://localhost:27017"
DB_NAME="bariatric_istanbul"
CORS_ORIGINS="https://yourdomain.com,http://localhost:3000"
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-64-chars"
ADMIN_EMAIL="admin@bariatricistanbul.com"
ADMIN_PASSWORD="your-secure-admin-password"
EOF

# Test backend
uvicorn server:app --host 0.0.0.0 --port 8001
# Press Ctrl+C to stop after confirming it works
```

---

## Step 4: Frontend Setup

```bash
cd /var/www/bariatric-istanbul/frontend

# Install dependencies
yarn install

# Create production .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://yourdomain.com
EOF

# Build for production
yarn build

# The build folder contains the static files to serve
```

---

## Step 5: PM2 Process Manager (Backend)

```bash
cd /var/www/bariatric-istanbul/backend

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bariatric-backend',
    script: 'venv/bin/uvicorn',
    args: 'server:app --host 0.0.0.0 --port 8001',
    cwd: '/var/www/bariatric-istanbul/backend',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

---

## Step 6: Nginx Configuration

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/bariatric-istanbul
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/bariatric-istanbul/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        root /var/www/bariatric-istanbul/frontend/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/bariatric-istanbul /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Step 7: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal with:
sudo certbot renew --dry-run
```

---

## Step 8: Firewall Setup

```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw enable
```

---

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URL | MongoDB connection string | mongodb://localhost:27017 |
| DB_NAME | Database name | bariatric_istanbul |
| CORS_ORIGINS | Allowed origins (comma-separated) | https://yourdomain.com |
| JWT_SECRET | Secret key for JWT tokens | random-64-character-string |
| ADMIN_EMAIL | Admin login email | admin@bariatricistanbul.com |
| ADMIN_PASSWORD | Admin login password | secure-password-here |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_BACKEND_URL | Backend API URL | https://yourdomain.com |

---

## Useful Commands

```bash
# Check backend status
pm2 status
pm2 logs bariatric-backend

# Restart backend
pm2 restart bariatric-backend

# Rebuild frontend after changes
cd /var/www/bariatric-istanbul/frontend
yarn build

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# MongoDB shell
mongosh
use bariatric_istanbul
db.users.find()  # View admin users
```

---

## Updating the Site

```bash
# Pull latest changes (if using Git)
cd /var/www/bariatric-istanbul
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart bariatric-backend

# Update frontend
cd ../frontend
yarn install
yarn build
```

---

## Troubleshooting

### Backend not starting
```bash
cd /var/www/bariatric-istanbul/backend
source venv/bin/activate
python -c "import server"  # Check for import errors
```

### MongoDB connection issues
```bash
sudo systemctl status mongod
mongosh --eval "db.adminCommand('ping')"
```

### Nginx 502 Bad Gateway
```bash
# Check if backend is running
curl http://localhost:8001/api/
pm2 logs bariatric-backend
```

### CORS errors
- Ensure `CORS_ORIGINS` in backend .env includes your frontend domain
- Restart backend after changing .env: `pm2 restart bariatric-backend`

---

## Admin Panel Access

After deployment:
- URL: `https://yourdomain.com/admin`
- Email: (as set in ADMIN_EMAIL)
- Password: (as set in ADMIN_PASSWORD)

---

## CRM Integration

The lead form posts to: `https://crm.bariatricistanbul.com/action/addLeads`

To change this, edit `/var/www/bariatric-istanbul/frontend/src/App.js`:
```javascript
const CRM_ENDPOINT = "https://your-crm-endpoint.com/api/leads";
```
Then rebuild: `yarn build`
