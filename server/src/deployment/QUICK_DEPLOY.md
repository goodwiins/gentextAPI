# 🚀 DigitalOcean Deployment Guide for IP: 45.55.174.40

## 📋 Prerequisites
- DigitalOcean droplet with IP: `45.55.174.40`
- SSH access to your droplet
- Your OpenRoute API key

## 🔧 Quick Deployment Steps

### 1. Connect to Your Droplet
```bash
ssh root@45.55.174.40
# or if you have a non-root user:
ssh yourusername@45.55.174.40
```

### 2. Clone Your Repository
```bash
cd /opt
git clone https://github.com/yourusername/gentextAPI.git
cd gentextAPI/server
```

### 3. Set Environment Variables
```bash
# Create .env file
cat > .env << EOF
OPENROUTE_API_KEY=your_actual_openroute_api_key_here
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://45.55.174.40,http://45.55.174.40,https://yourdomain.com
DEBUG=False
MAX_THREAD_WORKERS=4
MODEL_DEVICE=cpu
WORKERS=2
EOF
```

### 4. Run Deployment Script
```bash
# Make script executable
chmod +x src/deployment/deploy-digitalocean.sh

# Run deployment
bash src/deployment/deploy-digitalocean.sh
```

### 5. Test Your API
```bash
# Check if API is running
curl http://45.55.174.40:8000/health

# Check API documentation
curl http://45.55.174.40:8000/docs
```

## 🌐 Access Your API

Once deployed, your API will be available at:
- **API Base URL**: `http://45.55.174.40:8000`
- **API Documentation**: `http://45.55.174.40:8000/docs`
- **Health Check**: `http://45.55.174.40:8000/health`

## 🔍 Monitoring Commands

```bash
# Check container status
docker-compose -f src/deployment/docker-compose.production.yml ps

# View logs
docker-compose -f src/deployment/docker-compose.production.yml logs -f

# Restart service
docker-compose -f src/deployment/docker-compose.production.yml restart

# Check resource usage
docker stats
```

## 🚨 Troubleshooting

### If API is not responding:
```bash
# Check if container is running
docker ps

# Check logs for errors
docker-compose logs api

# Restart the service
docker-compose restart api
```

### If you get CORS errors:
```bash
# Update CORS origins in .env file
echo "CORS_ORIGINS=https://45.55.174.40,http://45.55.174.40,https://yourdomain.com" >> .env

# Restart container
docker-compose restart api
```

## 📊 Performance Monitoring

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top

# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s http://45.55.174.40:8000/health
```

## 🔒 Security Checklist

- [ ] Firewall configured (ports 22, 80, 443 open)
- [ ] SSL certificate installed (if using domain)
- [ ] API key secured in environment variables
- [ ] Rate limiting configured in Nginx
- [ ] Regular security updates applied

## 📈 Scaling Options

### If you need more performance:
1. **Upgrade Droplet**: Increase RAM/CPU
2. **Add Load Balancer**: Use DigitalOcean Load Balancer
3. **Multiple Droplets**: Deploy on multiple droplets
4. **CDN**: Use DigitalOcean Spaces for static assets

### Monitoring Setup:
```bash
# Install monitoring tools
apt install htop iotop nethogs

# Set up log rotation
logrotate /etc/logrotate.d/gentext-api
```

## 🎯 Expected Performance

With your current setup:
- **Response Time**: 1-3 seconds for quiz generation
- **Concurrent Users**: 20-50 users
- **Uptime**: 99.9% availability
- **Cost**: $24-48/month

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Test API health: `curl http://45.55.174.40:8000/health`
4. Check resource usage: `htop` and `docker stats`
