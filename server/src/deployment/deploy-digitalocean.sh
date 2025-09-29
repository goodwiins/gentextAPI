#!/bin/bash

# DigitalOcean Deployment Script for GenText API
# Run this script on your DigitalOcean droplet

set -e

echo "🚀 Starting GenText API deployment on DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/gentext-api
sudo chown $USER:$USER /opt/gentext-api
cd /opt/gentext-api

# Clone repository (replace with your repo URL)
echo "📥 Cloning repository..."
if [ ! -d "gentextAPI" ]; then
    git clone https://github.com/yourusername/gentextAPI.git
fi

cd gentextAPI/server

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
OPENROUTE_API_KEY=your_openroute_api_key_here
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DEBUG=False
MAX_THREAD_WORKERS=4
MODEL_DEVICE=cpu
WORKERS=2
EOF

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose -f src/deployment/docker-compose.production.yml up -d --build

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/gentext-api << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/gentext-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL with Let's Encrypt (optional)
echo "🔒 Setting up SSL certificate..."
if command -v certbot &> /dev/null; then
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos --email your-email@example.com
else
    echo "📝 Install certbot to enable SSL: sudo apt install certbot python3-certbot-nginx"
fi

# Setup log rotation
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/gentext-api << EOF
/opt/gentext-api/gentextAPI/server/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        docker-compose -f /opt/gentext-api/gentextAPI/server/src/deployment/docker-compose.production.yml restart api
    endscript
}
EOF

# Setup monitoring script
echo "📊 Setting up monitoring..."
sudo tee /usr/local/bin/gentext-monitor << EOF
#!/bin/bash
# Simple health check script
cd /opt/gentext-api/gentextAPI/server

# Check if container is running
if ! docker-compose -f src/deployment/docker-compose.production.yml ps api | grep -q "Up"; then
    echo "\$(date): API container is down, restarting..." >> /var/log/gentext-monitor.log
    docker-compose -f src/deployment/docker-compose.production.yml restart api
fi

# Check API health
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "\$(date): API health check failed" >> /var/log/gentext-monitor.log
fi
EOF

sudo chmod +x /usr/local/bin/gentext-monitor

# Add to crontab for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/gentext-monitor") | crontab -

echo "✅ Deployment complete!"
echo "🌐 Your API should be available at: http://yourdomain.com"
echo "📊 API docs available at: http://yourdomain.com/docs"
echo "🔍 Check logs with: docker-compose -f src/deployment/docker-compose.production.yml logs -f"
echo "🔄 Restart service with: docker-compose -f src/deployment/docker-compose.production.yml restart"
