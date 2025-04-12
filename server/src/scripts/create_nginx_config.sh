#!/bin/bash
# Create Nginx config file
cat > /tmp/fastapi_app << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /root/gentextAPI/static;
        expires 1d;
    }
}
EOF

# Move config to Nginx folder
sudo mv /tmp/fastapi_app /etc/nginx/sites-available/

# Create symlink
sudo ln -sf /etc/nginx/sites-available/fastapi_app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx 