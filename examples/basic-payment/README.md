# Basic Payment Example

Simple payment for API access without escrow or dispute resolution.

## Use Case

Use this when:
- You trust the API provider
- Data quality is not critical
- You want instant payment release
- You don't need dispute capabilities

## How It Works

```
Agent → Pay 0.01 SOL → API
        ↓
    Instant Release
        ↓
    Get Access Token
        ↓
    Query API
```

## Setup

1. Generate wallets (from repository root):
```bash
cd ../..
./scripts/generate-wallets.sh
cd examples/basic-payment
```

2. Set environment variables:
```bash
export API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)
export KAMIYO_API_URL=https://api.kamiyo.ai
```

## Run

```bash
npm install
ts-node index.ts
```

## Expected Output

```
======================================================================
 x402 Basic Payment Example
======================================================================

 Step 1: Paying for API access...
----------------------------------------------------------------------
 Payment successful!
   Transaction ID: tx_abc123def456
   Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Expires: 1/15/2025, 3:30:00 PM

 Step 2: Querying API...
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

## Key Differences vs. Escrow Payment

| Feature | Basic Payment | Escrow Payment |
|---------|---------------|----------------|
| Release Time | Instant | Time-lock (e.g., 24h) |
| Dispute Support |  No |  Yes |
| Refund Support |  No |  Yes (automated) |
| Use Case | Trusted APIs | Unknown APIs |
| Cost | Lower gas | Higher gas |
