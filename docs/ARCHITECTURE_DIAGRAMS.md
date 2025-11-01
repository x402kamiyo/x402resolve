# x402Resolve Architecture Diagrams

Visual representations of the x402Resolve system architecture, data flows, and trust mechanisms.

## Table of Contents

1. [High-Level System Architecture](#high-level-system-architecture)
2. [Payment and Dispute Flow](#payment-and-dispute-flow)
3. [Quality Scoring Pipeline](#quality-scoring-pipeline)
4. [Multi-Oracle Consensus (Phase 2)](#multi-oracle-consensus-phase-2)
5. [Trust and Security Model](#trust-and-security-model)
6. [Component Interaction](#component-interaction)

---

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Client[Client Application]
        SDK[x402 SDK]
        MCP[MCP Server]
    end

    subgraph "Blockchain Layer"
        Escrow[Solana Escrow Program]
        Wallet[Solana Wallets]
    end

    subgraph "Oracle Layer"
        Verifier[Verifier Oracle]
        Consensus[Multi-Oracle Consensus]
    end

    subgraph "Data Layer"
        API[KAMIYO API]
        DB[(Reputation DB)]
    end

    Client --> SDK
    Client --> MCP
    SDK --> Escrow
    SDK --> Verifier
    SDK --> API
    MCP --> Verifier
    Verifier --> Escrow
    Verifier --> Consensus
    Escrow --> Wallet
    Verifier --> DB

    style Escrow fill:#9cf
    style Verifier fill:#f9c
    style SDK fill:#cfc
    style API fill:#fcf
```

### ASCII Version

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │  Client  │───▶│   SDK    │    │   MCP    │         │
│  │   App    │    │ Library  │    │  Server  │         │
│  └──────────┘    └─────┬────┘    └─────┬────┘         │
└────────────────────────┼───────────────┼───────────────┘
                         │               │
                         ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN LAYER                       │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │   Solana Escrow Smart Contract       │              │
│  │   • Time-locked PDAs                 │              │
│  │   • Signature verification           │              │
│  │   • Automated refund execution       │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    ORACLE LAYER                         │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   Verifier   │────────▶│ Multi-Oracle │            │
│  │    Oracle    │         │  Consensus   │            │
│  │ (Quality AI) │         │ (Phase 2)    │            │
│  └──────────────┘         └──────────────┘            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                          │
│                                                         │
│  ┌──────────┐              ┌──────────┐               │
│  │ KAMIYO   │              │Reputation│               │
│  │   API    │              │ Database │               │
│  └──────────┘              └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## Payment and Dispute Flow

```mermaid
sequenceDiagram
    participant Client
    participant SDK
    participant Escrow
    participant API
    participant Verifier

    Client->>SDK: Pay 0.01 SOL
    SDK->>Escrow: Create time-locked escrow
    Escrow-->>SDK: Escrow created
    SDK->>API: Request data
    API-->>SDK: Return exploit data

    alt Quality Check Passes
        SDK->>Escrow: Release funds
        Escrow->>API: Transfer 0.01 SOL
    else Quality Check Fails
        SDK->>Verifier: File dispute
        Verifier->>Verifier: Calculate quality score
        Note over Verifier: Semantic: 72%<br/>Completeness: 40%<br/>Freshness: 100%<br/>Score: 65/100
        Verifier->>Escrow: Submit signed assessment
        Escrow->>Escrow: Execute refund split
        Escrow->>Client: Refund 0.0035 SOL (35%)
        Escrow->>API: Pay 0.0065 SOL (65%)
    end
```

### ASCII Version

```
CLIENT          SDK         ESCROW        API       VERIFIER
  │              │             │            │            │
  ├─Pay 0.01 SOL─▶            │            │            │
  │              ├─Create──────▶           │            │
  │              │  Escrow     │            │            │
  │              ◀─Created─────┤            │            │
  │              │             │            │            │
  │              ├─Request data─────────────▶           │
  │              ◀─Exploit data──────────────           │
  │              │             │            │            │
  │              │             │            │            │
  │         ┌────┴────┐        │            │            │
  │         │ Quality │        │            │            │
  │         │  Check  │        │            │            │
  │         └────┬────┘        │            │            │
  │              │             │            │            │
  │         ╔════╧════╗        │            │            │
  │         ║  FAIL   ║        │            │            │
  │         ╚════╤════╝        │            │            │
  │              │             │            │            │
  │              ├─File dispute────────────────────────▶ │
  │              │             │            │            │
  │              │             │            │  ┌─────────┴────────┐
  │              │             │            │  │ Calculate Score  │
  │              │             │            │  │ • Semantic: 72%  │
  │              │             │            │  │ • Complete: 40%  │
  │              │             │            │  │ • Fresh: 100%    │
  │              │             │            │  │ ───────────────  │
  │              │             │            │  │ Score: 65/100    │
  │              │             │            │  │ Refund: 35%      │
  │              │             │            │  └─────────┬────────┘
  │              │             │            │            │
  │              │             ◀──Sign assessment────────┤
  │              │             │            │            │
  │              │          ┌──┴───┐        │            │
  │              │          │Split │        │            │
  │              │          │Refund│        │            │
  │              │          └──┬───┘        │            │
  │              │             │            │            │
  │    ◀─────────────Refund────┤            │            │
  │   0.0035 SOL  │      35%   │            │            │
  │              │             │            │            │
  │              │             ├──Pay───────▶           │
  │              │             │ 0.0065 SOL │            │
  │              │             │    65%     │            │
```

---

## Quality Scoring Pipeline

```mermaid
graph LR
    subgraph "Input"
        Query[Original Query]
        Data[Response Data]
        Criteria[Expected Criteria]
    end

    subgraph "Quality Factors"
        Semantic[Semantic Similarity<br/>40% weight]
        Complete[Completeness<br/>40% weight]
        Fresh[Freshness<br/>20% weight]
    end

    subgraph "Scoring"
        Calc[Weighted<br/>Calculation]
        Score[Quality Score<br/>0-100]
    end

    subgraph "Refund Logic"
        High[80-100: No refund]
        Med[50-79: Partial<br/>sliding scale]
        Low[0-49: 100% refund]
    end

    Query --> Semantic
    Data --> Semantic
    Data --> Complete
    Criteria --> Complete
    Data --> Fresh

    Semantic --> Calc
    Complete --> Calc
    Fresh --> Calc

    Calc --> Score

    Score --> High
    Score --> Med
    Score --> Low

    style Semantic fill:#f9f
    style Complete fill:#9ff
    style Fresh fill:#ff9
    style Score fill:#9f9
```

### Detailed Breakdown

```
┌──────────────────────────────────────────────────────────────┐
│                  QUALITY SCORING ALGORITHM                   │
└──────────────────────────────────────────────────────────────┘

INPUT
┌─────────────────────┐
│ Original Query      │ → "Uniswap V3 exploits on Ethereum"
├─────────────────────┤
│ Response Data       │ → 3 exploits (Curve, Euler, Mango)
├─────────────────────┤
│ Expected Criteria   │ → min 5 records, required fields
└─────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    MULTI-FACTOR SCORING                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────┐                     │
│  │ SEMANTIC SIMILARITY (40%)          │                     │
│  │ ──────────────────────────────     │                     │
│  │ • Sentence embedding: Query        │                     │
│  │ • Sentence embedding: Data         │                     │
│  │ • Cosine similarity calculation    │                     │
│  │ • Result: 0.72 (72%)               │                     │
│  └────────────────────────────────────┘                     │
│           │                                                  │
│           │                                                  │
│  ┌────────────────────────────────────┐                     │
│  │ COMPLETENESS (40%)                 │                     │
│  │ ──────────────────────────────     │                     │
│  │ • Required fields present: 80%     │                     │
│  │ • Minimum records met: No (3/5)    │                     │
│  │ • Correct protocols: No            │                     │
│  │ • Result: 0.40 (40%)               │                     │
│  └────────────────────────────────────┘                     │
│           │                                                  │
│           │                                                  │
│  ┌────────────────────────────────────┐                     │
│  │ FRESHNESS (20%)                    │                     │
│  │ ──────────────────────────────     │                     │
│  │ • Data age check                   │                     │
│  │ • Within 30 days: Yes              │                     │
│  │ • Result: 1.00 (100%)              │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                   WEIGHTED CALCULATION                       │
└──────────────────────────────────────────────────────────────┘

  Quality = (0.72 × 0.4) + (0.40 × 0.4) + (1.00 × 0.2)
          = 0.288 + 0.160 + 0.200
          = 0.648
          = 64.8/100 ≈ 65/100

           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    REFUND CALCULATION                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Score: 65/100 → Falls in 50-79 range                       │
│                                                              │
│  Refund = 100% - Quality Score                              │
│         = 100% - 65%                                         │
│         = 35%                                                │
│                                                              │
│  Client receives: 0.01 × 0.35 = 0.0035 SOL                  │
│  API receives:    0.01 × 0.65 = 0.0065 SOL                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Multi-Oracle Consensus (Phase 2)

```mermaid
graph TB
    subgraph "Dispute Trigger"
        Dispute[Dispute Filed]
        Amount{Amount > 1 SOL?}
    end

    subgraph "Oracle Selection"
        Random[Random Selection]
        Oracle1[Oracle A]
        Oracle2[Oracle B]
        Oracle3[Oracle C]
    end

    subgraph "Assessment"
        Score1[Score: 65]
        Score2[Score: 68]
        Score3[Score: 20]
    end

    subgraph "Consensus"
        Median[Median: 66]
        Outlier[Outlier Detection<br/>Threshold: 1.5 std dev]
        Slash[Slash Oracle C]
    end

    subgraph "Resolution"
        Refund[Execute Refund: 34%]
    end

    Dispute --> Amount
    Amount -->|Yes| Random
    Amount -->|No| Oracle1
    Random --> Oracle1
    Random --> Oracle2
    Random --> Oracle3

    Oracle1 --> Score1
    Oracle2 --> Score2
    Oracle3 --> Score3

    Score1 --> Median
    Score2 --> Median
    Score3 --> Median

    Median --> Outlier
    Outlier --> Slash
    Slash --> Refund

    style Score3 fill:#f99
    style Slash fill:#f99
    style Median fill:#9f9
```

### Consensus Algorithm

```
┌──────────────────────────────────────────────────────────────┐
│              MULTI-ORACLE CONSENSUS MECHANISM                │
└──────────────────────────────────────────────────────────────┘

PHASE 1: ORACLE SELECTION
┌────────────────────────────────────────────────────────────┐
│  Random Selection Algorithm                                │
│  ────────────────────────────                              │
│  • VRF-based randomness (Solana)                          │
│  • Select 3 from staked oracle pool                       │
│  • 10 SOL minimum stake required                          │
│  • Exclude recently selected oracles                      │
└────────────────────────────────────────────────────────────┘

PHASE 2: PARALLEL ASSESSMENT
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Oracle A  →  Quality Score: 65  ──┐                      │
│  Oracle B  →  Quality Score: 68  ──┼─→  [Collect]        │
│  Oracle C  →  Quality Score: 20  ──┘                      │
│               (Outlier!)                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

PHASE 3: STATISTICAL ANALYSIS
┌────────────────────────────────────────────────────────────┐
│  Median Calculation                                        │
│  ─────────────────                                         │
│  Scores: [20, 65, 68]                                      │
│  Sorted: [20, 65, 68]                                      │
│  Median: 65                                                │
│                                                            │
│  Outlier Detection                                         │
│  ─────────────────                                         │
│  Mean: 51                                                  │
│  Std Dev: 26.8                                             │
│  Threshold: 1.5 × 26.8 = 40.2                             │
│                                                            │
│  Oracle C (20) is outlier:                                │
│  |20 - 51| = 31 > 40.2? No, but...                        │
│  |20 - 66.5| = 46.5 > 40.2? Yes! → SLASH                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

PHASE 4: SLASHING & RESOLUTION
┌────────────────────────────────────────────────────────────┐
│  Slashing Tiers                                            │
│  ──────────────                                            │
│  1st offense:  Warning + flag                             │
│  2nd offense:  10% stake slash                            │
│  3rd offense:  50% stake slash                            │
│  4th offense:  100% stake slash + permanent ban           │
│                                                            │
│  Final Score: 66 (median of 65, 68)                       │
│  Refund: 34%                                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Trust and Security Model

```mermaid
graph TB
    subgraph "Trust Pillars"
        Audit[On-Chain Audit Trail]
        Crypto[Cryptographic Verification]
        Objective[Objective Scoring]
        Reputation[Reputation System]
    end

    subgraph "Security Mechanisms"
        PDA[PDA-Based Escrow]
        TimeLock[Time-Lock Protection]
        RateLimit[Rate Limiting]
        DisputeCost[Dynamic Dispute Costs]
    end

    subgraph "Attack Prevention"
        Sybil[Sybil Attack Prevention]
        Oracle[Oracle Collusion Detection]
        Spam[Spam Protection]
        Exit[Exit Scam Protection]
    end

    Audit --> PDA
    Crypto --> PDA
    Objective --> Oracle
    Reputation --> Sybil

    PDA --> Exit
    TimeLock --> Exit
    RateLimit --> Spam
    DisputeCost --> Spam

    Sybil --> Security[Comprehensive Security]
    Oracle --> Security
    Spam --> Security
    Exit --> Security

    style Security fill:#9f9
    style PDA fill:#9cf
    style Oracle fill:#fcf
```

---

## Component Interaction

```mermaid
graph LR
    subgraph "Frontend"
        UI[Web UI]
        CLI[CLI Tool]
    end

    subgraph "SDK Layer"
        SDK[TypeScript SDK]
        MCP[MCP Server]
    end

    subgraph "Backend Services"
        Verifier[Verifier Oracle]
        API[KAMIYO API]
    end

    subgraph "Blockchain"
        Program[Solana Program]
        RPC[RPC Endpoints]
    end

    subgraph "Storage"
        OnChain[(On-Chain State)]
        OffChain[(Off-Chain DB)]
    end

    UI --> SDK
    CLI --> SDK
    SDK --> MCP
    SDK --> Verifier
    SDK --> API
    SDK --> Program
    Program --> RPC
    RPC --> OnChain
    Verifier --> OffChain
    API --> OffChain

    style Program fill:#9cf
    style Verifier fill:#f9c
    style OnChain fill:#ff9
```

### Data Flow Example

```
┌─────────────────────────────────────────────────────────────┐
│          END-TO-END TRANSACTION DATA FLOW                   │
└─────────────────────────────────────────────────────────────┘

1. PAYMENT INITIATION
   ┌──────────┐
   │  Client  │ → payment(amount, recipient)
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │   SDK    │ → createEscrow(params)
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │  Solana  │ → PDA created, funds locked
   │  Program │    Time-lock: 7 days
   └──────────┘

2. DATA RETRIEVAL
   ┌──────────┐
   │   SDK    │ → fetchData(query)
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ KAMIYO   │ → exploit_data[]
   │   API    │    (Curve, Euler, Mango)
   └──────────┘

3. QUALITY CHECK
   ┌──────────┐
   │   SDK    │ → validateQuality(data, criteria)
   └────┬─────┘
        │
        ▼ (FAIL)
   ┌──────────┐
   │   SDK    │ → fileDispute(evidence)
   └────┬─────┘
        │
        ▼
   ┌──────────┐
   │ Verifier │ → calculateScore()
   │  Oracle  │    - Semantic: 72%
   └────┬─────┘    - Complete: 40%
        │          - Fresh: 100%
        │          → Score: 65
        ▼
   ┌──────────┐
   │  Sign    │ → Ed25519 signature
   │  Result  │
   └──────────┘

4. REFUND EXECUTION
   ┌──────────┐
   │  Solana  │ → verifySignature()
   │  Program │    validateScore()
   └────┬─────┘    executeRefund()
        │
        ├─→ Client:  0.0035 SOL (35%)
        └─→ API:     0.0065 SOL (65%)

5. REPUTATION UPDATE
   ┌──────────┐
   │ Off-Chain│ → updateReputation()
   │    DB    │    - Client: +partial_win
   └──────────┘    - API: +quality_issue
                   - Verifier: +assessment
```

---

## Legend

**Colors in Mermaid Diagrams**:
- 🔵 Blue (`#9cf`): Blockchain/Smart Contracts
- 🟣 Pink (`#f9c`, `#fcf`): Oracle/Verification Layer
- 🟢 Green (`#cfc`, `#9f9`): Client SDKs/Success States
- 🔴 Red (`#f99`): Errors/Slashing/Failures
- 🟡 Yellow (`#ff9`): Storage/State

**Symbols in ASCII Diagrams**:
- `─`, `│`, `┌`, `┐`, `└`, `┘`: Box borders
- `▶`, `◀`, `▼`, `▲`: Flow direction
- `├`, `┤`, `┬`, `┴`, `┼`: Connections
- `╔`, `╗`, `╚`, `╝`, `║`, `═`: Decision boxes

---

For implementation details, see:
- [TRUST_MODEL.md](../TRUST_MODEL.md) - Complete trust architecture
- [SECURITY_AUDIT.md](../SECURITY_AUDIT.md) - Security analysis
- [README.md](../README.md) - System overview
