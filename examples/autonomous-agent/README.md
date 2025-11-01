# Autonomous Agent Example

Fully autonomous AI agent that makes payments, verifies data quality, and files disputes automatically without human intervention.

**For:** Solana x402 Hackathon 2025 - Best Agent Application Track

## What This Demonstrates

This example shows a complete autonomous agent that:

1.  **Makes independent decisions** about when to make payments
2.  **Determines what data to query** based on its goals
3.  **Verifies data quality automatically** using objective metrics
4.  **Files disputes autonomously** when quality is poor
5.  **Makes accept/reject decisions** without human oversight
6.  **Manages its own budget** and spending limits

## Key Features

### Intelligent Decision Making

The agent has three quality thresholds:

- **Auto-Accept (≥85%):** Immediately accept payment, release escrow
- **Review (75-84%):** Perform additional analysis before deciding
- **Auto-Dispute (<75%):** Automatically file dispute for refund

### Autonomous Workflow

```
┌─────────────────┐
│  Agent Decides  │ ← Goal-driven decision making
│  Payment Needed │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Determine Query │ ← Intelligent query selection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Make Payment   │ ← Escrow creation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Fetch Data    │ ← API call
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Quality  │ ← Oracle assessment
└────────┬────────┘
         │
         ▼
     ┌───┴────┐
     │Evaluate│ ← Agent brain decides
     └───┬────┘
         │
    ┌────┼────┐
    │    │    │
    ▼    ▼    ▼
 Accept Review Dispute
```

## Quick Start

### Prerequisites

```bash
# Ensure you're in the x402resolve root
cd /path/to/x402resolve

# Verifier oracle must be running
cd packages/x402-verifier
python verifier.py
# Keep this running in separate terminal
```

### Run the Agent

```bash
cd examples/autonomous-agent

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run autonomous agent (runs 5 cycles)
npm start
```

## Configuration

Edit `.env` to customize agent behavior:

```env
# Agent Configuration
AGENT_NAME=CryptoSecurityBot
OPERATION_MODE=autonomous          # autonomous | supervised

# Quality Thresholds (0-100)
MIN_QUALITY_SCORE=80              # Minimum acceptable quality
AUTO_DISPUTE_THRESHOLD=75         # Auto-dispute if score < 75
AUTO_ACCEPT_THRESHOLD=85          # Auto-accept if score >= 85

# Payment Configuration
DEFAULT_PAYMENT_AMOUNT_SOL=0.01   # Amount per payment
MAX_PAYMENT_PER_DAY_SOL=1.0       # Daily spending limit

# Check Interval
CHECK_INTERVAL_SECONDS=300        # How often to check for new data
```

## Example Output

```
======================================================================
AUTONOMOUS AGENT DEMO
x402Resolve - Solana x402 Hackathon 2025
======================================================================

[2024-11-01T18:30:00.000Z] [CryptoSecurityBot] [INFO] Agent "CryptoSecurityBot" initializing...
[2024-11-01T18:30:00.001Z] [CryptoSecurityBot] [INFO] Configuration
{
  "mode": "autonomous",
  "minQualityScore": 80,
  "autoDisputeThreshold": 75,
  "autoAcceptThreshold": 85,
  "defaultPayment": "0.01 SOL"
}

*** CYCLE 1/5 ***

[2024-11-01T18:30:00.100Z] [CryptoSecurityBot] [INFO] Time for periodic data refresh
[2024-11-01T18:30:00.101Z] [CryptoSecurityBot] [INFO] Creating payment for query: "Recent Uniswap exploits"
[2024-11-01T18:30:00.102Z] [CryptoSecurityBot] [INFO] Payment created
{
  "id": "tx_1699123456_abc123",
  "amount": 0.01,
  "query": "Recent Uniswap exploits"
}

[2024-11-01T18:30:01.200Z] [CryptoSecurityBot] [INFO] Data received
{
  "recordCount": 2,
  "estimatedQuality": 45
}

[2024-11-01T18:30:01.250Z] [CryptoSecurityBot] [INFO] Quality verification complete
{
  "score": 45,
  "semantic": 72,
  "completeness": 40,
  "freshness": 100
}

[2024-11-01T18:30:01.251Z] [CryptoSecurityBot] [INFO] Agent decision: DISPUTE
{
  "reason": "Quality score 45 below dispute threshold 75"
}

[2024-11-01T18:30:01.252Z] [CryptoSecurityBot] [WARN] Filing dispute for payment tx_1699123456_abc123
{
  "reason": "Quality score 45 below dispute threshold 75",
  "qualityScore": 45,
  "paymentAmount": 0.01
}

[2024-11-01T18:30:01.253Z] [CryptoSecurityBot] [INFO] Dispute filed successfully
{
  "disputeId": "dispute_tx_1699123456_abc123",
  "qualityScore": 45,
  "refundPercentage": 100,
  "refundAmount": 0.01
}

[2024-11-01T18:30:01.254Z] [CryptoSecurityBot] [INFO] Agent Statistics
{
  "totalPayments": 1,
  "totalDisputes": 1,
  "totalRefunds": "0.0100 SOL",
  "disputeRate": "100.0%",
  "paymentsToday": 1
}
```

## Agent Architecture

The autonomous agent uses KAMIYO-themed components inspired by Japanese creation mythology:

- **Musubi** (結び) - "Creative Force/Binding"
  - The decision-making intelligence
  - Evaluates data quality and determines actions
  - Embodies the creative force that binds decisions to outcomes

