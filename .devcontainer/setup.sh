#!/bin/bash
set -e

echo "Setting up Solana development environment..."

# Update system packages
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    pkg-config \
    libudev-dev \
    llvm \
    libclang-dev \
    protobuf-compiler \
    libssl-dev

# Install Rust (specific version compatible with Solana)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.79.0
source "$HOME/.cargo/env"

# Install Solana CLI (v1.18.26)
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Add to bashrc
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
echo 'export PATH="$HOME/.avm/bin:$PATH"' >> ~/.bashrc

# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Anchor CLI 0.29.0 (compatible with anchor-lang 0.29.0 in the project)
avm install 0.29.0
avm use 0.29.0

# Configure Solana for devnet
solana config set --url devnet

# Generate keypair if it doesn't exist
if [ ! -f "$HOME/.config/solana/id.json" ]; then
    solana-keygen new --no-bip39-passphrase
fi

# Install Node.js dependencies
cd /workspaces/x402resolve/packages/x402-escrow
yarn install || npm install

echo "✓ Solana development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Fund your devnet wallet: solana airdrop 2"
echo "2. Build the program: cd packages/x402-escrow && anchor build"
echo "3. Deploy to devnet: anchor deploy --provider.cluster devnet"
echo ""
echo "Your wallet address:"
solana address
