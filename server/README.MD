# GenTextAPI Server

## Project Structure

```
server/
├── src/
│   ├── api/                 # API routes and FastAPI application
│   │   └── fastapi_app.py   # Main FastAPI application
│   ├── generators/          # Text generation components
│   │   ├── claude_generator.py
│   │   ├── generator_factory.py
│   │   └── improved_generator.py
│   ├── services/            # Business logic services
│   │   ├── paraphraser.py
│   │   ├── qa_formatter.py
│   │   └── text_process.py
│   ├── config/             # Configuration and models
│   │   ├── config.py
│   │   ├── db.py
│   │   └── model.py
│   ├── utils/              # Utility functions
│   ├── tests/              # Test files
│   │   ├── test_api_client.py
│   │   ├── test_claude.py
│   │   ├── test_fastapi.py
│   │   ├── test_models.py
│   │   └── test_qa.py
│   ├── scripts/            # Shell scripts
│   │   ├── check_dependencies.sh
│   │   ├── create_nginx_config.sh
│   │   ├── deploy.sh
│   │   ├── deploy_do.sh
│   │   ├── install_dependencies.sh
│   │   ├── manage.sh
│   │   ├── set_env.sh
│   │   ├── setup_fastapi_nginx.sh
│   │   ├── setup_nginx.sh
│   │   └── start_fastapi.sh
│   └── deployment/         # Deployment configurations
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── fastapi.service
│       ├── gentext-api.service
│       └── nginx.conf
├── main.py                # Application entry point
├── requirements.txt       # Python dependencies
└── README.md             # Project documentation
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   cd server
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   ```bash
   cp src/scripts/set_env.sh.example src/scripts/set_env.sh
   # Edit set_env.sh with your configuration
   ```
4. Start the server:
   ```bash
   python main.py
   ```

## Development

- Add new API endpoints in `src/api/fastapi_app.py`
- Add new generators in `src/generators/`
- Add new services in `src/services/`
- Add new tests in `src/tests/`

## Deployment

Use the scripts in `src/scripts/` for deployment:
- `deploy.sh` - General deployment
- `deploy_do.sh` - DigitalOcean deployment
- `setup_nginx.sh` - NGINX setup
- `manage.sh` - Service management

## Testing

Run tests using:
```bash
python -m pytest src/tests/
```

## Server Setup

### Prerequisites

- Python 3.8+
- NGINX
- Virtual environment

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gentextAPI.git
   cd gentextAPI/server
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp set_env.sh.example set_env.sh
   # Edit set_env.sh with your configuration
   nano set_env.sh
   ```

### Running the API Server

#### Method 1: Manual Start

To start the server manually:
```bash
cd /root/gentextAPI/server
source set_env.sh
./venv/bin/python -m uvicorn fastapi_app:app --host 0.0.0.0 --port 8000
```

#### Method 2: Using Systemd Service (Recommended)

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/gentext-api.service
   ```

2. Add the following content:
   ```
   [Unit]
   Description=GenText API Service
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/root/gentextAPI/server
   ExecStart=/bin/bash -c "source set_env.sh && ./venv/bin/python -m uvicorn fastapi_app:app --host 0.0.0.0 --port 8000"
   Restart=always
   RestartSec=5
   StandardOutput=journal
   StandardError=journal

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable gentext-api.service
   sudo systemctl start gentext-api.service
   ```

4. Check service status:
   ```bash
   sudo systemctl status gentext-api.service
   ```

### NGINX Configuration

1. Create an NGINX configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/fastapi_app
   ```

2. Add the following configuration:
   ```
   server {
       listen 80;
       server_name your_domain_or_ip;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. Enable the site and restart NGINX:
   ```bash
   sudo ln -s /etc/nginx/sites-available/fastapi_app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## API Usage

The API provides several endpoints:

- `/health` - Check API health status
- `/docs` - API documentation (Swagger UI)
- `/redoc` - API documentation (ReDoc)
- `/generate/qa` - Generate Q&A pairs from text
- `/generate/statements` - Generate false statements
- `/generate/batch` - Process multiple sentences in batch

## Management Commands

- **Start service**: `sudo systemctl start gentext-api.service`
- **Stop service**: `sudo systemctl stop gentext-api.service`
- **Restart service**: `sudo systemctl restart gentext-api.service`
- **Check status**: `sudo systemctl status gentext-api.service`
- **View logs**: `sudo journalctl -u gentext-api.service -f`

## Troubleshooting

### Common Issues

1. **API Not Accessible**:
   - Check if the service is running: `sudo systemctl status gentext-api.service`
   - Verify NGINX configuration: `sudo nginx -t`
   - Check NGINX logs: `sudo tail -f /var/log/nginx/error.log`

2. **Connection Errors**:
   - Ensure port 8000 is not blocked by firewall
   - Verify the correct server IP/domain in frontend configuration
   - Check CORS settings in the FastAPI application

3. **Model Loading Errors**:
   - Verify Python dependencies are correctly installed
   - Check disk space for model storage

## License

