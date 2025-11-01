#!/bin/bash

# Wallet generation script for x402Resolve examples
# Generates Solana keypairs for agent and API wallets

set -e

echo "=== x402Resolve Wallet Generator ==="
echo ""

# Create wallets directory if it doesn't exist
mkdir -p wallets

# Generate agent wallet
if [ -f "wallets/agent-wallet.json" ]; then
    echo "⚠️  Agent wallet already exists at wallets/agent-wallet.json"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping agent wallet generation"
    else
        solana-keygen new --no-bip39-passphrase --outfile wallets/agent-wallet.json --force
        echo "✓ Agent wallet generated"
    fi
else
    solana-keygen new --no-bip39-passphrase --outfile wallets/agent-wallet.json
    echo "✓ Agent wallet generated"
fi

# Generate API wallet
if [ -f "wallets/api-wallet.json" ]; then
    echo "⚠️  API wallet already exists at wallets/api-wallet.json"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping API wallet generation"
    else
        solana-keygen new --no-bip39-passphrase --outfile wallets/api-wallet.json --force
        echo "✓ API wallet generated"
    fi
else
    solana-keygen new --no-bip39-passphrase --outfile wallets/api-wallet.json
    echo "✓ API wallet generated"
fi

echo ""
echo "=== Wallet Public Keys ==="
echo ""
echo "Agent wallet:"
solana-keygen pubkey wallets/agent-wallet.json
echo ""
echo "API wallet:"
solana-keygen pubkey wallets/api-wallet.json

echo ""
echo "=== Requesting Devnet Airdrops ==="
echo ""

# Request airdrops for devnet testing
AGENT_PUBKEY=$(solana-keygen pubkey wallets/agent-wallet.json)
API_PUBKEY=$(solana-keygen pubkey wallets/api-wallet.json)

echo "Agent wallet airdrop (2 SOL)..."
solana airdrop 2 "$AGENT_PUBKEY" --url devnet || echo "⚠️  Airdrop failed (rate limit?)"

echo "API wallet airdrop (1 SOL)..."
solana airdrop 1 "$API_PUBKEY" --url devnet || echo "⚠️  Airdrop failed (rate limit?)"

echo ""
echo "=== Wallet Setup Complete ==="
echo ""
echo "Wallets saved to: $(pwd)/wallets/"
echo ""
echo "To use in examples:"
echo "  export AGENT_WALLET=\$(pwd)/wallets/agent-wallet.json"
echo "  export API_WALLET=\$(pwd)/wallets/api-wallet.json"
echo ""
echo "Or copy to example directories:"
echo "  cp wallets/agent-wallet.json examples/with-dispute/"
echo "  cp wallets/api-wallet.json examples/with-dispute/"
echo ""
