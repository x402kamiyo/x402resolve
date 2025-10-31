# Devnet SOL Faucet Instructions

## Wallet Information
- **Public Key**: `7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b`
- **Wallet File**: `.solana/x402-devnet-wallet.json`
- **Required**: 2.6 SOL for deployment
- **Recommended**: 5 SOL for buffer

## Primary Faucet (Try Every 2 Hours)
🔗 **https://dev-faucet.solanahub.app/**

### Steps:
1. Visit: https://dev-faucet.solanahub.app/
2. Enter public key: `7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b`
3. Complete captcha (if required)
4. Request SOL
5. Wait 2 hours before next request

### After Each Request:
Check balance with:
```bash
node scripts/get-wallet-info.js
```

## Alternative Faucets
If the primary faucet is unavailable:

1. **Solana Official Faucet**
   - https://faucet.solana.com
   - Enter: `7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b`

2. **QuickNode Faucet**
   - https://faucet.quicknode.com/solana/devnet
   - Enter: `7tewgFWPMhTaMcxh4L73FYXJQJS7GaBoxSN7FQgr1b2b`

3. **Automated Airdrop** (may fail)
   ```bash
   node scripts/request-airdrop.js
   ```

## Funding Schedule
Request from primary faucet at these times (example):
- [ ] 00:00 (midnight)
- [ ] 02:00
- [ ] 04:00
- [ ] 06:00
- [ ] 08:00
- [ ] 10:00
- [ ] 12:00 (noon)
- [ ] 14:00
- [ ] 16:00
- [ ] 18:00
- [ ] 20:00
- [ ] 22:00

## Current Status
Run this to check current balance:
```bash
node scripts/get-wallet-info.js
```

## Once Funded (≥2.6 SOL)
Proceed with deployment:
```bash
cd packages/x402-escrow
anchor build
anchor deploy
```

## Notes
- Most faucets have rate limits (typically 1-2 hours)
- May need multiple requests to reach 2.6 SOL
- Keep this document open for reference
- Check balance after each successful request
