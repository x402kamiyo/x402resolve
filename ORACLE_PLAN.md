# Production Testing Plan

## Current Status

### Completed
- ✅ Funded test wallet: `5PFae6U5UVBEzfmrWnkMpuMu6iifg915rkvZ1hk5vN1o` (~5 SOL)
- ✅ Created production E2E test suite (`production-e2e-test.js`)
- ✅ Installed Solana CLI 1.18.26 with cargo-build-sbf support
- ✅ Installed Anchor 0.29.0
- ✅ Updated Switchboard integration to v0.10.5 with correct import path:
  - Changed from: `use switchboard_on_demand::accounts::PullFeedAccountData`
  - Changed to: `use switchboard_on_demand::on_demand::accounts::pull_feed::PullFeedAccountData`
  - Cargo check passes with no errors (only warnings)
- ✅ Verified 6/8 tests passing in production-e2e-test.js

### Current Issue - Build Toolchain Compatibility

**Problem**: Anchor 0.29.0 + Solana 1.18.26 + Switchboard 0.10.5 + Rust lockfile v4 incompatibility

**Root Cause**: Cargo.lock file generated with Rust nightly (lockfile version 4) is incompatible with stable Rust 1.75.0 toolchain included with Solana 1.18.26

**Attempted Solutions**:
1. ❌ Agave 3.0.10 - Missing BPF SDK tools (cargo-build-sbf not included)
2. ❌ Anchor 0.30.1 - cargo build-bpf command not recognized
3. ❌ Wrapper scripts for cargo-build-bpf - Created infinite loops
4. ✅ Installed Solana 1.18.26 with BPF tools - SUCCESS
5. ⚠️ Build blocked by Cargo.lock version mismatch

**Next Steps**:
- Option A: Update Rust toolchain to nightly to support lockfile v4
- Option B: Regenerate Cargo.lock with stable Rust (requires removing cached lockfiles)
- Option C: Pin Rust version in CI/CD and regenerate all locks

### Remaining Issues

1. **Build System**
   - Cargo.lock version 4 requires nightly Rust (`-Znext-lockfile-bump`)
   - Current Rust: 1.75.0 (stable, shipped with Solana 1.18.26)
   - Need to either upgrade Rust or regenerate lockfiles

2. **Program Not Deployed**
   - Current program ID: `HEXRRGLnDZyjbYcZU8oUVhRTk2rQvFXFjXjw5Cj2ZUHc`
   - Status: Not deployed to devnet
   - Blocked by build issue

3. **Instruction Encoding Test**
   - Error: "offset is out of bounds"
   - Location: `production-e2e-test.js:238-240`
   - Cause: Buffer allocation or offset calculation issue in Ed25519 instruction data layout

## Next Steps (Requires Solana CLI)

### 1. Build and Deploy Program
```bash
cd packages/x402-escrow
solana-install init 1.18.0  # or latest stable
anchor build
anchor deploy --provider.cluster devnet
```

### 2. Update Program IDs
After deployment, update program ID in:
- `production-e2e-test.js:12`
- `test-production-oracle.ts:10`
- `docs/oracle-transactions.js:6`
- `docs/idl.json` (if needed)
- `packages/x402-escrow/programs/x402-escrow/src/lib.rs` (declare_id!)

### 3. Fix Instruction Encoding Bug
File: `production-e2e-test.js:195-259`

Current issue in testInstructionEncoding():
```javascript
// Line 238-240 - Buffer.set() offset issue
dataLayout.set(signature, sigOffset);    // sigOffset = 16
dataLayout.set(publicKey, pubkeyOffset);  // pubkeyOffset = 80
dataLayout.set(message, messageOffset);   // messageOffset = 112
```

Likely fix: Verify buffer size matches data requirements
```javascript
const totalSize = 1 + 2 + 2 + 2 + 2 + 2 + 2 + 2 + 64 + 32 + message.length;
// = 1 + 14 + 64 + 32 + message.length
// = 111 + message.length
```

### 4. Run Full Oracle Transaction Test
```bash
cd /Users/dennisgoslar/Projekter/kamiyo-x402-solana
npx ts-node test-production-oracle.ts
```

Expected flow:
1. Initialize reputation accounts (agent + API)
2. Create escrow with 0.01 SOL
3. Generate oracle quality assessment
4. Resolve dispute with Ed25519 signature verification
5. Verify refund distribution

### 5. Verify On-Chain Transactions
For each transaction signature returned:
```bash
solana confirm -v <SIGNATURE> --url devnet
# Or visit: https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

Verify:
- Transaction succeeded
- Logs show correct events (EscrowInitialized, DisputeResolved)
- Account balances updated correctly
- Reputation scores modified

### 6. Test Dashboard with Real Data
1. Open `docs/index.html` in browser
2. Connect Phantom wallet
3. Run Multi-Oracle demo
4. Verify:
   - Oracle signature generation works
   - Transaction submits to devnet
   - Explorer links show real transactions
   - Recent disputes section populates from chain
   - No simulation fallbacks triggered

### 7. Error Handling Tests
Test cases:
- Escrow already exists for transaction ID
- Insufficient balance for escrow creation
- Invalid quality score (>100 or <0)
- Mismatched Ed25519 signature
- Expired time lock
- Non-existent reputation account
- Invalid refund percentage

### 8. Edge Cases
- Quality score exactly 50 (boundary)
- Quality score exactly 80 (boundary)
- Time lock at MIN (3600) and MAX (2592000)
- Escrow amount at MIN (0.001 SOL) and MAX (1000 SOL)
- Concurrent dispute resolutions
- Same oracle resolving multiple disputes

## Test Artifacts

### Files Created
- `production-e2e-test.js` - Standalone Node.js test suite
- `test-production-oracle.ts` - Full transaction flow with Anchor
- `test123/` - Temporary dependency directory (can be deleted)

### Expected Outputs
1. Test summary with 8/8 passing
2. Transaction signatures for all on-chain operations
3. Explorer URLs for verification
4. Event logs confirming state transitions
5. Balance changes showing refund distribution

## Success Criteria

All tests passing (8/8):
- Program deployment verified
- Instruction encoding fixed
- Reputation initialization succeeds
- Escrow creation on-chain
- Dispute resolution with oracle signature
- Refund calculation and distribution
- Dashboard displays real chain data
- Error handling validates edge cases

## Dependencies

Required in codespace:
- Solana CLI (1.18.0+)
- Anchor CLI (0.29.0 or 0.31.1)
- Rust toolchain with cargo build-sbf
- Node.js 18+ with @solana/web3.js, tweetnacl, @coral-xyz/anchor
- Sufficient devnet SOL for deployment (~2-3 SOL)

## Wallet Info

Test wallet: `5PFae6U5UVBEzfmrWnkMpuMu6iifg915rkvZ1hk5vN1o`
Balance: 2 SOL (funded)
Oracle pubkey: `nowAfiByViBTf7X9wiVVaoC7PM8R5r7DzQ8Exch3kGP` (deterministic from seed)
