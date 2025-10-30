#!/bin/bash
set -e

echo "Building x402-escrow program..."
cd /workspaces/x402resolve/packages/x402-escrow

# Build the program
~/.cargo/bin/anchor build

echo ""
echo "Build complete!"
echo "Program ID: BtSoJmuFZCq8DmWbesuAbu7E6KJijeSeLLBUWTKC6x4P"
echo ""
echo "Next steps:"
echo "1. Deploy: anchor deploy"
echo "2. View on explorer: https://explorer.solana.com/address/BtSoJmuFZCq8DmWbesuAbu7E6KJijeSeLLBUWTKC6x4P?cluster=devnet"
echo "3. Run tests: anchor test"
