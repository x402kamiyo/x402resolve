# Solana Development Container Setup

This devcontainer provides a complete Solana development environment with all necessary tools pre-installed.

## Quick Start

### Option 1: GitHub Codespaces

1. Go to your GitHub repository
2. Click "Code" → "Codespaces" → "Create codespace on main"
3. Wait for the container to build and setup to complete (~5-10 minutes)
4. The environment will be ready to use

### Option 2: VS Code Dev Containers

1. Install Docker Desktop
2. Install VS Code extension: "Dev Containers"
3. Open this repository in VS Code
4. Press `F1` and select "Dev Containers: Reopen in Container"
5. Wait for build and setup to complete

## What's Installed

- **Rust 1.79.0** - Compatible with Solana toolchain
- **Solana CLI 1.18.26** - Latest stable with proper BPF support
- **Anchor CLI 0.29.0** - Matches project anchor-lang version
- **Node.js 18** - For TypeScript tests and scripts
- All required build tools and dependencies

## Post-Setup Commands

After the container is ready:

```bash
# Check your wallet address
solana address

# Fund your devnet wallet (run multiple times if rate-limited)
solana airdrop 2

# Navigate to escrow package
cd packages/x402-escrow

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test --provider.cluster devnet
```

## Troubleshooting

### Airdrop Rate Limiting

If `solana airdrop` fails with rate limit error:
```bash
# Wait 30 seconds and try again
solana airdrop 1

# Or use a devnet faucet
# Visit: https://faucet.solana.com/
```

### Build Errors

If you encounter dependency errors:
```bash
# Clean and rebuild
cd packages/x402-escrow
rm -rf target
anchor clean
anchor build
```

### Anchor Version Mismatch

The project uses anchor-lang 0.29.0. To verify:
```bash
anchor --version  # Should show 0.29.0
```

## Program IDs

After deployment, update these files with your new program ID:
- `packages/x402-escrow/programs/x402-escrow/src/lib.rs` (declare_id!)
- `packages/x402-escrow/Anchor.toml`
- `production-e2e-test.js`
- `test-production-oracle.ts`
- `docs/oracle-transactions.js`

## Environment Variables

The setup automatically configures:
- Solana CLI to use devnet
- Generated keypair at `~/.config/solana/id.json`
- PATH includes Solana, Cargo, and AVM binaries

## Support

For issues with the devcontainer setup, check:
1. Docker is running
2. VS Code Dev Containers extension is installed
3. Sufficient disk space (recommended 10GB+)
4. Internet connection for package downloads
