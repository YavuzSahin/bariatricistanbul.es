#!/bin/bash

# Quick build script - Run this LOCALLY before uploading to cPanel
# This builds the frontend with your production settings

echo "🏗️ Building Frontend for Production..."

# Set your domain here
DOMAIN="yourdomain.com"

# Create production .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}
EOF

echo "✅ Created .env with REACT_APP_BACKEND_URL=https://${DOMAIN}"

# Install dependencies
yarn install

# Build
yarn build

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Upload the contents of the 'build' folder to:"
echo "   /home/bariatrices/public_html/bariatric/"
echo ""
echo "Files to upload:"
ls -la build/
