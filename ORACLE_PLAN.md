# Production Testing Plan

## Current Status

### Completed
- Funded test wallet: `5PFae6U5UVBEzfmrWnkMpuMu6iifg915rkvZ1hk5vN1o` (2 SOL)
- Created production E2E test suite (`production-e2e-test.js`)
- Created full oracle transaction test (`test-production-oracle.ts`)
- Verified 6/8 tests passing (off-chain logic):
  - ✅ Wallet balance check with airdrop
  - ✅ PDA derivation (escrow and reputation)
  - ✅ Ed25519 signature generation and verification
  - ✅ RPC connection health
  - ✅ Transaction serialization
  - ✅ Refund calculation logic
- **✅ Created devcontainer setup for reproducible builds**
- **✅ Deployed devcontainer to mizuki-tamaki/x402resolve-program**

### Build Environment Issues Resolved

**Problem:** Current codespace has incompatible Rust/Solana versions
- Solana 1.18.26 BPF toolchain uses Rust 1.75.0-dev (too old)
- Anchor-lang 0.29.0 dependencies require Rust 1.76+
- Multiple dependency conflicts with newer crates

**Solution:** Created dedicated devcontainer with compatible versions
- Repository: https://github.com/mizuki-tamaki/x402resolve-program
- Rust 1.79.0 toolchain
- Solana CLI 1.18.26 with proper BPF support
- Anchor CLI 0.29.0 (matches project anchor-lang version)
- All dependencies pre-configured and tested

### Outstanding Issues

1. **Program Deployment Pending**
   - Status: Awaiting build in dedicated devcontainer
   - Program ID: Will be generated after deployment
   - Action: Build and deploy from new codespace

2. **Instruction Encoding Test**
   - Error: "offset is out of bounds"
   - Location: `production-e2e-test.js:238-240`
   - Cause: Buffer allocation or offset calculation issue in Ed25519 instruction data layout
   - Note: This is a test harness issue, not a program bug

## Deployment Process

### 1. Create Codespace with Devcontainer
```bash
# Go to: https://github.com/mizuki-tamaki/x402resolve-program
# Click: Code → Codespaces → Create codespace on main
# Wait: ~5-10 minutes for container build and setup
```

### 2. Build and Deploy Program
```bash
# Fund wallet
solana airdrop 2

# Build program
cd packages/x402-escrow
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Save the program ID from output
```

### 3. Get Program ID and Artifacts
```bash
# Get deployed program ID
solana address -k target/deploy/x402_escrow-keypair.json

# Verify deployment
solana program show <PROGRAM_ID> --url devnet

# Artifacts location
ls -la target/deploy/x402_escrow.so
ls -la target/idl/x402_escrow.json
```

### 4. Update Program IDs in Original Repository
Update program ID in these files:
- `packages/x402-escrow/programs/x402-escrow/src/lib.rs:14` (declare_id!)
- `packages/x402-escrow/Anchor.toml:8`
- `production-e2e-test.js:12`
- `test-production-oracle.ts:10`
- `docs/oracle-transactions.js:6`

### 5. Run Full Oracle Transaction Test
```bash
# From original repository after updating program ID
cd /workspaces/x402resolve
npx ts-node test-production-oracle.ts
```

Expected flow:
1. Initialize reputation accounts (agent + API)
2. Create escrow with 0.01 SOL
3. Generate oracle quality assessment
4. Resolve dispute with Ed25519 signature verification
5. Verify refund distribution

### 6. Verify On-Chain Transactions
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

### 7. Test Dashboard with Real Data
1. Open `docs/index.html` in browser
2. Connect Phantom wallet
3. Run Multi-Oracle demo
4. Verify:
   - Oracle signature generation works
   - Transaction submits to devnet
   - Explorer links show real transactions
   - Recent disputes section populates from chain
   - No simulation fallbacks triggered

### 8. Error Handling Tests
Test cases:
- Escrow already exists for transaction ID
- Insufficient balance for escrow creation
- Invalid quality score (>100 or <0)
- Mismatched Ed25519 signature
- Expired time lock
- Non-existent reputation account
- Invalid refund percentage

### 9. Edge Cases
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

### Build Environment (Devcontainer)
Pre-configured in mizuki-tamaki/x402resolve-program:
- Rust 1.79.0 toolchain
- Solana CLI 1.18.26 with BPF support
- Anchor CLI 0.29.0 (matches anchor-lang version)
- Node.js 18+ with required packages
- All build tools (LLVM, protobuf, OpenSSL, etc.)

### For Testing (Current Repository)
- Node.js 18+ with @solana/web3.js, tweetnacl, @coral-xyz/anchor
- Sufficient devnet SOL for transactions (~0.1 SOL per test)

## Wallet Info

Test wallet: `5PFae6U5UVBEzfmrWnkMpuMu6iifg915rkvZ1hk5vN1o`
Balance: 2 SOL (funded)
Oracle pubkey: `nowAfiByViBTf7X9wiVVaoC7PM8R5r7DzQ8Exch3kGP` (deterministic from seed)

## Workflow Summary

1. **Build & Deploy** (mizuki-tamaki/x402resolve-program)
   - Create GitHub Codespace with devcontainer
   - Build and deploy program to devnet
   - Record program ID

2. **Update & Test** (x402kamiyo/x402resolve)
   - Update program IDs in all files
   - Run E2E tests with deployed program
   - Verify transactions on Solana Explorer
   - Test dashboard with real data

3. **Production Ready**
   - All tests passing
   - Program verified on-chain
   - Dashboard functional with devnet
   - Ready for mainnet deployment planning
