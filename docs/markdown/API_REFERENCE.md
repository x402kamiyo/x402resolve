# API Reference

Complete reference for x402Resolve SDK and services.

## Table of Contents

- [KamiyoClient](#kamiyoclient)
- [EscrowClient](#escrowclient)
- [Verifier Oracle API](#verifier-oracle-api)
- [MCP Server Tools](#mcp-server-tools)
- [Types & Interfaces](#types--interfaces)

---

## KamiyoClient

Main SDK client for interacting with KAMIYO API and x402Resolve system.

### Constructor

```typescript
import { KamiyoClient } from '@kamiyo/x402-sdk';

const client = new KamiyoClient({
  apiUrl: string;                    // KAMIYO API base URL
  enablex402Resolve?: boolean;       // Enable escrow payments (default: false)
  walletPublicKey?: PublicKey;       // Solana wallet for payments
  retryConfig?: RetryConfig;         // Retry configuration
});
```

### Methods

#### `searchExploits(query, options)`

Search for cryptocurrency exploits in KAMIYO database.

```typescript
const results = await client.searchExploits('Uniswap V3', {
  limit: 10,
  offset: 0,
  filters: {
    protocol: 'uniswap',
    chain: 'ethereum',
    minAmount: 1000000
  }
});
```

**Parameters:**
- `query` (string): Search query
- `options` (object):
  - `limit` (number, optional): Max results (default: 10)
  - `offset` (number, optional): Pagination offset (default: 0)
  - `filters` (object, optional): Filter criteria

**Returns:** `Promise<ExploitSearchResult[]>`

#### `pay(paymentOptions)`

Create an escrow payment for an API request.

```typescript
const payment = await client.pay({
  amount: 0.01,                      // Amount in SOL
  recipient: PublicKey,              // API provider wallet
  query: 'search query',             // What you're paying for
  expectedCriteria: {                // Quality criteria
    minRecords: 5,
    requiredFields: ['tx_hash', 'amount_usd'],
    maxAgeDays: 30
  },
  enableEscrow: true                 // Use time-locked escrow
});
```

**Returns:**
```typescript
{
  transactionId: string;
  escrowAccount: PublicKey;
  amount: number;
  status: 'pending' | 'completed' | 'disputed';
}
```

#### `dispute(disputeOptions)`

File a quality dispute for a payment.

```typescript
const dispute = await client.dispute({
  transactionId: string;             // Original payment TX ID
  reason: string;                    // Why dispute was filed
  evidence: any;                     // Data received from API
  query: string;                     // Original query
  expectedCriteria: object;          // What was expected
});
```

**Returns:**
```typescript
{
  disputeId: string;
  qualityScore: number;              // 0-100
  refundPercentage: number;          // 0-100
  refundAmount: number;              // SOL amount
  breakdown: {
    semantic: number;                // Semantic similarity score
    completeness: number;            // Completeness score
    freshness: number;               // Freshness score
  };
}
```

#### `getReputationScore(publicKey)`

Get reputation score for an oracle or provider.

```typescript
const score = await client.getReputationScore(publicKey);
// Returns: number (0-1000)
```

---

## EscrowClient

Low-level Solana escrow program interaction.

### Constructor

```typescript
import { EscrowClient } from '@kamiyo/x402-sdk';

const escrowClient = new EscrowClient(
  connection,    // Solana Connection
  programId,     // Escrow program ID
  payer          // Keypair for signing
);
```

### Methods

#### `initializeEscrow(params)`

Create a new escrow account.

```typescript
const escrowPda = await escrowClient.initializeEscrow({
  buyer: PublicKey,
  seller: PublicKey,
  verifier: PublicKey,
  amount: number,                    // Lamports
  disputeWindowSeconds: number,      // Time lock (default: 86400)
  transactionId: string
});
```

#### `releaseFunds(escrowPda)`

Release funds to seller after dispute window.

```typescript
await escrowClient.releaseFunds(escrowPda);
```

#### `markDisputed(escrowPda)`

Mark escrow as disputed.

```typescript
await escrowClient.markDisputed(escrowPda);
```

#### `resolveDispute(params)`

Resolve dispute with oracle-signed assessment.

```typescript
await escrowClient.resolveDispute({
  escrowPda: PublicKey,
  qualityScore: number,              // 0-100
  refundPercentage: number,          // 0-100
  signature: Buffer,                 // Ed25519 signature
  verifierPublicKey: PublicKey
});
```

---

## Verifier Oracle API

REST API for quality assessment.

### Base URL

```
http://localhost:8000/api/v1
```

### Endpoints

#### POST `/verify`

Assess data quality and generate signed result.

**Request:**
```json
{
  "query": "Uniswap V3 exploits on Ethereum",
  "data": [...],
  "expected_criteria": {
    "min_records": 5,
    "required_fields": ["tx_hash", "amount_usd"],
    "max_age_days": 30
  }
}
```

**Response:**
```json
{
  "quality_score": 65,
  "refund_percentage": 35,
  "breakdown": {
    "semantic_similarity": 0.72,
    "completeness_score": 0.40,
    "freshness_score": 1.00
  },
  "signature": "hex_encoded_ed25519_signature",
  "verifier_pubkey": "Ed25519 public key"
}
```

#### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## MCP Server Tools

Tools available for Claude Desktop integration.

### 1. `health_check`

Check server connectivity and status.

```typescript
// Input: none
// Output: { status: string, uptime: number }
```

### 2. `search_crypto_exploits`

Search KAMIYO exploit database.

```typescript
// Input:
{
  query: string,
  limit?: number,
  offset?: number
}

// Output:
{
  results: Exploit[],
  total: number
}
```

### 3. `assess_defi_protocol_risk`

Analyze security risk of a DeFi protocol.

```typescript
// Input:
{
  protocol: string,
  chain: string
}

// Output:
{
  risk_score: number,        // 0-100
  vulnerabilities: string[],
  recommendations: string[]
}
```

### 4. `monitor_wallet`

Check wallet exposure to compromised protocols.

```typescript
// Input:
{
  wallet_address: string,
  chain: string
}

// Output:
{
  exposed: boolean,
  risk_protocols: string[],
  total_exposure_usd: number
}
```

### 5. `file_dispute`

File a quality dispute.

```typescript
// Input:
{
  transaction_id: string,
  reason: string,
  evidence: any
}

// Output:
{
  dispute_id: string,
  quality_score: number,
  refund_percentage: number
}
```

---

## Types & Interfaces

### ExploitSearchResult

```typescript
interface ExploitSearchResult {
  id: string;
  protocol: string;
  chain: string;
  tx_hash: string;
  amount_usd: number;
  timestamp: number;
  vulnerability_type: string;
  description: string;
}
```

### PaymentOptions

```typescript
interface PaymentOptions {
  amount: number;                    // SOL amount
  recipient: PublicKey;              // Seller wallet
  query: string;                     // Search query
  expectedCriteria?: {
    minRecords?: number;
    requiredFields?: string[];
    maxAgeDays?: number;
  };
  enableEscrow?: boolean;            // Use time-locked escrow
}
```

### DisputeOptions

```typescript
interface DisputeOptions {
  transactionId: string;
  reason: string;
  evidence: any;
  query: string;
  expectedCriteria: object;
}
```

### QualityAssessment

```typescript
interface QualityAssessment {
  qualityScore: number;              // 0-100
  refundPercentage: number;          // 0-100
  breakdown: {
    semantic: number;                // Semantic similarity
    completeness: number;            // Data completeness
    freshness: number;               // Data recency
  };
  signature: Buffer;                 // Ed25519 signature
  verifierPublicKey: PublicKey;
}
```

### RetryConfig

```typescript
interface RetryConfig {
  maxRetries: number;                // Max retry attempts (default: 3)
  initialDelay: number;              // Initial delay in ms (default: 1000)
  maxDelay: number;                  // Max delay in ms (default: 10000)
  factor: number;                    // Backoff factor (default: 2)
}
```

---

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INSUFFICIENT_FUNDS` | Not enough SOL for transaction | Add SOL to wallet |
| `INVALID_SIGNATURE` | Oracle signature verification failed | Check verifier key |
| `ESCROW_NOT_FOUND` | Escrow account doesn't exist | Verify escrow PDA |
| `DISPUTE_WINDOW_EXPIRED` | Too late to file dispute | Must dispute within 24h |
| `ALREADY_RESOLVED` | Dispute already processed | Check transaction history |
| `QUALITY_SCORE_INVALID` | Score not in 0-100 range | Verify oracle response |

### Example Error Handling

```typescript
try {
  const payment = await client.pay({...});
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Add SOL to your wallet');
  } else if (error.code === 'INVALID_SIGNATURE') {
    console.error('Oracle signature verification failed');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

---

## Examples

### Complete Payment Flow

```typescript
import { KamiyoClient } from '@kamiyo/x402-sdk';
import { Keypair } from '@solana/web3.js';

const wallet = Keypair.fromSecretKey(/* your key */);

const client = new KamiyoClient({
  apiUrl: 'https://api.kamiyo.ai',
  enablex402Resolve: true,
  walletPublicKey: wallet.publicKey
});

// 1. Create payment
const payment = await client.pay({
  amount: 0.01,
  recipient: apiProviderWallet,
  query: 'Uniswap V3 exploits',
  expectedCriteria: {
    minRecords: 5,
    requiredFields: ['tx_hash', 'amount_usd']
  },
  enableEscrow: true
});

// 2. Get data from API
const data = await client.searchExploits('Uniswap V3');

// 3. If quality is poor, file dispute
if (data.length < 5) {
  const dispute = await client.dispute({
    transactionId: payment.transactionId,
    reason: 'Insufficient records returned',
    evidence: data,
    query: 'Uniswap V3 exploits',
    expectedCriteria: { minRecords: 5 }
  });

  console.log(`Refund: ${dispute.refundPercentage}%`);
  console.log(`Quality Score: ${dispute.qualityScore}/100`);
}
```

### Multi-Oracle Consensus (Phase 2)

```typescript
import { MultiOracleSystem } from '@kamiyo/x402-sdk';

const system = new MultiOracleSystem();

// High-value transaction requires 3 oracles
if (transactionValue > 1.0) {
  const assessments = await system.getMultiOracleAssessment({
    query: query,
    data: data,
    oracleCount: 3
  });

  const consensus = system.calculateConsensus(assessments);
  console.log(`Median Score: ${consensus.medianScore}`);
  console.log(`Confidence: ${consensus.confidence}%`);
}
```

---

## Rate Limits

| Endpoint | Rate Limit | Burst |
|----------|------------|-------|
| `/verify` | 100/hour | 10/minute |
| `/search` | 1000/hour | 50/minute |
| MCP Tools | 500/hour | 25/minute |

---

## Support

- **Documentation**: https://github.com/x402kamiyo/x402resolve
- **Issues**: https://github.com/x402kamiyo/x402resolve/issues
- **Email**: support@kamiyo.ai
