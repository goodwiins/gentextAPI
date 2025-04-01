#!/bin/bash
set -e

# Update and install Nginx
apt-get update
apt-get install -y nginx

# Create a new Nginx configuration for the FastAPI app
cat > /etc/nginx/sites-available/fastapi_app << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain if available

    location / {
        proxy_pass http://127.0.0.1:8000;  # Forward to FastAPI running on port 8000
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /root/gentextAPI/static;  # Update this path to your static files location
        expires 1d;
    }
}
EOF

# Enable the site by creating a symbolic link
ln -sf /etc/nginx/sites-available/fastapi_app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site if exists

# Test Nginx configuration
nginx -t

# Restart Nginx to apply changes
systemctl restart nginx
systemctl enable nginx

echo "Nginx has been configured as a reverse proxy for your FastAPI application."
echo "Your FastAPI app should be running on port 8000 (uvicorn)."
echo "Access your application via http://your_server_ip/" 