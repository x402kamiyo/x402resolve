# Basic Payment Example - Setup Guide

This example demonstrates a simple payment for API access without escrow or dispute resolution.

## Prerequisites

- Node.js 18+ installed
- Solana CLI installed (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Basic understanding of TypeScript

## Step 1: Generate Wallets

From the repository root:

```bash
cd ../..
./scripts/generate-wallets.sh
```

This creates two wallets in `wallets/`:
- `agent-wallet.json` - The client making the payment
- `api-wallet.json` - The API provider receiving payment

**Important:** The script also requests devnet SOL airdrops. If it fails, manually request:

```bash
solana airdrop 2 $(solana-keygen pubkey wallets/agent-wallet.json) --url devnet
solana airdrop 2 $(solana-keygen pubkey wallets/api-wallet.json) --url devnet
```

## Step 2: Configure Environment

```bash
cd examples/basic-payment
cp .env.example .env
```

Edit `.env` and set:

```bash
API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)
```

Or manually paste the public key from:
```bash
solana-keygen pubkey ../../wallets/api-wallet.json
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Example

```bash
ts-node index.ts
```

## Expected Output

```
======================================================================
💰 x402 Basic Payment Example
======================================================================

📤 Step 1: Paying for API access...
----------------------------------------------------------------------
 Payment successful!
   Transaction ID: tx_abc123def456
   Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Expires: 1/15/2025, 3:30:00 PM

🔍 Step 2: Querying API...
----------------------------------------------------------------------
 Received 5 recent exploits:
   1. Curve Finance - $61,700,000
   2. Euler Finance - $8,200,000
   3. Mango Markets - $1,500,000
   4. Wintermute - $160,000,000
   5. Nomad Bridge - $190,000,000

======================================================================
 Example complete!
======================================================================
```

## Troubleshooting

### "Insufficient funds" error

Your wallet needs devnet SOL. Request an airdrop:

```bash
solana airdrop 2 $(solana-keygen pubkey ../../wallets/agent-wallet.json) --url devnet
```

### "API_WALLET_PUBKEY environment variable required"

You need to set the environment variable. Either:

1. Create `.env` file from `.env.example`
2. Export it manually:
   ```bash
   export API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)
   ```

### "Connection refused" or "Network error"

Check your internet connection and RPC endpoint:

```bash
# Test devnet connectivity
solana cluster-version --url devnet
```

### TypeScript errors

Make sure dependencies are installed:

```bash
npm install
```

## What's Happening?

1. **Payment Creation**: Client sends 0.01 SOL directly to API provider
2. **Instant Release**: Payment is immediately available (no escrow)
3. **Access Token**: API returns JWT token for authenticated requests
4. **Data Query**: Client uses token to query API endpoints

**Note:** This is a basic payment without protection. For escrow and dispute resolution, see `examples/with-dispute/`.

## Next Steps

- Try `examples/with-dispute` for escrow payments
- Read [SDK Documentation](../../packages/x402-sdk/README.md)
- Explore [MCP Server Integration](../../packages/mcp-server/README.md)
