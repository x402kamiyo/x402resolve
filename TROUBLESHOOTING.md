# Troubleshooting Guide

Common issues and solutions for x402Resolve.

## Installation Issues

### Solana CLI Not Found

**Error**: `solana: command not found`

**Solution**:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Anchor Build Fails

**Error**: `anchor: command not found`

**Solution**:
```bash
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### Python Dependencies Missing

**Error**: `ModuleNotFoundError: No module named 'sentence_transformers'`

**Solution**:
```bash
cd packages/x402-verifier
pip install -r requirements.txt
```

## Wallet Issues

### Insufficient Funds

**Error**: `Error: insufficient funds for transaction`

**Solution - Request Devnet SOL**:
```bash
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
```

If airdrop fails (rate limited):
- Wait 5 minutes and retry
- Use [Solana Faucet](https://faucet.solana.com/)
- Ask in #faucet on Solana Discord

### Wallet Generation Fails

**Error**: Permission denied or file not found

**Solution**:
```bash
chmod +x scripts/generate-wallets.sh
./scripts/generate-wallets.sh
```

## Example Execution Issues

### TypeScript Compilation Error

**Error**: `Cannot find module '@x402resolve/sdk'`

**Solution**:
```bash
# Build SDK first
cd packages/x402-sdk
npm install
npm run build

# Then run example
cd ../../examples/with-dispute
npm install
npm start
```

### Environment Variables Missing

**Error**: `API_WALLET_PUBKEY environment variable required`

**Solution**:
```bash
cd examples/with-dispute
cp .env.example .env
# Edit .env with your wallet addresses
export API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)
```

### Verifier Oracle Not Running

**Error**: `Cannot connect to verifier oracle at http://localhost:8000`

**Solution - Start Verifier**:
```bash
cd packages/x402-verifier
python verifier.py
```

Should see: `Uvicorn running on http://127.0.0.1:8000`

## Solana Program Issues

### Program Not Found

**Error**: `Program AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR not found`

**Solution**: Verify program is deployed to devnet:
```bash
solana program show AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR --url devnet
```

If not found, the program may need redeployment. Contact maintainers.

### Transaction Simulation Failed

**Error**: `Transaction simulation failed: Blockhash not found`

**Solution**: RPC node is out of sync. Retry or switch RPC:
```bash
export SOLANA_RPC_URL=https://api.devnet.solana.com
```

## MCP Server Issues

### Tools Not Appearing in Claude

**Error**: MCP tools don't show up in Claude Desktop

**Solution**:
1. Check config path is correct (absolute, not relative)
2. Verify config file syntax is valid JSON
3. Restart Claude Desktop completely
4. Check Developer Tools console (View → Developer → Toggle Developer Tools)

**Config location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### MCP Server Won't Start

**Error**: Import errors or module not found

**Solution**:
```bash
cd packages/mcp-server
pip install -r requirements.txt --force-reinstall
python server.py  # Test directly
```

### Database Connection Error

**Error**: `Database connection failed`

**Solution**: MCP server works with or without database. Set minimal config:
```bash
export DATABASE_URL=sqlite:///./kamiyo.db
```

## Live Demo Issues

### Wallet Won't Connect

**Error**: Phantom wallet not detected

**Solution**:
1. Install [Phantom](https://phantom.app/)
2. Switch network to Devnet in Phantom settings
3. Refresh page
4. Click "Connect Wallet" again

### Transaction Fails in Demo

**Error**: Transaction rejected or fails

**Solution**:
1. Ensure wallet has devnet SOL (request airdrop in Phantom)
2. Check wallet is on Devnet (not Mainnet)
3. Try reducing escrow amount to 0.001 SOL
4. Check browser console for detailed errors (F12)

### Demo Shows "Simulated" Transactions

**Behavior**: All transactions show "(simulated)"

**Solution**: This is expected if wallet not connected. Connect Phantom wallet for real transactions.

## Test Failures

### SDK Tests Fail

**Error**: Jest tests timeout or fail

**Solution**:
```bash
cd packages/x402-sdk
npm install
npm test -- --maxWorkers=1
```

### Python Tests Fail

**Error**: Pytest assertion failures

**Solution**: Most failures are threshold tuning, not real bugs:
```bash
cd packages/x402-verifier
pytest -v  # See which tests fail
pytest tests/test_verifier.py::test_specific_test -v  # Run specific test
```

### Rust Tests Fail

**Error**: Anchor test failures

**Solution**:
```bash
cd packages/x402-escrow
anchor clean
anchor build
anchor test
```

## Network Issues

### RPC Rate Limiting

**Error**: `429 Too Many Requests`

**Solution**: Use dedicated RPC or add delays:
```bash
# Use different RPC
export SOLANA_RPC_URL=https://api.devnet.solana.com

# Or use rate-limited retries (SDK does this automatically)
```

### Connection Timeout

**Error**: Network timeouts when connecting to Solana

**Solution**:
1. Check internet connection
2. Try different RPC endpoint
3. Increase timeout in SDK config:
```typescript
const client = new KamiyoClient({
  timeout: 60000  // 60 seconds
});
```

## Build Issues

### Anchor Build Fails

**Error**: `cargo build failed`

**Solution**:
```bash
cd packages/x402-escrow
cargo clean
anchor clean
anchor build --verbose  # See detailed errors
```

### TypeScript Build Fails

**Error**: Type errors in SDK

**Solution**:
```bash
cd packages/x402-sdk
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Still Having Issues?

1. **Check GitHub Issues**: https://github.com/x402kamiyo/x402resolve/issues
2. **Review Examples**: Working examples in `/examples` directory
3. **Check Logs**: Enable debug logging:
   ```bash
   export LOG_LEVEL=debug
   ```

## Quick Diagnostics

Run this to check system setup:

```bash
echo "=== System Check ==="
node --version
python3 --version
solana --version
anchor --version

echo "=== Wallet Check ==="
ls -la wallets/

echo "=== Dependencies Check ==="
cd packages/x402-sdk && npm list --depth=0
cd ../x402-verifier && pip list | grep -E "(sentence|sklearn|fastapi)"

echo "=== Network Check ==="
solana cluster-version --url devnet
```

All checks should pass for full functionality.
