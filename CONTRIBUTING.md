# Contributing to x402Resolve

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31+

### Clone Repository

```bash
git clone https://github.com/x402kamiyo/x402resolve.git
cd x402resolve
```

### Install Dependencies

**Escrow Program:**
```bash
cd packages/x402-escrow
npm install
anchor build
```

**Verifier Oracle:**
```bash
cd packages/x402-verifier
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**SDK:**
```bash
cd packages/x402-sdk
npm install
npm run build
```

**MCP Server:**
```bash
cd packages/mcp-server
pip install -r requirements.txt
```

## Code Style

### Rust

Follow standard Rust conventions:

```rust
// Use descriptive variable names
let escrow_account = &mut ctx.accounts.escrow;

// Document public functions
/// Initialize escrow with time-lock
pub fn initialize_escrow(
    ctx: Context<InitializeEscrow>,
    amount: u64,
) -> Result<()> {
    // Implementation
}

// Error handling
require!(
    escrow.status == EscrowStatus::Active,
    EscrowError::InvalidStatus
);
```

**Formatting:**
```bash
cargo fmt
cargo clippy
```

### Python

Follow PEP 8 style guide:

```python
# Type hints for all functions
def calculate_quality_score(
    query: str,
    data: Dict,
    criteria: List[str]
) -> tuple[float, str]:
    """
    Calculate quality score

    Args:
        query: Original user query
        data: Received data
        criteria: Expected criteria

    Returns:
        Tuple of (score, reasoning)
    """
    pass

# Use descriptive variable names
semantic_score = self.calculate_semantic_similarity(query, data)
```

**Formatting:**
```bash
black .
flake8 .
mypy .
```

### TypeScript

Follow standard TypeScript conventions:

```typescript
// Use interfaces for data structures
interface DisputeParams {
  transactionId: string;
  reason: string;
  evidence: Evidence;
}

// Type all function parameters and returns
async function fileDispute(params: DisputeParams): Promise<DisputeResult> {
  // Implementation
}

// Use async/await
const result = await client.dispute(params);
```

**Formatting:**
```bash
npm run lint
npm run format
```

## Testing

### Run All Tests

**Anchor Tests:**
```bash
cd packages/x402-escrow
anchor test
```

**Python Tests:**
```bash
cd packages/x402-verifier
pytest tests/ -v --cov=. --cov-report=html
```

**SDK Tests:**
```bash
cd packages/x402-sdk
npm test
```

### Writing Tests

**Anchor Test Example:**
```typescript
describe("resolve_dispute", () => {
  it("resolves with 50% refund for score 50", async () => {
    // Setup
    const qualityScore = 50;
    const refundPercentage = 50;

    // Execute
    await program.methods
      .resolveDispute(qualityScore, refundPercentage, signature)
      .accounts({ /* ... */ })
      .rpc();

    // Assert
    const escrow = await program.account.escrow.fetch(escrowPda);
    expect(escrow.status).to.deep.equal({ resolved: {} });
  });
});
```

**Python Test Example:**
```python
def test_semantic_similarity(self):
    oracle = VerifierOracle()
    query = "Uniswap V3 exploits"
    data = "Uniswap V3 security incidents"

    score = oracle.calculate_semantic_similarity(query, data)

    assert score > 0.7, "Similar text should score > 0.7"
```

### Test Coverage

Maintain minimum 80% test coverage:

```bash
# Python coverage
pytest --cov=. --cov-report=term-missing

# SDK coverage
npm test -- --coverage
```

## Pull Request Process

### 1. Create Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/fixes

### 2. Make Changes

- Write clean, documented code
- Add tests for new functionality
- Update documentation as needed

### 3. Test Changes

```bash
# Run all tests
./scripts/test-all.sh

# Check formatting
cargo fmt --check
black --check .
npm run lint
```

### 4. Commit Changes

Use conventional commits format:

```bash
git commit -m "feat: add batch dispute resolution"
git commit -m "fix: resolve signature verification error"
git commit -m "docs: update deployment guide"
git commit -m "test: add edge case tests for quality scoring"
```

Commit message format:
```
<type>: <description>

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `test` - Tests
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `chore` - Build/tool changes

