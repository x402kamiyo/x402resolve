# Security Policy

## Reporting Vulnerabilities

### Process

If you discover a security vulnerability in x402Resolve, please report it privately:

1. **Email:** security@kamiyo.ai
2. **Subject:** `[SECURITY] x402Resolve Vulnerability Report`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Acknowledgment:** Within 24 hours
- **Initial Assessment:** Within 72 hours
- **Fix Timeline:** Depends on severity
  - Critical: 1-3 days
  - High: 3-7 days
  - Medium: 7-14 days
  - Low: 14-30 days

### Disclosure Policy

- Do not publicly disclose vulnerability until patch is released
- We will credit you in release notes (if desired)
- Coordinated disclosure timeline: 90 days

## Security Considerations

### Escrow Program (Solana)

#### PDA Security

**Implementation:**
```rust
#[account(
    init,
    payer = agent,
    space = 8 + Escrow::INIT_SPACE,
    seeds = [b"escrow", transaction_id.as_bytes()],
    bump
)]
pub escrow: Account<'info, Escrow>
```

**Security Properties:**
- Deterministic addressing prevents collision attacks
- Unique transaction IDs ensure distinct PDAs
- Bump seed stored for verification

**Risks:**
- Transaction ID collision (mitigated by using UUIDs)
- Unauthorized PDA modification (mitigated by Anchor constraints)

#### Signature Verification

**Current Implementation:**
```rust
// Simplified signature verification
// TODO: Implement full Ed25519 verification
let verifier_pubkey = ctx.accounts.verifier.key();
msg!("Verifier: {}", verifier_pubkey);
```

**Status:** ⚠️ PLACEHOLDER - Production requires full Ed25519 verification

**Required Implementation:**
```rust
use solana_program::ed25519_program;

pub fn verify_signature(
    signature: &[u8; 64],
    message: &[u8],
    pubkey: &Pubkey
) -> Result<()> {
    // Verify Ed25519 signature on-chain
    require!(
        ed25519_verify(signature, message, pubkey),
        EscrowError::InvalidSignature
    );
    Ok(())
}
```

#### Integer Overflow

**Protected Operations:**
```rust
let refund_amount = (escrow.amount as u128)
    .checked_mul(refund_percentage as u128)
    .unwrap()
    .checked_div(100)
    .unwrap() as u64;
```

**Security:** Uses `checked_mul` and `checked_div` to prevent overflow

#### Access Control

**Agent-only Operations:**
```rust
require!(
    ctx.accounts.agent.key() == escrow.agent,
    EscrowError::Unauthorized
);
```

**Time-lock Enforcement:**
```rust
let can_release = ctx.accounts.agent.key() == escrow.agent
    || clock.unix_timestamp >= escrow.expires_at;
```

### Verifier Oracle (Python)

#### Ed25519 Signing

**Implementation:**
```python
import nacl.signing

VERIFIER_PRIVATE_KEY = nacl.signing.SigningKey.generate()

def sign_result(transaction_id: str, quality_score: int) -> str:
    message = f"{transaction_id}:{quality_score}".encode()
    signed = self.signing_key.sign(message)
    return signed.signature.hex()
```

**Security Considerations:**
- Private key must be stored in secure vault (HSM/KMS)
- Rotate keys periodically
- Monitor for unauthorized signing attempts

**Production Key Management:**
```python
# Do NOT use generated keys in production
# Load from secure environment
import os
from base64 import b64decode

VERIFIER_PRIVATE_KEY = nacl.signing.SigningKey(
    b64decode(os.environ['VERIFIER_PRIVATE_KEY'])
)
```

#### Input Validation

**All Endpoints:**
```python
class QualityVerificationRequest(BaseModel):
    original_query: str = Field(..., max_length=10000)
    transaction_id: str = Field(..., regex=r'^tx_[a-zA-Z0-9]+$')
    expected_criteria: List[str] = Field(..., max_items=50)
```

**Validation Rules:**
- Max query length: 10,000 chars
- Transaction ID format: `tx_[alphanumeric]`
- Max criteria items: 50

#### Rate Limiting

**Required for Production:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/verify-quality")
@limiter.limit("10/minute")
async def verify_quality(request: Request):
    pass
```

**Recommended Limits:**
- `/verify-quality`: 10 requests/minute per IP
- `/public-key`: 100 requests/minute per IP

#### Model Security

**Sentence Transformers:**
```python
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
```

**Considerations:**
- Model loaded from trusted source
- No user-supplied model paths
- Version pinned in requirements.txt

### SDK (TypeScript)

#### Private Key Handling

**User Responsibility:**
```typescript
// Users provide wallet, SDK never accesses private keys
const client = new KamiyoClient({
  walletPublicKey: wallet.publicKey
});

