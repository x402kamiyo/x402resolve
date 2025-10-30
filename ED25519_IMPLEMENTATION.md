# Ed25519 Signature Verification Implementation

## Overview

Implemented proper Ed25519 signature verification for the x402Resolve escrow program to ensure verifier oracle signatures are cryptographically validated on-chain.

## Implementation Details

### Components Added

**1. Helper Function** (`lib.rs:62-134`)
```rust
fn verify_ed25519_signature(
    instructions_sysvar: &AccountInfo,
    signature: &[u8; 64],
    verifier_pubkey: &Pubkey,
    message: &[u8],
) -> Result<()>
```

Validates that an Ed25519 instruction exists in the transaction and verifies:
- Signature matches expected value
- Public key matches verifier
- Message matches expected format

**2. Updated ResolveDispute Context** (`lib.rs:490-492`)
```rust
#[account(address = INSTRUCTIONS_ID)]
pub instructions_sysvar: AccountInfo<'info>,
```

Added instructions sysvar account to access Ed25519 instruction data.

**3. Signature Verification** (`lib.rs:304-309`)
```rust
verify_ed25519_signature(
    &ctx.accounts.instructions_sysvar,
    &signature,
    ctx.accounts.verifier.key,
    message_bytes,
)?;
```

Replaces placeholder verification with proper Ed25519 validation.

## Security

### Ed25519 Instruction Format
The implementation parses Solana's Ed25519 instruction data:
- Byte 0: Number of signatures (must be 1)
- Bytes 2-3: Signature offset (u16)
- Bytes 6-7: Public key offset (u16)
- Bytes 10-11: Message offset (u16)
- Bytes 12-13: Message size (u16)
- Remaining: Signature + Public key + Message data

### Verification Steps
1. Load Ed25519 instruction from sysvar (expected at index 0)
2. Verify program ID is ed25519_program::ID
3. Parse instruction data structure
4. Validate signature, public key, and message match expected values

### Message Format
```
"{transaction_id}:{quality_score}"
```

Example: `"tx_123456_abc:85"`

## Usage

### Client-Side (TypeScript)
```typescript
import { Ed25519Program } from '@solana/web3.js';

// 1. Sign the message with verifier's private key
const message = `${transactionId}:${qualityScore}`;
const messageBytes = Buffer.from(message, 'utf8');
const signature = nacl.sign.detached(messageBytes, verifierKeypair.secretKey);

// 2. Create Ed25519 verification instruction
const ed25519Ix = Ed25519Program.createInstructionWithPublicKey({
  publicKey: verifierKeypair.publicKey,
  message: messageBytes,
  signature: signature,
});

// 3. Add to transaction before resolve_dispute
const transaction = new Transaction();
transaction.add(ed25519Ix);
transaction.add(resolveDisputeIx);
```

### Verifier Oracle (Python)
```python
from nacl.signing import SigningKey
from nacl.encoding import RawEncoder

# Sign quality assessment
message = f"{transaction_id}:{quality_score}".encode('utf-8')
signing_key = SigningKey(verifier_private_key, encoder=RawEncoder)
signature = signing_key.sign(message, encoder=RawEncoder).signature

# Return signature and public key
return {
    "quality_score": quality_score,
    "refund_percentage": refund_percentage,
    "signature": list(signature),  # [u8; 64]
    "verifier_pubkey": str(signing_key.verify_key)
}
```

## Compute Units

Ed25519 verification adds ~30k-40k compute units due to:
- Ed25519Program instruction processing
- Instruction sysvar loading
- Signature validation
- Data parsing

## Testing

To test locally:
1. Generate verifier keypair
2. Sign message with private key
3. Create Ed25519 instruction
4. Call resolve_dispute with valid signature

## Production Considerations

1. **Verifier Registry**: Store approved verifier public keys on-chain
2. **Multi-Sig**: Require multiple verifier signatures for consensus
3. **Replay Protection**: Include timestamp or nonce in message
4. **Key Rotation**: Support verifier key updates

## References

- Solana Ed25519 Program: https://docs.solana.com/developing/runtime-facilities/programs#ed25519-program
- Instruction Sysvar: https://docs.solana.com/developing/runtime-facilities/sysvars#instructions
- Ed25519 Signature Scheme: RFC 8032
