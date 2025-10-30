# Deployment Guide

Step-by-step guide for deploying x402Resolve to Solana devnet/mainnet.

## Prerequisites

- Node.js 18+
- Python 3.9+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31+

## Installation

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

### 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version
```

### 3. Install Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
anchor --version
```

## Configuration

### 1. Configure Solana CLI

```bash
# For devnet
solana config set --url devnet

# For mainnet (production)
solana config set --url mainnet-beta
```

### 2. Generate Keypair

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/id.json

# View public key
solana address
```

### 3. Fund Wallet (Devnet)

```bash
# Airdrop 2 SOL on devnet
solana airdrop 2

# Check balance
solana balance
```

## Deploying Escrow Program

### 1. Build Program

```bash
cd packages/x402-escrow
anchor build
```

### 2. Get Program ID

```bash
solana address -k target/deploy/x402_escrow-keypair.json
```

**Example Output:**
```
X402Esc11111111111111111111111111111111111
```

### 3. Update Program ID

Update the program ID in two locations:

**File: `programs/x402-escrow/src/lib.rs`**
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**File: `Anchor.toml`**
```toml
[programs.devnet]
x402_escrow = "YOUR_PROGRAM_ID_HERE"
```

### 4. Rebuild Program

```bash
anchor build
```

### 5. Deploy to Devnet

```bash
anchor deploy
```

**Expected Output:**
```
Deploying cluster: https://api.devnet.solana.com
Upgrade authority: /home/user/.config/solana/id.json
Deploying program "x402_escrow"...
Program Id: X402Esc11111111111111111111111111111111111

Deploy success
```

### 6. Verify Deployment

```bash
# Verify program matches source
anchor verify <PROGRAM_ID>

# View on Solana Explorer
# https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
```

## Deploying Verifier Oracle

### 1. Install Python Dependencies

```bash
cd packages/x402-verifier
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```bash
# Verifier Oracle Configuration
VERIFIER_PORT=8000
VERIFIER_HOST=0.0.0.0

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
ESCROW_PROGRAM_ID=<YOUR_PROGRAM_ID>

# Security (production only)
VERIFIER_PRIVATE_KEY=<your_ed25519_private_key>
```

### 3. Run Verifier

```bash
python verifier.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4. Test Verifier

```bash
curl http://localhost:8000/
```

## Running Tests

### Anchor Tests

```bash
cd packages/x402-escrow
anchor test
```

### Python Tests

```bash
cd packages/x402-verifier
pytest tests/ -v
```

### SDK Tests

```bash
cd packages/x402-sdk
npm install
npm test
```

## Environment Variables

### Escrow Program

No environment variables required (on-chain program).

### Verifier Oracle

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VERIFIER_PORT` | Port for FastAPI server | No | 8000 |
| `VERIFIER_HOST` | Host binding | No | 0.0.0.0 |
| `SOLANA_RPC_URL` | Solana RPC endpoint | Yes | - |
| `ESCROW_PROGRAM_ID` | Deployed escrow program ID | Yes | - |
| `VERIFIER_PRIVATE_KEY` | Ed25519 signing key | Production only | Generated |

### SDK

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | Yes | - |
| `X402_VERIFIER_URL` | Verifier oracle URL | Yes | - |
| `ESCROW_PROGRAM_ID` | Escrow program ID | Yes | - |

## Troubleshooting

### Error: "Insufficient funds"

**Solution:** Airdrop more SOL
```bash
solana airdrop 2
```

### Error: "Program X already deployed"

**Solution:** Use upgrade authority
```bash
anchor upgrade target/deploy/x402_escrow.so --program-id <PROGRAM_ID>
```

### Error: "Anchor version mismatch"

**Solution:** Match Anchor version
```bash
avm install 0.31.1
avm use 0.31.1
```

### Error: "RPC request failed"

**Solution:** Check network connectivity
```bash
# Test RPC endpoint
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1, "method":"getHealth"}'
```

### Error: "Program deployment failed"

**Solution:** Increase compute budget
```bash
solana config set --commitment confirmed
```

## Production Deployment

### Additional Steps for Mainnet

1. **Audit Program**
   - Complete security audit
   - Review all test results
   - Verify compute unit usage

2. **Update Configuration**
   ```bash
   solana config set --url mainnet-beta
   ```

3. **Fund Deployment Wallet**
   - Minimum 5 SOL recommended
   - Account for deployment + buffer

4. **Deploy with Upgrade Authority**
   ```bash
   anchor deploy --provider.cluster mainnet
   ```

5. **Verify Deployment**
   ```bash
   anchor verify <PROGRAM_ID> --provider.cluster mainnet
   ```

6. **Set Upgrade Authority**
   ```bash
   # Transfer to multisig or revoke
   solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <MULTISIG_ADDRESS>
   ```

## Monitoring

### Check Program Health

```bash
# Program account info
solana account <PROGRAM_ID>

# Recent transactions
solana transaction-history <WALLET_ADDRESS>
```

### Monitor Escrow Accounts

```bash
# List all escrow PDAs
solana program show <PROGRAM_ID>
```

### Verifier Logs

```bash
# View verifier logs
tail -f verifier.log
```

## Links

- **Program Explorer:** `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`
- **Verifier API Docs:** `http://localhost:8000/docs`
- **GitHub Repository:** https://github.com/x402kamiyo/x402resolve

## Support

For deployment issues:
1. Check troubleshooting section above
2. Review Anchor documentation: https://www.anchor-lang.com
3. Review Solana documentation: https://docs.solana.com
4. Open issue: https://github.com/x402kamiyo/x402resolve/issues
