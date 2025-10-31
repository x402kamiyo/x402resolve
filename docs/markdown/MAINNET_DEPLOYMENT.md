# Mainnet Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying X402 Resolve to Solana Mainnet. Follow these steps carefully to ensure secure, production-ready deployment.

---

## Prerequisites

### Required Tools
```bash
# Solana CLI (v1.18.0+)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor CLI (v0.30.0+)
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 anchor-cli

# Node.js & npm (v18.0.0+)
nvm install 18
nvm use 18

# Rust & Cargo (v1.75.0+)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Required Accounts
- Solana wallet with sufficient SOL for deployment (~5-10 SOL recommended)
- Admin keypair for program authority
- Deployer keypair (can be same as admin)

---

## Step 1: Security Audit

**CRITICAL:** Before mainnet deployment, complete professional security audit.

### Recommended Auditors
1. **Trail of Bits** - https://www.trailofbits.com/
   - Cost: $15K-30K
   - Duration: 2-3 weeks
   - Speciality: Smart contract security

2. **Kudelski Security** - https://kudelskisecurity.com/
   - Cost: $12K-25K
   - Duration: 2-4 weeks
   - Speciality: Blockchain security

3. **OtterSec** - https://osec.io/
   - Cost: $10K-20K
   - Duration: 1-2 weeks
   - Speciality: Solana-specific audits

### Audit Checklist
- [ ] Reentrancy protection verified
- [ ] Integer overflow/underflow checks
- [ ] Access control validation
- [ ] Oracle collusion resistance tested
- [ ] Economic security model reviewed
- [ ] Slashing mechanism validated
- [ ] Emergency pause functionality tested

---

## Step 2: Prepare Configuration

### Update Program Configuration

Edit `packages/x402-escrow/programs/x402-escrow/src/lib.rs`:

```rust
// Update constants for mainnet
pub const MIN_DISPUTE_AMOUNT: u64 = 10_000;  // 0.00001 SOL minimum
pub const MAX_DISPUTE_AMOUNT: u64 = 1_000_000_000_000;  // 1000 SOL maximum
pub const ASSESSMENT_TIMEOUT: i64 = 172800;  // 48 hours
pub const ORACLE_MINIMUM_STAKE: u64 = 10_000_000_000;  // 10 SOL

// Set admin pubkey (replace with your admin keypair public key)
pub const ADMIN_PUBKEY: &str = "YOUR_ADMIN_PUBKEY_HERE";
```

### Configure SDK for Mainnet

Edit `packages/x402-sdk/src/config.ts`:

```typescript
export const MAINNET_CONFIG = {
  programId: "YOUR_DEPLOYED_PROGRAM_ID",  // Will be generated during deployment
  rpcEndpoint: "https://api.mainnet-beta.solana.com",
  commitment: "confirmed" as Commitment,
  oracleApiEndpoint: "https://api.x402resolve.com/oracle",  // Your oracle API
  verifierApiEndpoint: "https://api.x402resolve.com/verifier",  // Your verifier API
  minStake: 10_000_000_000,  // 10 SOL
  assessmentTimeout: 172800,  // 48 hours
};
```

---

## Step 3: Build Program for Mainnet

### Clean Build
```bash
cd packages/x402-escrow
anchor clean
cargo clean

# Build with optimizations
anchor build --verifiable

# Verify build output
ls -lh target/deploy/x402_escrow.so
# Should be ~40-50KB
```

### Test Locally First
```bash
# Start local validator
solana-test-validator

# Deploy to local validator
anchor deploy --provider.cluster localnet

# Run integration tests
cd ../../tests/integration
npm test

# Stop validator
solana-test-validator --exit
```

---

## Step 4: Deploy to Mainnet

### Configure Solana CLI
```bash
# Set Solana CLI to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Verify configuration
solana config get

# Check deployer wallet balance (need ~5 SOL for deployment)
solana balance

# If insufficient, transfer SOL to deployer wallet
# NEVER use this wallet for anything else after deployment
```

### Deploy Program
```bash
cd packages/x402-escrow

# Deploy (this costs ~2-5 SOL depending on program size)
anchor deploy --provider.cluster mainnet

# Output will show your program ID:
# Program Id: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# CRITICAL: Save this program ID immediately
echo "YOUR_PROGRAM_ID" > .mainnet-program-id

