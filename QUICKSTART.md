# x402Resolve - Quick Start Guide

Get x402Resolve running in under 5 minutes.

## Option 1: Try the Live Demo (30 seconds)

Visit **https://x402kamiyo.github.io/x402resolve**

Click "File Dispute" → Fill in quality issue → See automated resolution in real-time.

## Option 2: Run Example Code (5 minutes)

### Prerequisites
```bash
# Check you have these installed:
node --version  # v18+
python --version  # 3.9+
solana --version  # 1.18+
```

### Installation

```bash
# 1. Clone repo
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

# 2. Generate Solana wallets for devnet
./scripts/generate-wallets.sh

# 3. Choose an example:
cd examples/basic-payment  # OR
cd examples/with-dispute
```

### Run Basic Payment (No Escrow)

```bash
cd examples/basic-payment
npm install

# Set API wallet address
export API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)

# Run
ts-node index.ts
```

### Run With Dispute (Full Escrow + Quality Verification)

**Terminal 1 - Start Verifier Oracle:**
```bash
cd packages/x402-verifier
pip install -r requirements.txt
python verifier.py
```

**Terminal 2 - Run Example:**
```bash
cd examples/with-dispute
npm install

# Set environment
export API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)
export VERIFIER_URL=http://localhost:8000

# Run
ts-node index.ts
```

## Option 3: SDK Integration

```typescript
import { KamiyoClient } from '@kamiyo/x402-sdk';

const client = new KamiyoClient({
  apiUrl: 'https://api.kamiyo.ai',
  chain: 'solana',
  enablex402Resolve: true
});

// Create escrow payment
const payment = await client.pay({
  amount: 0.01,
  recipient: 'API_WALLET_ADDRESS',
  enableEscrow: true
});

// If data quality is poor, file dispute
const dispute = await client.dispute({
  transactionId: payment.transactionId,
  originalQuery: 'Uniswap V3 exploits on Ethereum',
  dataReceived: actualData,
  expectedCriteria: ['tx_hash', 'amount_usd'],
  reason: 'Missing required fields'
});

console.log(`Quality: ${dispute.qualityScore}/100`);
console.log(`Refund: ${dispute.refundPercentage}%`);
```

## Option 4: MCP Server for AI Agents

```bash
# Start MCP server
cd packages/mcp-server
pip install -r requirements.txt
python server.py

# Configure Claude Desktop
# Add to ~/Library/Application Support/Claude/claude_desktop_config.json:
{
  "mcpServers": {
    "x402resolve": {
      "command": "python",
      "args": ["/path/to/x402resolve/packages/mcp-server/server.py"]
    }
  }
}
```

Now Claude can:
- Search crypto exploits
- Assess protocol risk
- Monitor wallets
- File disputes automatically

## Troubleshooting

### "Insufficient funds"
Request devnet SOL:
```bash
solana airdrop 2 $(solana-keygen pubkey wallets/agent-wallet.json) --url devnet
```

### "Cannot connect to verifier"
Make sure verifier is running:
```bash
cd packages/x402-verifier && python verifier.py
```

### "Program not found"
Verify devnet program is deployed:
```bash
solana program show AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR --url devnet
```

### "ModuleNotFoundError"
Install Python dependencies:
```bash
pip install sentence-transformers scikit-learn fastapi uvicorn pynacl
```

## What's Next?

- [Full Documentation](./README.md)
- [Live Demo](https://x402kamiyo.github.io/x402resolve)
- [Architecture Diagrams](./docs/ARCHITECTURE_DIAGRAMS.md)
- [Security Audit](./SECURITY_AUDIT.md)

## Support

- **GitHub Issues**: https://github.com/x402kamiyo/x402resolve/issues
- **Documentation**: See /docs folder
- **Examples**: See /examples folder
- **Tests**: `npm test` (SDK) or `pytest` (Python)

---

**Built by KAMIYO for Solana x402 Hackathon 2025**
