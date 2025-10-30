# x402 Payment System Documentation

> Complete documentation of the x402Resolve payment and dispute resolution infrastructure

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Payment Flow](#payment-flow)
- [Dispute Resolution Flow](#dispute-resolution-flow)
- [Components](#components)
- [API Reference](#api-reference)
- [Integration Guide](#integration-guide)
- [Security](#security)

## Overview

The x402 payment system enables **pay-per-use access** to KAMIYO's crypto exploit intelligence with **automated dispute resolution** for data quality issues. Users pay with Solana, and if data quality is poor, the x402Resolve protocol automatically verifies and processes refunds.

### Key Features

- **Solana-Native**: All payments and escrow on Solana blockchain
- **Automated Disputes**: No manual review - AI quality verification
- **Fair Refunds**: 0-100% sliding scale based on objective quality score
- **Fast Resolution**: 24-48 hours vs traditional weeks/months
- **Transparent**: All transactions verifiable on-chain
- **MCP Integration**: AI agents can file disputes automatically

### Payment Tiers

| Tier | Price/Query | Features | Data Delay |
|------|-------------|----------|------------|
| **Free** | $0 | 10 results max | 24h delay |
| **Personal** | $0.10 | 50 results max | Real-time |
| **Team** | $10/mo + $0.05/query | 200 results, wallet monitoring | Real-time |
| **Enterprise** | $100/mo + $0.02/query | 1000 results, full analytics | Real-time |

## System Architecture

```
┌─────────────────┐
│  User / Agent   │
└────────┬────────┘
         │
         │ 1. Pay with Solana
         ↓
┌─────────────────────────┐
│  x402 Escrow Program    │ ← Solana Smart Contract
│  (Anchor/Rust)          │   - Time-locked payment (24-48h)
└────────┬────────────────┘   - PDA-based escrow
         │                     - Cryptographic verification
         │
         │ 2. Request Data
         ↓
┌─────────────────────────┐
│  KAMIYO API             │
│  (FastAPI/Python)       │
└────────┬────────────────┘
         │
         │ 3. Receive Data
         ↓
┌─────────────────────────┐
│  User Reviews Quality   │
└────────┬────────────────┘
         │
         │ 4a. Quality OK?
         │     └─> Escrow releases to KAMIYO (after 24-48h)
         │
         │ 4b. Quality Poor?
         ↓
┌─────────────────────────┐
│  File Dispute (MCP)     │
└────────┬────────────────┘
         │
         │ 5. Submit Dispute
         ↓
┌─────────────────────────┐
│  x402 Verifier Oracle   │ ← Python FastAPI Service
│  (Quality Scoring)      │   - Semantic analysis (40%)
└────────┬────────────────┘   - Completeness check (40%)
         │                     - Freshness validation (20%)
         │
         │ 6. Quality Score (0-100)
         ↓
┌─────────────────────────┐
│  Escrow Smart Contract  │
│  (Refund Processing)    │
└────────┬────────────────┘
         │
         │ 7. Automatic Refund
         │    - 90-100: 0%
         │    - 70-89:  25%
         │    - 50-69:  50%
         │    - 30-49:  75%
         │    - 0-29:   100%
         ↓
┌─────────────────────────┐
│  Dispute Resolved      │
└─────────────────────────┘
```

## Payment Flow

### 1. Initial Payment (Solana)

```typescript
// Using x402 SDK
import { X402Client } from '@kamiyo/x402-sdk';

const client = new X402Client({
  solanaRpc: 'https://api.devnet.solana.com',
  escrowProgramId: 'YOUR_PROGRAM_ID',
  payerKeypair: keypair
});

// Create escrow and pay for data access
const payment = await client.pay({
  amount: 0.1,           // Amount in SOL
  dataRequest: {
    query: 'Uniswap exploits',
    limit: 50
  },
  disputeWindow: 172800  // 48 hours in seconds
});

console.log('Escrow Address:', payment.escrowAddress);
console.log('Payment TX:', payment.solanaTransaction);
```

**What Happens:**
1. User sends SOL to escrow smart contract
2. Escrow PDA created with time-lock (24-48h dispute window)
3. Payment amount held in escrow
4. User receives data access token
5. KAMIYO API delivers requested data

### 2. Data Delivery

```python
# KAMIYO API endpoint
@app.post("/api/v1/data/exploits")
async def get_exploits(
    request: ExploitSearchRequest,
    payment_token: str = Header(...)
):
    # Verify payment via escrow
    payment = await verify_escrow_payment(payment_token)

    if not payment.is_valid:
        raise HTTPException(401, "Invalid payment")

    # Deliver data
    exploits = await search_exploits(
        query=request.query,
        limit=request.limit
    )

    # Store transaction for dispute reference
    await store_transaction({
        "transaction_id": f"tx_kamiyo_{uuid4()}",
        "escrow_address": payment.escrow_address,
        "data_delivered": exploits,
        "timestamp": datetime.now()
    })

    return exploits
```

## Dispute Resolution Flow

### 3. Filing a Dispute

**Via MCP Server (AI Agent):**
```python
# Claude Desktop calls MCP tool
result = await file_dispute(
    transaction_id="tx_kamiyo_abc123",
    reason="Missing transaction hashes and source attribution",
    expected_quality=80,
    evidence="Query was 'Uniswap exploits on Ethereum' but received generic DeFi data"
)
```

**Via TypeScript SDK:**
```typescript
const dispute = await client.dispute({
  transactionId: 'tx_kamiyo_abc123',
  reason: 'Data incomplete - missing required fields',
  expectedQuality: 80,
  evidence: 'No blockchain verification provided'
});

console.log('Dispute ID:', dispute.disputeId);
console.log('Status:', dispute.status); // 'pending_verification'
```

**Via REST API:**
```bash
curl -X POST https://verifier.x402resolve.com/api/v1/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_kamiyo_abc123",
    "reason": "Data incomplete",
    "expected_quality": 80,
    "evidence": "Missing transaction hashes"
  }'
```

### 4. Automated Quality Verification

The x402 Verifier Oracle automatically analyzes the disputed data:

```python
# x402 Verifier Oracle (simplified)
class QualityVerifier:
    def __init__(self):
        self.semantic_model = SentenceTransformer('all-MiniLM-L6-v2')

    async def verify_quality(self, dispute: Dispute) -> QualityScore:
        # Retrieve original data and query
        transaction = await get_transaction(dispute.transaction_id)
        original_query = transaction.query
        delivered_data = transaction.data_delivered

        # 1. Semantic Coherence (40% weight)
        semantic_score = await self.check_semantic_coherence(
            original_query,
            delivered_data
        )

        # 2. Completeness (40% weight)
        completeness_score = await self.check_completeness(
            delivered_data,
            required_fields=['tx_hash', 'amount_usd', 'source', 'timestamp']
        )

        # 3. Freshness (20% weight)
        freshness_score = await self.check_freshness(
            delivered_data,
            max_age_days=30
        )

        # Calculate overall score
        overall_score = (
            semantic_score * 0.4 +
            completeness_score * 0.4 +
            freshness_score * 0.2
        )

        return QualityScore(
            overall=overall_score,
            semantic_coherence=semantic_score,
            completeness=completeness_score,
            freshness=freshness_score,
            verified_at=datetime.now()
        )
```

**Quality Scoring Details:**

#### Semantic Coherence (40%)
- Uses sentence embeddings to compare query intent vs data delivered
- Cosine similarity between query embedding and data embedding
- Threshold: >0.7 = good match

```python
def check_semantic_coherence(self, query: str, data: List[Dict]) -> float:
    # Embed query
    query_embedding = self.semantic_model.encode(query)

    # Embed data summaries
    data_text = " ".join([
        f"{item.get('protocol', '')} {item.get('category', '')} {item.get('description', '')}"
        for item in data
    ])
    data_embedding = self.semantic_model.encode(data_text)

    # Calculate cosine similarity
    similarity = cosine_similarity([query_embedding], [data_embedding])[0][0]

    return float(similarity)
```

#### Completeness (40%)
- Checks for required fields: `tx_hash`, `amount_usd`, `source`, `timestamp`, `chain`
- Percentage of records with all required fields

```python
def check_completeness(self, data: List[Dict], required_fields: List[str]) -> float:
    if not data:
        return 0.0

    complete_records = 0
    for item in data:
        if all(item.get(field) for field in required_fields):
            complete_records += 1

    return complete_records / len(data)
```

#### Freshness (20%)
- Checks if data timestamp is recent (< 30 days old)
- Percentage of records within freshness window

```python
def check_freshness(self, data: List[Dict], max_age_days: int = 30) -> float:
    if not data:
        return 0.0

    now = datetime.now()
    fresh_records = 0

    for item in data:
        timestamp_str = item.get('timestamp')
        if timestamp_str:
            timestamp = datetime.fromisoformat(timestamp_str)
            age_days = (now - timestamp).days
            if age_days <= max_age_days:
                fresh_records += 1

    return fresh_records / len(data)
```

### 5. Refund Calculation & Processing

```python
# Refund calculation
def calculate_refund_percentage(quality_score: float) -> int:
    """
    Sliding scale refund based on quality score (0-100)
    """
    score_int = int(quality_score * 100)

    if score_int >= 90:
        return 0    # High quality - no refund
    elif score_int >= 70:
        return 25   # Minor issues
    elif score_int >= 50:
        return 50   # Moderate issues
    elif score_int >= 30:
        return 75   # Significant issues
    else:
        return 100  # Poor quality - full refund
```

**Solana Smart Contract Execution:**
```rust
// x402-escrow/programs/x402-escrow/src/lib.rs
pub fn resolve_dispute(
    ctx: Context<ResolveDispute>,
    quality_score: u8,
    verifier_signature: Vec<u8>
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    // Verify oracle signature
    require!(
        verify_oracle_signature(&verifier_signature, quality_score),
        ErrorCode::InvalidOracleSignature
    );

    // Calculate refund
    let refund_percent = calculate_refund_percentage(quality_score);
    let refund_amount = (escrow.amount * refund_percent as u64) / 100;
    let merchant_amount = escrow.amount - refund_amount;

    // Transfer refund to buyer
    if refund_amount > 0 {
        **ctx.accounts.buyer.lamports.borrow_mut() += refund_amount;
    }

    // Transfer remaining to merchant
    if merchant_amount > 0 {
        **ctx.accounts.merchant.lamports.borrow_mut() += merchant_amount;
    }

    // Close escrow
    escrow.status = EscrowStatus::Resolved;

    emit!(DisputeResolved {
        escrow: escrow.key(),
        quality_score,
        refund_amount,
        merchant_amount,
    });

    Ok(())
}
```

## Components

### 1. x402 Escrow Program (Solana)

**Location**: `/packages/x402-escrow/`

**Technology**: Rust, Anchor Framework

**Key Features**:
- PDA-based escrow accounts
- Time-locked payments (dispute window)
- Cryptographic signature verification
- Automated refund splitting
- Event emission for transparency

**Program ID** (Devnet): `[To be deployed]`

**Instructions**:
- `initialize_escrow`: Create payment escrow
- `resolve_dispute`: Process quality-based refund
- `release_payment`: Release after dispute window
- `cancel_escrow`: Cancel before confirmation

### 2. x402 Verifier Oracle

**Location**: `/packages/x402-verifier/`

**Technology**: Python, FastAPI, Sentence Transformers

**Endpoints**:
- `POST /api/v1/disputes`: File new dispute
- `GET /api/v1/disputes/{id}`: Get dispute status
- `POST /api/v1/verify`: Verify data quality (internal)

**Quality Models**:
- Semantic: `sentence-transformers/all-MiniLM-L6-v2`
- Completeness: Rule-based validation
- Freshness: Timestamp analysis

### 3. x402 TypeScript SDK

**Location**: `/packages/x402-sdk/`

**Technology**: TypeScript, @solana/web3.js

**Classes**:
- `X402Client`: Main client for payment & disputes
- `EscrowManager`: Escrow account management
- `DisputeManager`: Dispute filing and tracking

**Usage**:
```typescript
import { X402Client } from '@kamiyo/x402-sdk';

const client = new X402Client({
  solanaRpc: 'https://api.devnet.solana.com',
  escrowProgramId: process.env.ESCROW_PROGRAM_ID!,
  payerKeypair: loadKeypair()
});

// Pay and receive data
const payment = await client.pay({ amount: 0.1, dataRequest });

// File dispute if needed
const dispute = await client.dispute({
  transactionId: payment.transactionId,
  reason: 'Poor quality'
});

// Monitor dispute resolution
client.on('disputeResolved', (event) => {
  console.log('Refund:', event.refundAmount);
});
```

### 4. MCP Server Integration

**Location**: `/packages/mcp-server/`

**Technology**: Python, FastMCP

**New Tool**: `file_dispute`

Enables AI agents (Claude Desktop) to automatically file disputes:

```python
@mcp.tool()
async def file_dispute(
    transaction_id: str,
    reason: str,
    expected_quality: int | None = None,
    evidence: str | None = None
) -> dict:
    """
    File a dispute for poor data quality via x402Resolve
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{config.x402_verifier_url}/api/v1/disputes",
            json={
                "transaction_id": transaction_id,
                "reason": reason,
                "expected_quality": expected_quality,
                "evidence": evidence
            }
        )
        return response.json()
```

## API Reference

### x402 Verifier Oracle API

#### POST /api/v1/disputes

File a new quality dispute.

**Request:**
```json
{
  "transaction_id": "tx_kamiyo_abc123",
  "reason": "Data incomplete - missing transaction hashes",
  "expected_quality": 80,
  "evidence": "Query was 'Uniswap exploits' but received generic DeFi data"
}
```

**Response (201 Created):**
```json
{
  "dispute_id": "dispute_x402_xyz789",
  "transaction_id": "tx_kamiyo_abc123",
  "status": "pending_verification",
  "filed_at": "2025-10-30T15:30:00Z",
  "escrow_address": "Escrow1x402PDAAccount...",
  "verifier_oracle": "https://verifier.x402resolve.com",
  "estimated_resolution_time": "24-48 hours",
  "solana_tx": "5KQx...",
  "next_steps": [
    "x402 Verifier Oracle will analyze data quality within 24h",
    "Quality score will determine refund amount (0-100%)",
    "Refund automatically processed to your wallet if score < 90"
  ]
}
```

#### GET /api/v1/disputes/{dispute_id}

Get dispute status and resolution.

**Response (Pending):**
```json
{
  "dispute_id": "dispute_x402_xyz789",
  "status": "pending_verification",
  "filed_at": "2025-10-30T15:30:00Z",
  "estimated_completion": "2025-10-31T15:30:00Z"
}
```

**Response (Resolved):**
```json
{
  "dispute_id": "dispute_x402_xyz789",
  "status": "resolved",
  "quality_score": 45,
  "quality_assessment": {
    "semantic_coherence": 0.6,
    "completeness": 0.4,
    "freshness": 0.35,
    "overall": 0.45
  },
  "refund_amount_usd": 7.50,
  "refund_percentage": 75,
  "resolution_time": "18 hours",
  "solana_refund_tx": "7LPz...",
  "verifier_signature": "0x1a2b3c...",
  "resolution_notes": "Data missing required blockchain verification. Partial refund issued."
}
```

## Integration Guide

### For Developers

#### 1. Install SDK

```bash
npm install @kamiyo/x402-sdk
# or
yarn add @kamiyo/x402-sdk
```

#### 2. Initialize Client

```typescript
import { X402Client } from '@kamiyo/x402-sdk';
import { Keypair } from '@solana/web3.js';

const client = new X402Client({
  solanaRpc: process.env.SOLANA_RPC_URL,
  escrowProgramId: process.env.X402_ESCROW_PROGRAM_ID,
  payerKeypair: Keypair.fromSecretKey(
    Buffer.from(process.env.WALLET_SECRET_KEY, 'base64')
  )
});
```

#### 3. Make Payment & Get Data

```typescript
// Request exploit data with payment
const payment = await client.pay({
  amount: 0.1,  // SOL
  dataRequest: {
    query: 'Curve Finance exploits',
    limit: 50,
    chain: 'Ethereum'
  },
  disputeWindow: 172800  // 48 hours
});

// Use payment token to fetch data
const response = await fetch('https://api.kamiyo.ai/v1/exploits', {
  headers: {
    'Authorization': `Bearer ${payment.accessToken}`
  }
});

const data = await response.json();
```

#### 4. File Dispute (if quality is poor)

```typescript
// Review data quality
if (dataQualityIsPoor(data)) {
  const dispute = await client.dispute({
    transactionId: payment.transactionId,
    reason: 'Missing transaction hashes',
    expectedQuality: 80,
    evidence: 'Only 30% of results have blockchain verification'
  });

  console.log('Dispute filed:', dispute.disputeId);

  // Monitor resolution
  const resolved = await client.monitorDispute(dispute.disputeId);
  console.log('Refund amount:', resolved.refundAmount);
}
```

### For AI Agents (MCP)

#### 1. Configure Claude Desktop

```json
// ~/.config/claude/mcp_config.json
{
  "mcpServers": {
    "kamiyo-security": {
      "command": "python3.11",
      "args": [
        "/path/to/kamiyo-x402-solana/packages/mcp-server/server.py"
      ],
      "env": {
        "KAMIYO_API_URL": "https://api.kamiyo.ai",
        "X402_VERIFIER_URL": "https://verifier.x402resolve.com",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

#### 2. AI Agent Usage

```
User: "Search for Uniswap exploits on Ethereum"

Claude: [Uses search_crypto_exploits MCP tool]

Claude: I found 15 Uniswap exploits, but I notice 5 of them are missing transaction hashes and source attribution. Let me file a dispute for poor data quality.

Claude: [Uses file_dispute MCP tool]

Claude:  Dispute filed (ID: dispute_x402_xyz789). The x402 Verifier Oracle will analyze the data quality within 24 hours. Based on the missing fields, you'll likely receive a 50-75% refund.
```

## Security

### Escrow Security

1. **Time-Locked Payments**: Funds held in PDA for 24-48h dispute window
2. **PDA Authority**: Only program can move funds from escrow
3. **Cryptographic Verification**: Oracle signatures verified on-chain
4. **Immutable Audit Trail**: All transactions recorded on Solana

### Oracle Security

1. **Quality Score Cryptographic Signing**: Prevents tampering
2. **Rate Limiting**: Prevents abuse (1000 requests/min)
3. **Input Validation**: Sanitize all dispute submissions
4. **Replay Protection**: Each dispute ID used only once

### API Security

1. **JWT Authentication**: For KAMIYO API access
2. **Escrow Verification**: Payment verified before data delivery
3. **TLS/HTTPS**: All API calls encrypted in transit
4. **No Private Keys Stored**: Users maintain custody

## Environment Variables

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
X402_ESCROW_PROGRAM_ID=YourProgramIDHere

# x402 Verifier Oracle
X402_VERIFIER_URL=http://localhost:8001

# KAMIYO API
KAMIYO_API_URL=http://localhost:8000

# Security
MCP_JWT_SECRET=your-secret-here
```

## Deployment

### Devnet Deployment (Current)

```bash
# Deploy Solana program
cd packages/x402-escrow
anchor build
anchor deploy --provider.cluster devnet

# Start Verifier Oracle
cd packages/x402-verifier
python -m verifier

# Start MCP Server
cd packages/mcp-server
python server.py
```

### Mainnet Deployment (Future)

- Solana Program: Audited and deployed to mainnet
- Verifier Oracle: Redundant instances with load balancing
- Monitoring: Datadog + PagerDuty alerts
- Backup: Daily snapshots of dispute history

---

## Support

- **Documentation**: [docs.kamiyo.ai](https://docs.kamiyo.ai)
- **GitHub**: [github.com/x402kamiyo/x402resolve](https://github.com/x402kamiyo/x402resolve)
- **Discord**: [Join Community]
- **Email**: support@kamiyo.ai

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0 (Hackathon Submission)