# Verify deployment
solana program show YOUR_PROGRAM_ID
```

### Initialize Program State
```bash
# Create initialize instruction transaction
anchor run initialize --provider.cluster mainnet

# Verify state account created
solana account YOUR_STATE_ACCOUNT_ADDRESS
```

---

## Step 5: Deploy Oracle & Verifier Infrastructure

### Oracle API Setup

1. **Provision Cloud Infrastructure**
```bash
# Example: AWS EC2 t3.medium instance
# - 2 vCPUs
# - 4GB RAM
# - 50GB SSD storage
# - Ubuntu 22.04 LTS

# Or use managed services:
# - AWS ECS/Fargate
# - Google Cloud Run
# - DigitalOcean App Platform
```

2. **Deploy Multi-Oracle System**
```bash
# SSH into server
ssh ubuntu@your-server-ip

# Clone repository
git clone https://github.com/yourusername/x402resolve.git
cd x402resolve/packages/x402-verifier

# Install dependencies
pip3 install -r requirements.txt

# Configure environment
cp .env.example .env
vim .env

# Set in .env:
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
ORACLE_KEYPAIR_PATH=/path/to/oracle-keypair.json
MIN_STAKE=10000000000
API_PORT=8001

# Run with systemd for auto-restart
sudo cp multi-oracle.service /etc/systemd/system/
sudo systemctl enable multi-oracle
sudo systemctl start multi-oracle

