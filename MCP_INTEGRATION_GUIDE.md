# Claude Desktop MCP Integration

x402Resolve integration with Claude Desktop via Model Context Protocol.

## What is MCP?

MCP enables Claude Desktop external tool access. x402Resolve provides 5 tools:

1. Health check - System connectivity
2. Exploit search - KAMIYO database queries
3. Risk assessment - Protocol security analysis
4. Wallet monitoring - Exposure detection
5. Dispute filing - Automated quality disputes

## Quick Start

1. Install Claude Desktop: https://claude.ai/download
2. Configure x402Resolve MCP server (below)
3. Restart Claude Desktop
4. Test: "Search for Uniswap exploits"

## Installation

### Prerequisites

- Claude Desktop installed
- Python 3.9+ installed
- x402Resolve repository cloned

### Step 1: Install Dependencies

```bash
cd /path/to/x402resolve/packages/mcp-server
pip install -r requirements.txt
```

### Step 2: Start Verifier Oracle (Required)

The MCP server needs the verifier oracle running:

```bash
# Terminal 1: Start verifier
cd /path/to/x402resolve/packages/x402-verifier
pip install -r requirements.txt
python verifier.py

# Wait for: "Model loaded successfully"
# Server running at: http://localhost:8000
```

### Step 3: Test MCP Server

```bash
# Terminal 2: Test MCP server
cd /path/to/x402resolve/packages/mcp-server
python server.py

# You should see:
# "MCP Server initialized with 5 tools"
# "Server ready"
```

---

## Configuration

### macOS

1. **Locate config file:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

2. **Edit config file:**
```json
{
  "mcpServers": {
    "x402resolve": {
      "command": "/usr/local/bin/python3",
      "args": ["/absolute/path/to/x402resolve/packages/mcp-server/server.py"],
      "env": {
        "VERIFIER_URL": "http://localhost:8000",
        "API_URL": "https://api.kamiyo.ai"
      }
    }
  }
}
```

3. **Important:** Use **absolute paths**, not relative paths!

```bash
# Get absolute path:
cd /path/to/x402resolve/packages/mcp-server
pwd
# Copy this path into config
```

4. **Find Python path:**
```bash
which python3
# Use this path for "command"
```

### Windows

1. **Locate config file:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

2. **Edit config file:**
```json
{
  "mcpServers": {
    "x402resolve": {
      "command": "C:\\Python39\\python.exe",
      "args": ["C:\\Users\\YourName\\x402resolve\\packages\\mcp-server\\server.py"],
      "env": {
        "VERIFIER_URL": "http://localhost:8000",
        "API_URL": "https://api.kamiyo.ai"
      }
    }
  }
}
```

3. **Important:** Use double backslashes `\\` in Windows paths!

### Linux

1. **Locate config file:**
```bash
~/.config/Claude/claude_desktop_config.json
```

2. **Configuration same as macOS**

---

## Restart Claude Desktop

**Critical Step:** You MUST completely quit and restart Claude Desktop:

### macOS
1. Cmd+Q to quit Claude Desktop
2. Wait 5 seconds
3. Reopen Claude Desktop

### Windows
1. Right-click taskbar icon → Exit
2. Wait 5 seconds
3. Reopen Claude Desktop

### Verify Tools Loaded

In Claude Desktop, look for a tools icon or type:
```
What tools do you have available?
```

You should see 5 x402Resolve tools listed.

---

## Available Tools

### 1. `health_check`

**Purpose:** Verify MCP server and verifier oracle are running

**Usage:**
```
Can you check if x402Resolve is healthy?
```

**Example Response:**
```json
{
  "status": "healthy",
  "verifier_status": "online",
  "uptime": 3600
}
```

---

### 2. `search_crypto_exploits`

**Purpose:** Search KAMIYO database for cryptocurrency exploits

**Usage:**
```
Search for Uniswap V3 exploits on Ethereum
```

**Parameters:**
- `query` (string): Search query
- `limit` (optional): Max results (default: 10)
- `offset` (optional): Pagination offset

**Example Response:**
```json
{
  "results": [
    {
      "protocol": "Uniswap V3",
      "chain": "Ethereum",
      "tx_hash": "0x123...",
      "amount_usd": 1500000,
      "timestamp": 1697839200,
      "vulnerability_type": "Price oracle manipulation"
    }
  ],
  "total": 3
}
```

---

### 3. `assess_defi_protocol_risk`

**Purpose:** Analyze security risk of a DeFi protocol

**Usage:**
```
What's the risk level of Curve Finance?
```

**Parameters:**
- `protocol` (string): Protocol name
- `chain` (string): Blockchain (ethereum, bsc, polygon, etc.)