- **Kotowari** (理) - "Logic/Principle"
  - The action execution layer
  - Implements reasoned principles through API calls
  - Handles payments, disputes, and data verification

This naming reflects KAMIYO (神代 - "Age of the Gods") while maintaining technical clarity.

## Agent Intelligence Features

### 1. Budget Management

- Tracks daily spending
- Enforces payment limits
- Prevents runaway costs

### 2. Quality Evaluation

Three-factor quality scoring:
- **Semantic Similarity (40%):** Does data match the query?
- **Completeness (40%):** Are all required fields present?
- **Freshness (20%):** Is the data recent?

### 3. Decision Logic

```typescript
if (quality >= 85) {
  // Excellent quality - accept immediately
  await acceptPayment();
} else if (quality >= 75) {
  // Good quality but needs review
  const analysis = await deepAnalysis();
  if (analysis.passes) {
    await acceptPayment();
  } else {
    await fileDispute();
  }
} else {
  // Poor quality - dispute immediately
  await fileDispute();
}
```

### 4. Adaptive Learning

Agent tracks:
- Total payments made
- Dispute rate
- Refund amounts
- Success patterns

## Real-World Use Case

**Scenario:** Security research bot monitoring DeFi exploits

1. **Every 5 minutes**, agent checks if new exploit data is needed
2. **Agent decides** which exploit type to query (Uniswap, Curve, etc.)
3. **Makes payment** of 0.01 SOL via escrow
4. **Receives data** from security API
5. **Verifies quality**:
   - Check: Are these actually Uniswap exploits?
   - Check: Do records have tx_hash, amount, timestamp?
   - Check: Is data recent (not from 2020)?
6. **If quality < 75%**: Files dispute, gets refund
7. **If quality >= 85%**: Accepts data, releases payment
8. **If quality 75-85%**: Analyzes further before deciding

**Result:** Bot only pays for high-quality data, automatically gets refunds for poor data.

## Testing Different Scenarios

The example includes three simulated data scenarios:

**Scenario 1: Good Quality (92/100)**
- Complete data with all required fields
- Relevant to query
- Result: Auto-accept, payment released

**Scenario 2: Missing Fields (45/100)**
- Some records missing tx_hash or chain
- Incomplete data
- Result: Auto-dispute, 100% refund

**Scenario 3: Wrong Data (35/100)**
- Wrong protocols (Curve instead of Uniswap)
- Wrong chain (BSC instead of Ethereum)
- Result: Auto-dispute, 100% refund

## Advanced Configuration

### Supervised Mode

Set `OPERATION_MODE=supervised` to require confirmation:

```typescript
const decision = await agent.makeDecision();
console.log(`Agent recommends: ${decision.action}`);
const userConfirm = await askUser(`Proceed with ${decision.action}?`);
if (userConfirm) {
  await agent.execute(decision);
}
```

### Custom Quality Metrics

Add your own quality checks:

```typescript
async analyzeData(data: any, query: string) {
  // Check 1: Minimum record count
  if (data.length < this.config.minRecords) return false;

  // Check 2: Custom field validation
  const hasRequiredFields = data.every(record =>
    this.validateRecord(record)
  );

  // Check 3: Business logic
  const meetsBusinessRules = this.validateBusinessRules(data);

  return hasRequiredFields && meetsBusinessRules;
}
```

## Extending the Agent

### Add More Intelligence

```typescript
class AdvancedMusubi extends Musubi {
  // Learn from past disputes
  learnFromHistory() {
    const successfulProviders = this.getProvidersWithLowDisputeRate();
    return this.preferProviders(successfulProviders);
  }

  // Predict quality before fetching
  predictQuality(provider, query) {
    return this.mlModel.predict({ provider, query });
  }

  // Optimize spending
  optimizeBudget() {
    const hourlyNeeds = this.calculateDataNeeds();
    return this.allocateBudget(hourlyNeeds);
  }
}
```

### Multi-Agent Coordination

```typescript
// Agent fleet working together
const agents = [
  new Agent({ role: 'security', specialization: 'DeFi' }),
  new Agent({ role: 'security', specialization: 'NFT' }),
  new Agent({ role: 'security', specialization: 'CEX' })
];

// Share information
agents.forEach(agent => {
  agent.on('dispute', (data) => {
    // Alert other agents about bad provider
    agents.filter(a => a !== agent).forEach(a =>
      a.blacklistProvider(data.provider)
    );
  });
});
```

## Comparison to Manual Process

| Step | Manual | Autonomous Agent |
|------|--------|------------------|
| Decide payment needed | Human checks dashboard | Agent monitors continuously |
| Make payment | Human clicks "Pay" | Agent creates escrow |
| Receive data | Human waits | Agent fetches immediately |
| Check quality | Human reviews manually | Agent verifies automatically |
| File dispute | Human fills form | Agent files programmatically |
| Resolution | Wait days/weeks | Resolved in seconds |
| **Total Time** | **Hours/days** | **Seconds** |
| **Human Effort** | **High** | **Zero** |

## Next Steps

1. **Run the demo:** See autonomous agent in action
2. **Customize:** Adjust thresholds and logic for your use case
3. **Integrate:** Connect to real APIs and payment systems
4. **Deploy:** Run agent 24/7 in production
5. **Scale:** Deploy fleet of specialized agents

## Support

- **Issues:** https://github.com/x402kamiyo/x402resolve/issues
- **Docs:** See [API Reference](../../docs/markdown/API_REFERENCE.md)
- **Email:** support@kamiyo.ai

---

*Built for Solana x402 Hackathon 2025 - Best Agent Application Track*