### 5. Push Branch

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your branch
4. Fill in PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### 7. Review Process

- Maintainers will review your PR
- Address feedback and requested changes
- Keep PR focused and manageable size
- Squash commits before merge if requested

## Project Structure

```
x402resolve/
├── packages/
│   ├── x402-escrow/       # Solana program
│   │   ├── programs/
│   │   ├── tests/
│   │   └── Anchor.toml
│   ├── x402-verifier/     # Python oracle
│   │   ├── verifier.py
│   │   └── tests/
│   ├── x402-sdk/          # TypeScript SDK
│   │   ├── src/
│   │   └── tests/
│   └── mcp-server/        # MCP server
│       ├── server.py
│       └── tools/
├── examples/              # Integration examples
├── docs/                  # Documentation
└── scripts/               # Build/test scripts
```

## Adding New Features

### Escrow Program

1. Add instruction to `lib.rs`
2. Add tests to `tests/escrow.ts`
3. Update SDK to support new instruction
4. Document in README

### Verifier Oracle

1. Add method to `VerifierOracle` class
2. Add endpoint to FastAPI app
3. Add tests to `test_verifier.py`
4. Update API documentation

### SDK

1. Add method to `KamiyoClient` class
2. Add type definitions
3. Add tests
4. Update README with examples

### MCP Server

1. Add tool to `tools/` directory
2. Register tool in `server.py`
3. Add tests
4. Update MCP configuration docs

## Documentation

### Code Comments

**Do:**
```rust
// Calculate refund based on quality score (0-100)
// Sliding scale: 80+ = 0%, 50-79 = partial, <50 = 100%
let refund_amount = calculate_refund(quality_score, escrow_amount);
```

**Don't:**
```rust
// Set x to 5
let x = 5;
```

### README Updates

Update relevant README files when:
- Adding new features
- Changing APIs
- Updating dependencies
- Adding configuration options

### API Documentation

Document all public APIs:

**Rust:**
```rust
/// Resolve dispute with verifier oracle signature
///
/// # Arguments
/// * `quality_score` - Quality score (0-100)
/// * `refund_percentage` - Refund percentage (0-100)
/// * `signature` - Ed25519 signature from verifier
///
/// # Errors
/// * `InvalidQualityScore` - Score exceeds 100
/// * `InvalidSignature` - Signature verification failed
pub fn resolve_dispute(/* ... */) -> Result<()>
```

**Python:**
```python
def calculate_quality_score(
    self,
    query: str,
    data: Dict,
    criteria: List[str]
) -> tuple[float, str]:
    """
    Calculate overall quality score.

    Args:
        query: Original user query
        data: API response data
        criteria: Expected data criteria

    Returns:
        Tuple of (quality_score 0-100, reasoning string)

    Example:
        >>> score, reason = oracle.calculate_quality_score(
        ...     "Uniswap exploits",
        ...     {"exploits": [...]},
        ...     ["Uniswap", "Ethereum"]
        ... )
    """
```

## Security

### Reporting Vulnerabilities

See [SECURITY.md](SECURITY.md) for vulnerability reporting process.

### Security Best Practices

- Never commit private keys
- Validate all user inputs
- Use secure random generation
- Follow principle of least privilege
- Keep dependencies updated

### Code Review Checklist

- [ ] Input validation
- [ ] Error handling
- [ ] Integer overflow checks
- [ ] Access control
- [ ] Signature verification
- [ ] No hardcoded secrets

## Release Process

### Version Numbering

Follow semantic versioning (SemVer):

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (patch: bug fix)
1.0.1 → 1.1.0 (minor: new feature, backwards compatible)
1.1.0 → 2.0.0 (major: breaking change)
```

### Creating Release

1. Update version numbers
2. Update CHANGELOG.md
3. Create git tag
4. Deploy to production
5. Create GitHub release

## Getting Help

- **Documentation:** [docs/](./docs/)
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