**Example Response:**
```json
{
  "protocol": "Curve Finance",
  "chain": "Ethereum",
  "risk_score": 35,
  "risk_level": "Medium",
  "vulnerabilities": [
    "Historical reentrancy issues in 2021",
    "Complex math requires thorough auditing"
  ],
  "recommendations": [
    "Use audited pools only",
    "Monitor for unusual activity",
    "Keep small test amounts initially"
  ],
  "recent_incidents": 1,
  "total_tvl_at_risk": "$500M"
}
```

---

### 4. `monitor_wallet`

**Purpose:** Check if wallet has exposure to compromised protocols

**Usage:**
```
Is wallet 0xABC... exposed to any hacked protocols?
```

**Parameters:**
- `wallet_address` (string): Wallet to monitor
- `chain` (string): Blockchain

**Example Response:**
```json
{
  "wallet_address": "0xABC...",
  "exposed": true,
  "risk_protocols": [
    "Euler Finance",
    "Mango Markets"
  ],
  "total_exposure_usd": 15000,
  "recommendations": [
    "Withdraw funds from Euler Finance immediately",
    "Monitor for unauthorized transactions"
  ]
}
```

---

### 5. `file_dispute`

**Purpose:** File quality dispute with automated verification

**Usage:**
```
I received incomplete data from an API. Can you file a dispute?
Transaction ID: tx_12345
Reason: Missing required fields (tx_hash, amount)
```

**Parameters:**
- `transaction_id` (string): Original payment transaction ID
- `reason` (string): Why dispute is being filed
- `evidence` (object): Data received from API

**Example Response:**
```json
{
  "dispute_id": "dispute_67890",
  "quality_score": 65,
  "breakdown": {
    "semantic_similarity": 72,
    "completeness_score": 40,
    "freshness_score": 100
  },
  "refund_percentage": 35,
  "refund_amount_sol": 0.0035,
  "status": "resolved",
  "resolution_time": "2024-11-01T14:30:00Z"
}
```

---

## Example Conversations

### Example 1: Security Research

**You:**
```
I'm researching Uniswap V3 security. Can you help?
```

**Claude:**
```
I'll search for Uniswap V3 exploits in the security database.

[Uses search_crypto_exploits tool]

I found 3 significant exploits:

1. **Flash loan attack** (Oct 2023)
   - Lost: $1.5M
   - TX: 0x123...
   - Method: Price oracle manipulation

2. **Reentrancy vulnerability** (Mar 2023)
   - Lost: $800K
   - TX: 0x456...
   - Method: Callback exploit

3. **Front-running MEV** (Jan 2023)
   - Lost: $2.1M
   - TX: 0x789...
   - Method: Sandwich attack

Would you like me to assess the current risk level of Uniswap V3?
```

**You:**
```
Yes, what's the current risk?
```

**Claude:**
```
[Uses assess_defi_protocol_risk tool]

Current Risk Assessment for Uniswap V3:
- **Risk Score:** 25/100 (Low)
- **Risk Level:** Low

The protocol has had historical issues but recent audits show
improvements. Recommendations:
- Use established pools with high liquidity
- Monitor for unusual price movements
- Consider using limit orders to prevent slippage attacks
```

---

### Example 2: Wallet Monitoring

**You:**
```
Check if my wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb has
exposure to any compromised protocols on Ethereum
```

**Claude:**
```
[Uses monitor_wallet tool]

Good news! Your wallet (0x742d...bEb) has:
- CLEAN - No exposure to compromised protocols
- CLEAN - No interactions with known exploited contracts
- CLEAN - Zero risk detected

Your wallet is clean. Keep monitoring regularly for safety.
```

---

### Example 3: Filing a Dispute

**You:**
```
I paid for crypto exploit data but received incomplete results.
Only got 2 records instead of the promised 5, and they're missing
transaction hashes. Transaction ID: tx_abc123. Can you file a dispute?
```

**Claude:**
```
[Uses file_dispute tool]

I've filed your dispute. Here's the resolution:

**Dispute ID:** dispute_xyz789
**Quality Assessment:**
- Overall Score: 48/100
- Semantic Match: 65%
- Completeness: 20% (missing required fields)
- Freshness: 100%

**Refund Approved:** 52% (0.0052 SOL)

The data quality was below acceptable standards. Your refund has been
automatically processed to your wallet. The transaction should appear
within a few minutes on Solana Devnet.

Resolution completed in: 2.3 seconds
```

---

### Example 4: Comprehensive Security Audit

**You:**
```
I'm about to invest in a new DeFi protocol called "YieldFarm Pro" on BSC.
Can you help me assess the risks?
```

