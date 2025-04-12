#!/bin/bash
set -e

echo "Setting up FastAPI with Nginx..."

# Make scripts executable
chmod +x start_fastapi.sh
chmod +x setup_nginx.sh

# Run Nginx setup
./setup_nginx.sh

# Install systemd service
echo "Installing FastAPI as a systemd service..."
cp fastapi.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable fastapi.service
systemctl start fastapi.service

echo "Setup complete!"
echo "FastAPI is running as a service and Nginx is configured as a reverse proxy."
echo "Your application should be accessible at http://your_server_ip"
echo ""
echo "Check status with: systemctl status fastapi"
echo "View logs with: journalctl -u fastapi -f"
echo ""
echo "Nginx configuration is at: /etc/nginx/sites-available/fastapi_app"
echo "Nginx logs are at: /var/log/nginx/access.log and /var/log/nginx/error.log" 