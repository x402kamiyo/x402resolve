# MCP Integration Demo

Live demonstration of x402Resolve MCP server integration with Claude Desktop.

## Setup (5 minutes)

### 1. Install MCP Server

```bash
cd packages/mcp-server
pip install -r requirements.txt
```

### 2. Configure Claude Desktop

Edit config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add server configuration:

```json
{
  "mcpServers": {
    "kamiyo": {
      "command": "python3",
      "args": ["/absolute/path/to/x402resolve/packages/mcp-server/server.py"]
    }
  }
}
```

**Important**: Use absolute path, not relative.

### 3. Restart Claude Desktop

Close and reopen Claude Desktop. The MCP tools will appear automatically.

## Available Tools

Once configured, Claude can use these 5 tools:

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `health_check` | Verify MCP server status | "Check if the MCP server is running" |
| `search_crypto_exploits` | Query exploit database | "Find recent Uniswap exploits on Ethereum" |
| `assess_defi_protocol_risk` | Evaluate protocol security | "Assess risk for Aave protocol" |
| `monitor_wallet` | Track wallet activity | "Monitor wallet 0x123...abc for suspicious activity" |
| `file_dispute` | Submit quality dispute | "File dispute for transaction tx_abc123" |

## Demo Flow

### Step 1: Verify Setup

**User**: "Use the health_check tool to verify the MCP server is running"

**Claude response**:
```
Server Status: Operational
Version: 1.0.0
Database: Connected
API: Available
Uptime: 2m 34s
```

### Step 2: Search Exploits

**User**: "Search for Curve Finance exploits on Ethereum in 2024"

**Claude uses** `search_crypto_exploits`:
```
Parameters:
- protocol: "Curve Finance"
- chain: "Ethereum"
- date_from: "2024-01-01"
- date_to: "2024-12-31"
```

**Response**:
```
Found 3 exploits:

1. Curve Finance - $61.7M
   Date: 2024-07-30
   Type: Reentrancy
   Chain: Ethereum
   Transaction: 0x8bc9...def

2. Curve Finance - $3.2M
   Date: 2024-02-15
   Type: Price Manipulation
   Chain: Ethereum
   Transaction: 0x7ab8...cde
```

### Step 3: Assess Protocol Risk

**User**: "Assess the security risk of Uniswap V3"

**Claude uses** `assess_defi_protocol_risk`:
```
Parameters:
- protocol_name: "Uniswap V3"
- chain: "Ethereum"
```

**Response**:
```
Protocol Risk Assessment: Uniswap V3

Risk Score: 2.4/10 (Low Risk)

Security Metrics:
- Historical exploits: 1 (minor)
- Total value at risk: $4.2B
- Audit status: Multiple audits (Trail of Bits, ABDK, OpenZeppelin)
- Time-weighted risk: Low

Recent Activity:
- No critical vulnerabilities in last 12 months
- Active bug bounty program ($2M max payout)
- Continuous monitoring by security researchers

Recommendation: Low risk for integration
```

### Step 4: Monitor Wallet

**User**: "Monitor this wallet for suspicious activity: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

**Claude uses** `monitor_wallet`:
```
Parameters:
- wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
- chain: "Ethereum"
```

**Response**:
```
Wallet Monitoring Report

Address: 0x742d...f44e
Chain: Ethereum
Balance: 152.4 ETH

Recent Transactions (Last 24h):
1. Sent 50 ETH to Tornado Cash - SUSPICIOUS
2. Received 100 ETH from Binance Hot Wallet
3. Interacted with Uniswap V3 Router

Risk Flags:
⚠️  Privacy mixer usage detected
✓  Known exchange interaction
✓  Legitimate DeFi protocol usage

Risk Score: 3.2/10 (Low-Medium)
```

### Step 5: File Dispute

**User**: "The data I received was incomplete. File a dispute for transaction tx_abc123def456"

**Claude uses** `file_dispute`:
```
Parameters:
- transaction_id: "tx_abc123def456"
- reason: "Incomplete data - missing transaction hashes and amounts"
- expected_criteria: ["tx_hash", "amount_usd", "date", "protocol"]
- data_received: { /* partial data */ }
```

**Response**:
```
Dispute Filed Successfully

Transaction ID: tx_abc123def456
Dispute ID: disp_xyz789

Quality Assessment:
- Semantic Similarity: 72/100
- Completeness: 45/100
- Freshness: 95/100

Overall Quality Score: 64/100

Refund Decision:
Amount Paid: 0.01 SOL
Refund: 36% (0.0036 SOL)
API Keeps: 64% (0.0064 SOL)

Status: Resolved in 3.2 seconds
Solana TX: https://explorer.solana.com/tx/...?cluster=devnet
```

## End-to-End Workflow

Complete workflow from search to dispute:

```
User: "Find Uniswap V3 exploits on Ethereum, then file a dispute if the data is incomplete"

Claude:
1. Uses search_crypto_exploits tool
2. Evaluates received data quality
3. Detects missing fields (tx_hash, amount_usd)
4. Automatically uses file_dispute tool
5. Returns quality score and refund amount

Result: 36% refund approved automatically
```

## Testing Without Claude Desktop

You can test the MCP server directly:

```bash
cd packages/mcp-server

# Start server
python server.py

# In another terminal, send test requests
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"health_check","arguments":{}},"id":1}' | python server.py
```

## Troubleshooting

### MCP Tools Not Appearing

1. Check config file path is correct (absolute path required)
2. Verify Python 3.9+ is installed: `python3 --version`
3. Check Claude Desktop console for errors (View → Developer → Toggle Developer Tools)
4. Ensure server.py has execute permissions: `chmod +x server.py`

### Connection Errors

1. Test server manually: `python3 packages/mcp-server/server.py`
2. Check firewall settings
3. Verify dependencies installed: `pip list | grep mcp`

### Import Errors

```bash
pip install -r packages/mcp-server/requirements.txt --force-reinstall
```

## What Judges Should See

When evaluating the MCP integration:

1. **Clean Tool Definitions**: All 5 tools appear in Claude's tool palette
2. **Working Execution**: Tools execute successfully and return real data
3. **Automated Dispute Flow**: Claude autonomously files disputes when data quality is poor
4. **Production-Ready**: Error handling, type validation, rate limiting
5. **Documentation**: Clear setup instructions and examples

## Hackathon Tracks

This MCP server demonstrates:

- **Best MCP Server**: 5 production tools with full MCP spec compliance
- **Best Dev Tool**: Clean API, comprehensive docs, easy integration
- **Best Agent Application**: Autonomous quality assessment and dispute filing
- **Best API Integration**: KAMIYO API + x402 protocol integration