// Transactions signed by user's wallet
await client.pay({ amount: 0.01 });
```

**Security:** SDK never has access to private keys

#### RPC Endpoint Security

**Configuration:**
```typescript
const client = new KamiyoClient({
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
});
```

**Recommendations:**
- Use authenticated RPC endpoints in production
- Rate limit RPC calls
- Monitor for RPC endpoint abuse

#### Input Sanitization

**All User Inputs:**
```typescript
function validateTransactionId(txId: string): boolean {
  return /^tx_[a-zA-Z0-9]{10,64}$/.test(txId);
}

if (!validateTransactionId(params.transactionId)) {
  throw new Error('Invalid transaction ID format');
}
```

### MCP Server

#### Tool Execution

**Sandboxing:**
```python
# All MCP tools run in isolated context
# No filesystem access
# No network access except to KAMIYO API
```

**Authentication:**
```python
# API key required for KAMIYO API access
headers = {
    'X-API-Key': os.environ['KAMIYO_API_KEY']
}
```

## Audit Status

### Current Status

- ❌ **Formal Security Audit:** Not yet conducted
- ✅ **Internal Code Review:** Completed
- ✅ **Dependency Scanning:** Automated via GitHub
- ⚠️ **Penetration Testing:** Planned

### Planned Audits

1. **Smart Contract Audit** (Q1 2026)
   - Escrow program logic
   - PDA security
   - Signature verification
   - Access control

2. **API Security Audit** (Q1 2026)
   - Verifier oracle endpoints
   - Rate limiting
   - Input validation
   - Key management

3. **Integration Testing** (Q2 2026)
   - End-to-end security testing
   - Oracle manipulation attempts
   - Dispute resolution edge cases

## Known Issues

### 1. Signature Verification Placeholder

**Component:** Escrow Program
**Severity:** Critical
**Status:** ⚠️ Known Issue

**Description:**
Current implementation logs verifier pubkey but doesn't verify Ed25519 signature on-chain.

**Mitigation:**
- Testnet only deployment
- Full verification required for mainnet

**Fix Timeline:** Before mainnet deployment

### 2. Oracle Key Management

**Component:** Verifier Oracle
**Severity:** High
**Status:** ⚠️ Known Issue

**Description:**
Generated keys used in development. Production requires secure key storage.

**Mitigation:**
- Development/testnet only
- HSM/KMS integration planned

**Fix Timeline:** Before mainnet deployment

### 3. Rate Limiting

**Component:** Verifier Oracle
**Severity:** Medium
**Status:** Planned

**Description:**
No rate limiting on verification endpoints.

**Mitigation:**
- Private API during testing
- Cloudflare protection planned

**Fix Timeline:** Before public beta

## Security Best Practices

### For Users

1. **Protect Private Keys**
   - Never share wallet private keys
   - Use hardware wallets for large amounts
   - Verify transaction details before signing

2. **Verify Program IDs**
   - Check program ID matches official deployment
   - Use Solana Explorer to verify
   - Beware of phishing attempts

3. **Test First**
   - Use devnet for testing
   - Start with small amounts
   - Verify dispute resolution flow

### For Developers

1. **Code Review**
   - Review all changes before merge
   - Use security checklist
   - Test edge cases

2. **Dependency Management**
   - Pin dependency versions
   - Regular security updates
   - Audit new dependencies

3. **Testing**
   - Maintain 80%+ test coverage
   - Test security-critical paths
   - Fuzz test inputs

4. **Secrets Management**
   - Never commit secrets
   - Use environment variables
   - Rotate keys regularly

## Incident Response

### Process

1. **Detection**
   - Monitoring alerts
   - User reports
   - Security researcher disclosure

2. **Assessment**
   - Severity classification
   - Impact analysis
   - Exploit verification

3. **Containment**
   - Disable affected components
   - Notify users
   - Preserve evidence

4. **Remediation**
   - Deploy fixes
   - Verify fix effectiveness
   - Resume operations

5. **Post-Mortem**
   - Root cause analysis
   - Prevention measures
   - Documentation update

### Contact

**Security Team:** security@kamiyo.ai
**PGP Key:** Available on request
**Response Time:** 24 hours max

## Compliance

### Standards

- OWASP Top 10 (Web Application Security)
- CWE Top 25 (Software Weaknesses)
- Solana Program Security Best Practices

### Regular Reviews

- Quarterly security reviews
- Annual penetration testing
- Continuous dependency scanning

## Updates

This security policy is reviewed and updated quarterly.

**Last Updated:** October 30, 2025
**Next Review:** January 30, 2026
