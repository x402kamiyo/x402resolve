# x402Resolve Interactive Demo

**Solana x402 Hackathon Submission** - Live demonstration of automated dispute resolution for data quality

## What This Demo Shows

This interactive web demo showcases the complete x402Resolve dispute resolution workflow:

1. **File a Dispute** - User submits quality complaint for purchased data
2. **Automated Verification** - x402 Verifier Oracle analyzes data quality
3. **Quality Scoring** - Multi-factor scoring (semantic, completeness, freshness)
4. **Automatic Refund** - Solana smart contract processes refund based on score

## Quick Start

### Option 1: Open Directly
Simply open `index.html` in your web browser. No build step required.

```bash
open demo/index.html
# or
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### Option 2: Live Server
For best experience with hot reload:

```bash
# Using VS Code Live Server extension
# or
npx serve .
```

## How to Use

1. **Select a Dispute Reason** from the dropdown
   - Data Incomplete
   - No Source Attribution
   - Wrong Blockchain Data
   - Outdated Information
   - Factually Inaccurate

2. **Set Expected Quality** (0-100)
   - Helps calibrate future quality expectations

3. **Add Evidence** (optional)
   - Describe specific quality issues

4. **Click "File Dispute on Solana"**
   - Watch the automated resolution process unfold

## Technology Showcase

### Quality Scoring Algorithm
The demo simulates the real x402 Verifier Oracle scoring:

- **Semantic Coherence (40%)**: Does data match query intent?
- **Completeness (40%)**: Are all required fields present?
- **Freshness (20%)**: Is the data recent and timely?

### Refund Calculation (Sliding Scale)
Based on quality score:

| Quality Score | Refund Amount |
|---------------|---------------|
| 90-100 | 0% (high quality) |
| 70-89 | 25% refund |
| 50-69 | 50% refund |
| 30-49 | 75% refund |
| 0-29 | 100% refund |

## Demo Flow

```
User Files Dispute
    ↓
Solana Escrow Created (tx submitted)
    ↓
x402 Verifier Oracle Analysis (2-24h)
    ├─ Semantic coherence check
    ├─ Completeness validation
    └─ Freshness assessment
    ↓
Quality Score Calculated (0-100)
    ↓
Refund Percentage Determined
    ↓
Solana Smart Contract Processes Refund
    ↓
Dispute Resolved
```

## Features

- **Interactive UI**: Responsive design
- **Real-time Timeline**: Visual progress tracking
- **Animated Scoring**: Quality metrics with smooth transitions
- **Multiple Scenarios**: Different dispute types show different outcomes
- **Mobile Responsive**: Works on all screen sizes

## Technical Architecture

The demo simulates the actual x402Resolve architecture:

1. **MCP Server** → Receives dispute from client application
2. **x402 Verifier Oracle** → Python FastAPI service
3. **Solana Escrow** → Rust/Anchor smart contract
4. **Quality Scoring** → Sentence Transformers + sklearn
5. **Automated Refund** → On-chain execution

## For Hackathon Judges

This demo illustrates the key innovation of x402Resolve:

- **Automated** - No manual review required
- **Transparent** - Clear quality metrics
- **Fair** - Sliding scale refunds based on objective scores
- **Fast** - 24-48h resolution vs weeks/months
- **Verifiable** - All transactions on Solana blockchain

### Prize Categories

This project competes in:
- **MCP Server** ($10K): Programmatic dispute filing via MCP
- **Developer Tool** ($10K): SDK for integrating dispute resolution
- **Agent Application** ($10K): End-to-end automated workflow
- **API Integration** ($10K): RESTful API for quality verification

## Related Components

- MCP Server: `/packages/mcp-server/`
- x402 Verifier Oracle: `/packages/x402-verifier/`
- Solana Escrow Program: `/packages/x402-escrow/`
- TypeScript SDK: `/packages/x402-sdk/`

## Demo Video

See this demo in action in our 3-minute hackathon submission video:
[Link to be added after video production]

## Contact

- Project: [x402Resolve GitHub](https://github.com/x402kamiyo/x402resolve)
- Website: [kamiyo.io](https://kamiyo.io)
- Discord: [Join our community]

---

**Built for Solana x402 Hackathon 2025**
