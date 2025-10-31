#!/bin/bash
# Automated funding loop - checks and reminds every 2 hours

echo "======================================================================"
echo " Automated Funding Loop Started"
echo "======================================================================"
echo ""
echo "This script will check balance every 2 hours"
echo "You'll need to manually request from: https://dev-faucet.solanahub.app/"
echo ""
echo "Public Key: 7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "======================================================================"

REQUIRED_SOL=2.6
CHECK_INTERVAL=7200  # 2 hours in seconds

while true; do
  echo ""
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Checking balance..."
  echo ""

  # Run the balance check
  node scripts/get-wallet-info.js > /tmp/balance_check.txt 2>&1

  # Display the result
  cat /tmp/balance_check.txt

  # Extract balance (simple grep approach)
  BALANCE=$(cat /tmp/balance_check.txt | grep "Current Balance:" | awk '{print $3}')

  if [ ! -z "$BALANCE" ]; then
    # Compare balance with required amount
    SUFFICIENT=$(echo "$BALANCE >= $REQUIRED_SOL" | bc -l 2>/dev/null || echo "0")

    if [ "$SUFFICIENT" = "1" ]; then
      echo ""
      echo "======================================================================"
      echo " ✓ SUFFICIENT FUNDS!"
      echo "======================================================================"
      echo ""
      echo "Balance: $BALANCE SOL (Required: $REQUIRED_SOL SOL)"
      echo ""
      echo "Ready to deploy! Run:"
      echo "  cd packages/x402-escrow"
      echo "  anchor build"
      echo "  anchor deploy"
      echo ""
      echo "======================================================================"
      exit 0
    fi
  fi

  echo ""
  echo "======================================================================"
  echo " ⏰ Next Check: $(date -d "+2 hours" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date '+%Y-%m-%d %H:%M:%S')"
  echo "======================================================================"
  echo ""
  echo "While waiting, request SOL from:"
  echo "  https://dev-faucet.solanahub.app/"
  echo ""
  echo "Enter public key: 7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b"
  echo ""
  echo "Sleeping for 2 hours..."
  echo ""

  # Sleep for 2 hours
  sleep $CHECK_INTERVAL
done
