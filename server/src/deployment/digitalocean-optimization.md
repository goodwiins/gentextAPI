# DigitalOcean Performance Optimization Guide

## 🚀 Droplet Configuration Recommendations

### Minimum Requirements
- **RAM**: 4GB (for ML models + FastAPI)
- **CPU**: 2 vCPUs (for concurrent processing)
- **Storage**: 80GB SSD (for models + logs)
- **Cost**: ~$24/month

### Recommended Production Setup
- **RAM**: 8GB (better performance, more concurrent users)
- **CPU**: 4 vCPUs (handles ML inference better)
- **Storage**: 160GB SSD (room for growth)
- **Cost**: ~$48/month

### High-Performance Setup
- **RAM**: 16GB (enterprise-grade performance)
- **CPU**: 6 vCPUs (maximum ML throughput)
- **Storage**: 320GB SSD (extensive model caching)
- **Cost**: ~$96/month

## 🔧 Environment Optimizations

### 1. CPU-Optimized PyTorch
```bash
# Install CPU-optimized PyTorch
pip install torch==2.2.1+cpu torchvision==0.17.1+cpu torchaudio==2.2.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu
```

### 2. Model Caching
```bash
# Pre-download models to avoid cold starts
export TRANSFORMERS_CACHE=/app/.cache/transformers
export HF_HOME=/app/.cache/huggingface
```

### 3. Memory Management
```python
# In your FastAPI app
import gc
import torch

# Clear GPU cache if using GPU
if torch.cuda.is_available():
    torch.cuda.empty_cache()

# Force garbage collection after heavy operations
gc.collect()
```

## 📈 Monitoring & Scaling

### 1. Health Checks
```yaml
# Docker health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### 2. Resource Limits
```yaml
# Docker resource limits
deploy:
  resources:
    limits:
      memory: 3G  # Leave 1GB for system
    reservations:
      memory: 2G
```

### 3. Load Balancing (for multiple droplets)
```nginx
upstream gentext_backend {
    server droplet1.yourdomain.com:8000;
    server droplet2.yourdomain.com:8000;
    server droplet3.yourdomain.com:8000;
}

server {
    location / {
        proxy_pass http://gentext_backend;
    }
}
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
```bash
# UFW firewall rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 8000/tcp   # Block direct API access
```

### 2. Rate Limiting
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

### 3. SSL/TLS
```bash
# Let's Encrypt SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 💰 Cost Optimization

### 1. Reserved Instances
- **1-year commitment**: 20% discount
- **3-year commitment**: 40% discount

### 2. Monitoring Usage
```bash
# Monitor resource usage
htop
docker stats
df -h
free -h
```

### 3. Auto-scaling Triggers
```bash
# Scale up when CPU > 80%
# Scale down when CPU < 30%
# Use DigitalOcean Load Balancer + App Platform
```

## 🚨 Troubleshooting

### Common Issues:

1. **Out of Memory**
   ```bash
   # Check memory usage
   free -h
   # Restart container
   docker-compose restart api
   ```

2. **Slow Model Loading**
   ```bash
   # Pre-warm models
   curl http://localhost:8000/warmup
   ```

3. **High CPU Usage**
   ```bash
   # Check processes
   top
   # Optimize worker count
   export WORKERS=2  # Match vCPU count
   ```

## 📊 Performance Metrics

### Target Performance:
- **Response Time**: < 2 seconds for quiz generation
- **Concurrent Users**: 50+ users on 4GB droplet
- **Uptime**: 99.9% availability
- **Memory Usage**: < 80% of allocated RAM

### Monitoring Commands:
```bash
# Check API health
curl http://localhost:8000/health

# Monitor logs
docker-compose logs -f api

# Check resource usage
docker stats gentext-api-prod
```
