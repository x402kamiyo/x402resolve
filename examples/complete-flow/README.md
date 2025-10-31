# Complete x402Resolve Flow Example

This example demonstrates all 16 trust features working together in a complete payment and dispute resolution flow.

## Features Demonstrated

### Trust (6)
1. Ed25519 signature verification
2. On-chain reputation tracking
3. Verification level enforcement
4. Automated verifier oracle
5. Immutable audit trail
6. PDA-based security

### Scope (4)
7. Query-based specification
8. Validation criteria
9. Quality scoring
10. Work agreements

### Accountability (4)
11. Automated disputes
12. Sliding scale refunds
13. Provider penalties
14. Cost scaling

### Reputation (2)
15. On-chain updates
16. Rate limiting

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your wallet keypair
```

## Run

```bash
npm run demo
```

## Flow

1. Initialize agent reputation
2. Check rate limits
3. Create escrow payment
4. Receive data from API
5. Assess quality
6. File dispute if needed
7. Verifier scores quality
8. Execute refund
9. Update reputation
10. Apply penalties if needed
