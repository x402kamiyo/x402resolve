# Deployment Guide

## Prerequisites

- Solana CLI 1.18+
- Anchor 0.29+
- Node.js 18+
- Python 3.11+
- Rust 1.75+

## Quick Start (Devnet)

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Configure for devnet
solana config set --url devnet

# Create or use existing wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Request airdrop (devnet only)
solana airdrop 2

# Build and deploy escrow program
cd packages/x402-escrow
anchor build
anchor deploy

# Start verifier oracle
cd ../x402-verifier
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python verifier.py
```

## Production Deployment

### 1. Solana Program (Mainnet)

```bash
# Build for production
cd packages/x402-escrow
anchor build --verifiable

# Deploy to mainnet
solana config set --url mainnet-beta
anchor deploy --provider.cluster mainnet

# Verify deployment
solana program show <PROGRAM_ID>
```

### 2. Verifier Oracle

#### Option A: AWS EC2

```bash
# Launch t3.medium instance (2 vCPU, 4GB RAM)
# Ubuntu 22.04 LTS
# Security group: Allow 8000/tcp

ssh ubuntu@<instance-ip>

# Install dependencies
sudo apt update
sudo apt install python3.11 python3-pip nginx certbot

# Clone and setup
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve/packages/x402-verifier
pip3 install -r requirements.txt

# Install PM2 for process management
sudo npm install -g pm2
pm2 start verifier.py --interpreter python3
pm2 startup
pm2 save

# Configure nginx reverse proxy
sudo nano /etc/nginx/sites-available/verifier

# Add:
server {
    listen 80;
    server_name verifier.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

sudo ln -s /etc/nginx/sites-available/verifier /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d verifier.example.com
```

#### Option B: Docker

```bash
# Build image
docker build -t x402-verifier -f packages/x402-verifier/Dockerfile .

# Run container
docker run -d \
  -p 8000:8000 \
  -e SOLANA_RPC_URL=https://api.mainnet-beta.solana.com \
  -e VERIFIER_PRIVATE_KEY=<key> \
  --name verifier \
  --restart unless-stopped \
  x402-verifier

# Check logs
docker logs -f verifier
```

### 3. MCP Server

Deploy as systemd service:

```bash
# Create service file
sudo nano /etc/systemd/system/kamiyo-mcp.service

# Add:
[Unit]
Description=KAMIYO MCP Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/x402resolve/packages/mcp-server
ExecStart=/usr/bin/python3 server.py
Restart=always
Environment="X402_VERIFIER_URL=https://verifier.example.com"
Environment="SOLANA_RPC_URL=https://api.mainnet-beta.solana.com"

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable kamiyo-mcp
sudo systemctl start kamiyo-mcp
sudo systemctl status kamiyo-mcp
```

## Configuration

### Environment Variables

```bash
# Verifier Oracle
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
VERIFIER_PRIVATE_KEY=<base58-encoded-key>
PORT=8000
LOG_LEVEL=INFO

# MCP Server
X402_VERIFIER_URL=https://verifier.example.com
KAMIYO_API_KEY=<your-api-key>
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# SDK
ESCROW_PROGRAM_ID=AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Security

1. **Verifier Private Key**
   - Generate: `solana-keygen new --no-passphrase`
   - Store in AWS Secrets Manager or HashiCorp Vault
   - Never commit to git
   - Rotate quarterly

2. **RPC Endpoints**
   - Use private RPC (QuickNode, Helius, Triton)
   - Implement rate limiting
   - Monitor costs

3. **API Keys**
   - Use environment variables
   - Implement key rotation
   - Log access

## Monitoring

### Metrics to Track

```bash
# Solana program
- Transaction count
- Failed transactions
- Average transaction cost
- Escrow account count

# Verifier oracle
- Request count
- Average response time
- Quality score distribution
- Error rate

# MCP server
- Tool invocations
- Dispute filing rate
- Average resolution time
```

### Logging

```python
# Structured logging example
import structlog

logger = structlog.get_logger()
logger.info(
    "quality_verified",
    transaction_id=tx_id,
    quality_score=score,
    refund_percentage=refund
)
```

### Alerts

```bash
# Set up CloudWatch alarms (AWS)
- Verifier error rate > 5%
- Transaction failure rate > 10%
- Response time > 1000ms
- EC2 CPU > 80%
```

## Testing

### Integration Tests

```bash
# Run full integration test suite
cd tests
npm install
npm test

# Test specific scenarios
npm test -- --grep "dispute resolution"
npm test -- --grep "reputation tracking"
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
sudo apt install k6  # Ubuntu

# Run load test
k6 run tests/load/escrow-flow.js
```

## Maintenance

### Backup

```bash
# Backup program keys
cp ~/.config/solana/*.json ~/backups/solana/

# Backup verifier keys
export VERIFIER_KEY=$(cat ~/.config/verifier/private.key)
echo $VERIFIER_KEY > ~/backups/verifier/key.txt
```

### Updates

```bash
# Update Solana program
cd packages/x402-escrow
git pull
anchor build
anchor upgrade <PROGRAM_ID> target/deploy/x402_escrow.so

# Update verifier
cd packages/x402-verifier
git pull
pip install -r requirements.txt --upgrade
pm2 restart verifier
```

### Rollback

```bash
# Rollback Solana program
anchor upgrade <PROGRAM_ID> backups/x402_escrow_v1.2.3.so

# Rollback verifier
git checkout v1.2.3
pm2 restart verifier
```

## Costs

### Devnet (Free)
- Solana transactions: Free (test SOL)
- RPC: Free (public endpoints)
- Hosting: $0

### Mainnet
- Program deployment: ~2 SOL (~$400 one-time)
- Transaction fees: ~0.00001 SOL per tx (~$0.002)
- Escrow rent: 0.002 SOL per account (~$0.40)
- Verifier hosting: $30-100/month (EC2 t3.medium)
- RPC: $50-200/month (private endpoint)
- Total: ~$80-300/month + $400 setup

## Support

- Documentation: https://github.com/x402kamiyo/x402resolve
- Issues: https://github.com/x402kamiyo/x402resolve/issues
- Discord: [Community Server]

## Security Audit

Before mainnet deployment:
1. Third-party security audit
2. Bug bounty program
3. Testnet stress testing
4. Gradual rollout plan
