# @x402resolve/middleware

HTTP 402 Payment Required middleware for x402Resolve escrow payments.

Implements [RFC 9110 Section 15.5.3](https://httpwg.org/specs/rfc9110.html#status.402) - 402 Payment Required standard.

## Installation

```bash
npm install @x402resolve/middleware
```

## Express.js Usage

```typescript
import express from 'express';
import { x402PaymentMiddleware } from '@x402resolve/middleware';
import { Connection, PublicKey } from '@solana/web3.js';

const app = express();

// Apply x402 middleware to protected routes
app.use('/api/*', x402PaymentMiddleware({
  realm: 'my-api',
  programId: new PublicKey('AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR'),
  connection: new Connection('https://api.devnet.solana.com'),
  price: 0.001,
  qualityGuarantee: true
}));

// Protected endpoint
app.get('/api/data', (req, res) => {
  const escrow = (req as any).escrow;
  res.json({
    data: 'Protected content',
    escrow_pubkey: escrow.pubkey.toString()
  });
});
```

## FastAPI Usage

```python
from fastapi import FastAPI, Request
from x402_middleware import x402_payment_middleware, X402Config

app = FastAPI()

config = X402Config(
    realm="my-api",
    program_id="AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR",
    rpc_url="https://api.devnet.solana.com",
    price=0.001,
    quality_guarantee=True
)

app.middleware("http")(x402_payment_middleware(config))

@app.get("/api/data")
async def get_data(request: Request):
    escrow = request.state.escrow
    return {
        "data": "Protected content",
        "escrow_pubkey": escrow["pubkey"]
    }
```

## Payment Flow

### Step 1: Initial Request (No Payment)

Client makes request without payment proof:

```bash
curl http://localhost:3000/api/data
```

Server responds with **402 Payment Required**:

```json
HTTP/1.1 402 Payment Required
WWW-Authenticate: Solana realm="my-api"
X-Escrow-Address: Required
X-Price: 0.001 SOL
X-Quality-Guarantee: true
X-Program-Id: AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR

{
  "error": "Payment Required",
  "message": "This API requires payment via Solana escrow",
  "amount": 0.001,
  "currency": "SOL",
  "escrow_program": "AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR",
  "quality_guarantee": true,
  "payment_flow": {
    "step_1": "Create escrow with specified amount",
    "step_2": "Retry request with X-Payment-Proof header",
    "step_3": "Receive data with quality score",
    "step_4": "Automatic dispute if quality < threshold"
  }
}
```

### Step 2: Create Escrow

Client creates Solana escrow with specified amount:

```typescript
import { EscrowClient } from '@x402resolve/sdk';

const escrow = await client.createEscrow({
  provider: providerPubkey,
  amount: 0.001
});
```

### Step 3: Retry with Payment Proof

Client retries request with escrow pubkey:

```bash
curl http://localhost:3000/api/data \
  -H "X-Payment-Proof: <escrow_pubkey>"
```

Server validates escrow and returns content:

```json
HTTP/1.1 200 OK

{
  "data": "Protected content",
  "escrow_pubkey": "Hx7k...m3pL"
}
```

### Step 4: Quality Verification

If data quality is poor, client files dispute automatically:

```typescript
if (quality < 80) {
  await client.fileDispute(escrow.pubkey, {
    evidence: 'Missing required fields',
    expectedQuality: 90,
    actualQuality: quality
  });
}
```

## Standard Headers

The middleware implements standard HTTP 402 headers:

- **`WWW-Authenticate`**: Authentication scheme (Solana realm)
- **`X-Price`**: Payment amount in SOL
- **`X-Escrow-Address`**: Indicates escrow address required
- **`X-Quality-Guarantee`**: Boolean indicating quality guarantees
- **`X-Program-Id`**: Solana program ID for escrow

## Configuration

### X402Options

```typescript
interface X402Options {
  realm: string;              // Authentication realm
  programId: PublicKey;       // Solana escrow program ID
  connection: Connection;     // Solana RPC connection
  price: number;              // Price in SOL
  qualityGuarantee?: boolean; // Enable quality guarantees
}
```

## Error Responses

### 402 Payment Required

No payment proof provided in request.

### 403 Forbidden

Invalid or unverified payment proof:
- Escrow account not found
- Escrow not owned by expected program
- Invalid escrow address format

## Integration with x402Resolve

The middleware integrates seamlessly with x402Resolve's dispute resolution system:

1. **Payment**: Middleware validates escrow creation
2. **Service**: Protected endpoint returns data with quality score
3. **Verification**: Client assesses quality automatically
4. **Dispute**: x402Resolve handles disputes if quality poor
5. **Refund**: Sliding-scale refunds based on quality

## Examples

See `/examples/x402-api-server/` for complete implementation examples.

## License

MIT
