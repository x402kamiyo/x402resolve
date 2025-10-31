#!/bin/bash
# Check wallet balance and continue with execution plan if funded

echo "======================================================================"
echo " Wallet Balance Check"
echo "======================================================================"
echo ""

# Check balance using Node script
node scripts/get-wallet-info.js

echo ""
echo "======================================================================"
echo " Funding Reminder"
echo "======================================================================"
echo ""
echo "If balance is insufficient, request SOL from:"
echo "  https://dev-faucet.solanahub.app/"
echo ""
echo "Public Key: 7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b"
echo ""
echo "⏰ Try every 2 hours until you have ≥2.6 SOL"
echo ""
echo "Once funded, continue with:"
echo "  cd packages/x402-escrow"
echo "  anchor build"
echo "  anchor deploy"
echo ""
echo "======================================================================"
