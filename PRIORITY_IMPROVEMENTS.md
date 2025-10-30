# Priority Improvements for Hackathon Submission

**Deadline**: November 11, 2025
**Days Remaining**: 11 days

---

## Critical (Days 1-5)

### 1. Deploy Solana Program to Devnet
**Time**: 2-3 hours

```bash
cd packages/x402-escrow/
anchor build
anchor deploy --provider.cluster devnet
```

Add program ID and explorer link to README.md.

### 2. Add Anchor Tests
**Time**: 4-6 hours

Create `packages/x402-escrow/tests/escrow.ts`:
```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { X402Escrow } from "../target/types/x402_escrow";
import { expect } from "chai";

describe("x402-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.X402Escrow as Program<X402Escrow>;

  it("Initialize escrow", async () => {
    // Test escrow creation with time-lock
  });

  it("Mark dispute", async () => {
    // Test dispute marking
  });

  it("Resolve dispute with quality score", async () => {
    // Test sliding scale refunds (0%, 25%, 50%, 75%, 100%)
  });

  it("Release funds after time-lock", async () => {
    // Test automatic release
  });

  it("Reject invalid oracle signature", async () => {
    // Test security
  });
});
```

Run: `anchor test`

### 3. Add Verifier Tests
**Time**: 2-3 hours

Create `packages/x402-verifier/tests/test_verifier.py`:
```python
import pytest
from verifier import calculate_quality_score, calculate_refund

def test_quality_scoring():
    query = "Uniswap V3 exploits on Ethereum"
    data = [{"protocol": "Uniswap V3", "chain": "Ethereum"}]
    score = calculate_quality_score(query, data)
    assert 80 <= score <= 100

def test_sliding_scale_refunds():
    assert calculate_refund(95) == 0
    assert calculate_refund(75) == 25
    assert calculate_refund(55) == 50
    assert calculate_refund(35) == 75
    assert calculate_refund(15) == 100
```

Run: `pytest tests/`

### 4. Host Demo on Vercel
**Time**: 1 hour

```bash
cd demo/
# Add vercel.json:
{
  "version": 2,
  "builds": [{"src": "index.html", "use": "@vercel/static"}]
}

vercel --prod
```

Add link to README.md.

### 5. Create Demo Video
**Time**: 3-4 hours

Script (3 minutes):
- 0:00-0:30 - Problem statement
- 0:30-1:00 - Solution overview
- 1:00-1:30 - Interactive demo walkthrough
- 1:30-2:00 - Quality scoring algorithm
- 2:00-2:30 - Architecture (Solana + MCP + Verifier)
- 2:30-3:00 - Links to repo and docs

Tools: QuickTime or Loom for recording, iMovie for editing
Host: YouTube (unlisted) or Vimeo

---

## Important (Days 6-8)

### 6. Enhance Escrow Program
**Time**: 3-4 hours

Add to `lib.rs`:
- Event emissions for indexing
- Comprehensive error codes
- Ed25519 signature verification
- Time-lock enforcement validation
- Dispute window checks

### 7. Add Deployment Documentation
**Time**: 1-2 hours

Create `DEPLOYMENT.md`:
```markdown
# Deployment Guide

## Prerequisites
- Solana CLI
- Anchor 0.29+
- Devnet SOL

## Deploy Escrow Program
\`\`\`bash
cd packages/x402-escrow
anchor build
anchor deploy --provider.cluster devnet
\`\`\`

## Deploy Verifier Oracle
\`\`\`bash
cd packages/x402-verifier
pip install -r requirements.txt
python verifier.py --host 0.0.0.0 --port 8001
\`\`\`

## Environment Variables
[Complete .env setup]
```

### 8. Add Project Documentation
**Time**: 1 hour

Create `CONTRIBUTING.md`:
```markdown
# Contributing

## Development Setup
[Setup instructions]

## Pull Request Process
[PR guidelines]

## Code Style
- Rust: cargo fmt
- Python: black
- TypeScript: prettier
```

Create `SECURITY.md`:
```markdown
# Security Policy

## Reporting Vulnerabilities
Email: security@kamiyo.ai

## Security Considerations
- Oracle signature verification
- PDA security
- Time-lock enforcement
```

---

## Optional (Days 9-10)

### 9. Add CI/CD Pipeline
**Time**: 2 hours

Create `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Rust
        uses: actions-rs/toolchain@v1
      - name: Run Anchor tests
        run: cd packages/x402-escrow && anchor test
      - name: Run Python tests
        run: cd packages/x402-verifier && pytest
```

### 10. Security Audit
**Time**: 2-3 hours

- Run `cargo clippy` on Rust code
- Run `anchor verify` on deployed program
- Test edge cases (invalid signatures, expired disputes)
- Document potential attack vectors

---

## Final Day (Day 11)

### Testing Checklist
- [ ] Escrow program deployed to devnet
- [ ] Anchor tests passing
- [ ] Verifier tests passing
- [ ] Demo hosted and accessible
- [ ] Video demo uploaded and linked
- [ ] All documentation updated
- [ ] Explorer links working
- [ ] README.md has testnet links

### Submission Package
- GitHub repo: https://github.com/x402kamiyo/x402resolve
- Demo video: [YouTube/Vimeo link]
- Live demo: [Vercel link]
- Deployed program: [Solana Explorer link]
- Documentation: README.md, HACKATHON.md, docs/

---

## Timeline

**Days 1-2**: Deploy + Tests (escrow and verifier)
**Day 3**: Host demo + Create video
**Days 4-5**: Enhance code + Add docs
**Days 6-7**: CI/CD + Security + Polish
**Day 8-9**: Integration testing + Bug fixes
**Day 10**: Final testing + Documentation review
**Day 11**: Submission + Buffer

---

## Next Actions

1. Deploy Solana program to devnet (30 min)
2. Add basic Anchor tests (2 hours)
3. Host demo on Vercel (30 min)
4. Start video script (30 min)
5. Add pytest for verifier (1 hour)