**Claude:**
```
Let me check the security profile:

[Uses assess_defi_protocol_risk tool]

**Risk Assessment for YieldFarm Pro (BSC):**

WARNING - **High Risk - Score: 85/100**

**Red Flags:**
1. No audit reports found
2. Anonymous team
3. Similar to previous rug pull patterns
4. Extremely high APY (2000%+)
5. Contract ownership not renounced

**Known Vulnerabilities:**
- Centralized mint function
- No timelock on admin functions
- Liquidity can be pulled instantly

**Recommendation:** CRITICAL - **DO NOT INVEST**

This protocol shows multiple signs of a potential scam. The risks
significantly outweigh any potential returns. Consider established
protocols with:
- Published audits
- Transparent team
- Reasonable APY (<50%)
- Time-locked contracts
```

---

## Troubleshooting

### Issue: Tools not appearing in Claude Desktop

**Solution:**
1. Check config file path is correct
2. Verify absolute paths (no `~` or relative paths)
3. Completely quit and restart Claude Desktop
4. Check server logs

**Check logs (macOS):**
```bash
tail -f ~/Library/Logs/Claude/mcp-server-x402resolve.log
```

**Check logs (Windows):**
```cmd
type %APPDATA%\Claude\Logs\mcp-server-x402resolve.log
```

---

### Issue: "Connection refused" errors

**Solution:**
1. Verify verifier oracle is running:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

2. If not running, start it:
```bash
cd packages/x402-verifier
python verifier.py
```

3. Check firewall isn't blocking port 8000

---

### Issue: "Module not found" errors

**Solution:**
```bash
cd packages/mcp-server
pip install -r requirements.txt

cd ../x402-verifier
pip install -r requirements.txt
```

---

### Issue: Tools work but return errors

**Solution:**
1. Check verifier oracle is running
2. Verify KAMIYO API is accessible:
```bash
curl https://api.kamiyo.ai/health
```

3. Check environment variables in config:
```json
"env": {
  "VERIFIER_URL": "http://localhost:8000",
  "API_URL": "https://api.kamiyo.ai"
}
```

---

### Issue: Python path not found

**Solution:**

**macOS/Linux:**
```bash
which python3
# Use this path in config
```

**Windows:**
```cmd
where python
# Use this path in config (with double backslashes)
```

---

## Advanced Configuration

### Custom Ports

If port 8000 is in use:

```bash
# Start verifier on different port
python verifier.py --port 8001
```

Update MCP config:
```json
"env": {
  "VERIFIER_URL": "http://localhost:8001"
}
```

### Multiple Environments

You can configure different MCP servers for different environments:

```json
{
  "mcpServers": {
    "x402resolve-dev": {
      "command": "/usr/local/bin/python3",
      "args": ["/path/to/dev/server.py"],
      "env": {
        "VERIFIER_URL": "http://localhost:8000"
      }
    },
    "x402resolve-prod": {
      "command": "/usr/local/bin/python3",
      "args": ["/path/to/prod/server.py"],
      "env": {
        "VERIFIER_URL": "https://verifier.kamiyo.ai"
      }
    }
  }
}
```

---

## Testing MCP Tools

### Quick Test Commands

Once configured, try these in Claude Desktop:

1. **Health check:**
   ```
   Check x402resolve health
   ```

2. **Search:**
   ```
   Search for recent DeFi exploits
   ```

3. **Risk assessment:**
   ```
   What's the security risk of Aave?
   ```

4. **Wallet check:**
   ```
   Check wallet 0x123... for exposure
   ```

5. **File dispute:**
   ```
   File a dispute for transaction tx_123
   ```

---

## Performance Tips

1. **Keep verifier running:** Start verifier in background
2. **Use screen/tmux:** For persistent verifier session
3. **Monitor logs:** Watch for errors in real-time
4. **Cache models:** First run downloads ~500MB, then cached

---

## Security Considerations

1. **API Keys:** Don't commit API keys to git
2. **Local only:** MCP server runs locally, no external exposure
3. **Firewall:** Port 8000 only needs localhost access
4. **Updates:** Keep dependencies updated

---

## Next Steps

1. DONE - Configure Claude Desktop MCP
2. DONE - Test all 5 tools
3. DONE - Try example conversations
4. Read [API Reference](./docs/markdown/API_REFERENCE.md)
5. Watch [Demo Video](#)
6. Try [Code Examples](./examples/)

---

## Support

- **Documentation:** https://github.com/x402kamiyo/x402resolve
- **Issues:** https://github.com/x402kamiyo/x402resolve/issues
- **Email:** support@kamiyo.ai

---

## MCP Resources

- **MCP Specification:** https://modelcontextprotocol.io/
- **Claude Desktop:** https://claude.ai/download
- **MCP Python SDK:** https://github.com/anthropics/anthropic-sdk-python
