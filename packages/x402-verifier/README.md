# x402 Verifier Oracle

Programmatic quality assessment for x402Resolve dispute resolution.

## What It Does

When an AI agent disputes payment quality, the x402 Verifier Oracle:
1. Receives: Original query + Data received + Expected criteria
2. Calculates: Quality score (0-100) based on semantic matching + completeness + freshness
3. Returns: Refund recommendation (0-100% sliding scale)

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run oracle
python verifier.py

# Test endpoint
curl -X POST http://localhost:8000/verify-quality \
  -H "Content-Type: application/json" \
  -d '{
    "original_query": "Get all Uniswap V3 exploits",
    "data_received": {"exploits": [...]},
    "expected_criteria": ["comprehensive", "historical", "verified"]
  }'
```

## API

### POST /verify-quality

**Request:**
```json
{
  "original_query": "Get comprehensive Uniswap exploit history",
  "data_received": {
    "exploits": [
      {"date": "2024-07-30", "amount": 61700000},
      {"date": "2023-04-15", "amount": 8200000},
      {"date": "2022-10-07", "amount": 1500000}
    ]
  },
  "expected_criteria": ["comprehensive", "historical", "verified"],
  "transaction_id": "5x9k2m..."
}
```

**Response:**
```json
{
  "quality_score": 65,
  "recommendation": "partial_refund",
  "refund_percentage": 35,
  "reasoning": "Semantic: 0.72, Completeness: 0.40, Freshness: 1.00",
  "signature": "0x..."
}
```

## Quality Scoring Algorithm

### Factor 1: Semantic Similarity (40% weight)
- Embeddings: sentence-transformers/all-MiniLM-L6-v2
- Cosine similarity between query and data
- Score: 0.0-1.0

### Factor 2: Completeness (40% weight)
- Coverage of expected criteria
- Record count vs expected
- Score: 0.0-1.0

### Factor 3: Freshness (20% weight)
- Timestamp validation
- Data recency vs expectations
- Score: 0.0-1.0

### Refund Calculation

```
Quality Score 80-100 → 0% refund (full release)
Quality Score 50-79  → Sliding scale refund
Quality Score 0-49   → 100% refund (full refund)
```

## Security

- Verifier signs all results with Ed25519 private key
- Signature verified by Solana escrow program
- On-chain logging for auditability

## Future Enhancements

- [ ] Multi-oracle consensus (3+ verifiers vote)
- [ ] ML model fine-tuning on dispute history
- [ ] Domain-specific quality metrics (security data, financial data, etc.)
- [ ] Appeal mechanism with human oversight