# Verify running
curl http://localhost:8001/
```

3. **Configure Reverse Proxy (nginx)**
```nginx
server {
    listen 80;
    server_name api.x402resolve.com;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **Setup SSL Certificate**
```bash
sudo certbot --nginx -d api.x402resolve.com
```

### Verifier API Setup

1. **Deploy Verifier Service**
```bash
cd packages/x402-verifier

# Install dependencies (may require large instance for ML models)
pip3 install -r requirements.txt

# Configure
cp .env.example .env
vim .env

# Set in .env:
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2
API_PORT=8002

# Run with systemd
sudo cp verifier.service /etc/systemd/system/
sudo systemctl enable verifier
sudo systemctl start verifier
```

---

## Step 6: Register Initial Oracles

### Founder Oracles (High Reputation)

```bash
# Generate oracle keypairs
solana-keygen new --outfile oracle-1-keypair.json
solana-keygen new --outfile oracle-2-keypair.json
solana-keygen new --outfile oracle-3-keypair.json

# Fund each oracle with 10 SOL stake + gas fees
solana transfer ORACLE_1_PUBKEY 10.1 --from deployer-keypair.json
solana transfer ORACLE_2_PUBKEY 10.1 --from deployer-keypair.json
solana transfer ORACLE_3_PUBKEY 10.1 --from deployer-keypair.json

# Register oracles via API
curl -X POST https://api.x402resolve.com/register-oracle \
  -H "Content-Type: application/json" \
  -d '{
    "pubkey": "ORACLE_1_PUBKEY",
    "stake": 10.0,
    "signature": "ORACLE_1_SIGNATURE"
  }'

# Repeat for all initial oracles
```

---

## Step 7: Deploy Frontend Demo

### GitHub Pages Deployment (Free)

```bash
# Already configured in .github/workflows/deploy-demo.yml
# Simply push to main branch:

git add demo/
git commit -m "Deploy production demo to GitHub Pages"
git push origin main

# Demo will be live at: https://yourusername.github.io/x402resolve/
```

### Custom Domain Setup

1. **Configure Custom Domain**
```bash
# In GitHub repository settings:
# Pages > Custom domain > api.x402resolve.com

# Add CNAME record in DNS:
# Type: CNAME
# Name: www
# Value: yourusername.github.io
# TTL: 3600
```

2. **Update Demo Configuration**
```html
<!-- In demo/index.html -->
<script>
  const SOLANA_PROGRAM_ID = 'YOUR_MAINNET_PROGRAM_ID';
  const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
  const ORACLE_API_URL = 'https://api.x402resolve.com';
</script>
```

---

## Step 8: Monitoring & Alerting

### Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'x402-oracle'
    static_configs:
      - targets: ['localhost:8001']

  - job_name: 'x402-verifier'
    static_configs:
      - targets: ['localhost:8002']
```

### Grafana Dashboards

Key metrics to monitor:
- Dispute creation rate (disputes/hour)
- Oracle response time (median, p95, p99)
- Consensus success rate
- Slashing events
- API error rate
- Program transaction success rate

### PagerDuty Alerts

Configure alerts for:
- All oracles offline (>5 minutes)
- API error rate >5%
- Program transaction failure rate >10%
- Oracle slashing event
- Emergency pause triggered

---

## Step 9: Database & Backups

### PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE x402resolve;

-- Create tables
CREATE TABLE disputes (
    id UUID PRIMARY KEY,
    provider_pubkey VARCHAR(44),
    consumer_pubkey VARCHAR(44),
    amount BIGINT,
    status VARCHAR(20),
    created_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE assessments (
    id UUID PRIMARY KEY,
    dispute_id UUID REFERENCES disputes(id),
    oracle_pubkey VARCHAR(44),
    quality_score INT,
    submitted_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created ON disputes(created_at DESC);
```

### Automated Backups

```bash
# Hourly database backups
0 * * * * pg_dump x402resolve | gzip > /backups/x402resolve-$(date +\%Y\%m\%d-\%H00).sql.gz

# Daily off-site backup to S3
0 2 * * * aws s3 sync /backups/ s3://x402resolve-backups/database/

# Blockchain data archive (weekly full sync)
0 3 * * 0 solana-archiver snapshot --output /backups/solana-snapshot-$(date +\%Y\%m\%d).tar.gz
```

---

## Step 10: Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Rate limiting
sudo ufw limit 22/tcp
```

### Secrets Management

```bash
# Use AWS Secrets Manager or HashiCorp Vault
# Never store keypairs in plain text

# Example: AWS Secrets Manager
aws secretsmanager create-secret \
  --name x402-oracle-1-keypair \
  --secret-string file://oracle-1-keypair.json

# Retrieve in application
aws secretsmanager get-secret-value \
  --secret-id x402-oracle-1-keypair \
  --query SecretString \
  --output text > /tmp/oracle-keypair.json
```

### Key Rotation

```bash
# Rotate admin keys every 90 days
# Use multi-sig for admin operations
# Implement time-locked upgrades (7-day delay)
```

---

## Step 11: Legal & Compliance

### Terms of Service

Deploy terms.x402resolve.com with:
- Service description
- User obligations
- Provider obligations
- Dispute resolution process
- Liability limitations
- Data privacy policy

### GDPR Compliance

- [ ] Privacy policy published
- [ ] Data retention policy (90 days)
- [ ] User data export functionality
- [ ] Right to be forgotten implementation

### Oracle Agreements

Legal contracts with all oracles covering:
- Stake requirements
- Slashing conditions
- Liability limitations
- Confidentiality obligations

---

## Step 12: Post-Deployment Verification

### Health Checks

```bash
# Program deployed and initialized
solana program show YOUR_PROGRAM_ID

# Oracles registered and active
curl https://api.x402resolve.com/oracles

# API endpoints responding
curl https://api.x402resolve.com/
curl https://api.x402resolve.com/simulate?transaction_value=1.5

# Demo site accessible
curl -I https://x402resolve.com

# Database connected
psql -h localhost -U x402resolve -c "SELECT COUNT(*) FROM disputes;"
```

### Smoke Tests

```bash
# Create test escrow on mainnet with minimal amount
npm run smoke-test:mainnet

# Expected: Escrow created, oracle selected, assessment submitted, resolved

# Verify transaction on Solana Explorer
https://explorer.solana.com/tx/YOUR_TX_SIGNATURE
```

---

## Step 13: Go-Live Checklist

- [ ] Security audit completed and all issues resolved
- [ ] Program deployed to mainnet and initialized
- [ ] Oracle infrastructure running with 5+ active oracles
- [ ] Verifier API deployed and accessible
- [ ] Demo site deployed with mainnet configuration
- [ ] Database setup with automated backups
- [ ] Monitoring and alerting configured
- [ ] Firewall rules applied
- [ ] SSL certificates installed
- [ ] Terms of service published
- [ ] Privacy policy published
- [ ] Oracle agreements signed
- [ ] Smoke tests passing
- [ ] Support email/Discord configured
- [ ] Documentation published
- [ ] Marketing website live

---

## Step 14: Oracle Recruitment

### Public Oracle Registration

Create registration page at oracles.x402resolve.com:

**Requirements:**
- 10 SOL minimum stake
- Server infrastructure (2 vCPU, 4GB RAM)
- 99% uptime commitment
- Sign oracle agreement

**Economics:**
- Fee earning: 0.0001-0.01 SOL per assessment
- Expected volume: 100-1000 assessments/month per oracle
- Monthly earnings: 0.1-10 SOL ($2-200 at $20/SOL)
- Slashing risk: 10-100% stake for dishonest behavior

### Marketing to Oracles

- Post on Solana Discord
- Post on Solana Reddit
- Tweet from X402 account
- Write blog post: "Earn SOL as an X402 Oracle"
- Contact security firms and auditors

---

## Step 15: User Onboarding

### SDK Integration Guide

```typescript
// Install SDK
npm install @x402/sdk

// Initialize for mainnet
import { EscrowClient } from '@x402/sdk';

const client = new EscrowClient({
  programId: "YOUR_MAINNET_PROGRAM_ID",
  network: "mainnet-beta"
});

// Create escrow
const escrow = await client.createEscrow({
  provider: providerPubkey,
  consumer: consumerPubkey,
  amount: 1.5,  // 1.5 SOL
  metadata: {
    service_type: "api_data",
    expected_quality: 80
  }
});
```

### Marketing Launch

- Product Hunt launch
- Hacker News post
- Solana ecosystem newsletter
- Technical blog post series
- Demo video walkthrough
- Integration case studies

---

## Estimated Timeline

| Phase | Duration | Cost |
|-------|----------|------|
| Security Audit | 2-3 weeks | $10-30K |
| Infrastructure Setup | 3-5 days | $0-500 |
| Program Deployment | 1 day | 5-10 SOL |
| Oracle Recruitment | 1-2 weeks | Marketing effort |
| Testing & Verification | 3-5 days | Minimal |
| Legal Review | 1-2 weeks | $2-5K |
| **Total** | **5-7 weeks** | **$12-36K** |

---

## Ongoing Costs

| Item | Monthly Cost |
|------|--------------|
| Cloud Infrastructure (2x t3.medium) | $100-150 |
| Database Hosting (RDS) | $50-100 |
| Backup Storage (S3) | $10-20 |
| Monitoring (Grafana Cloud) | $0-50 |
| CDN (Cloudflare) | $0-20 |
| Domain + SSL | $2-5 |
| **Total** | **$162-345/month** |

---

## Break-Even Analysis

**Revenue Assumptions:**
- Fee per assessment: 0.001 SOL avg
- Assessments per day: 100 (conservative)
- SOL price: $20

**Monthly Revenue:**
- 100 disputes/day × 30 days × 0.001 SOL × $20 = $60/month

**Note:** Need 500+ disputes/day to cover infrastructure costs. Focus on high-value disputes (>1 SOL) with higher fees.

---

## Emergency Procedures

### If Exploit Detected

1. **Immediate** (0-15 min): Trigger emergency pause via admin keypair
2. **Communication** (15-30 min): Post on website, Twitter, Discord
3. **Investigation** (30 min-4 hours): Determine exploit scope and impact
4. **Fix Development** (1-7 days): Develop, test, audit patch
5. **Deployment** (7-14 days): Deploy fixed program version
6. **Migration** (14-21 days): Migrate user funds to new program
7. **Post-Mortem** (21-30 days): Public incident report

### If Oracle Network Compromised

1. Identify compromised oracles
2. Slash compromised oracle stakes
3. Recruit replacement oracles
4. Increase multi-oracle threshold temporarily
5. Review all recent assessments from compromised oracles
6. Offer refunds to affected consumers

---

## Support Contacts

- **Technical Support:** support@x402resolve.com
- **Security Issues:** security@x402resolve.com (PGP key available)
- **Oracle Inquiries:** oracles@x402resolve.com
- **Discord:** https://discord.gg/x402resolve
- **Emergency Hotline:** +1-XXX-XXX-XXXX (admin team)

---

## Success Metrics (First 90 Days)

- [ ] 20+ registered oracles
- [ ] 1,000+ disputes processed
- [ ] <2% invalid assessment rate
- [ ] 99.5%+ API uptime
- [ ] 0 security incidents
- [ ] 50+ integrated applications
- [ ] $10K+ in fees generated
- [ ] Break-even on infrastructure costs

**Monitor, iterate, scale. Welcome to production!**
