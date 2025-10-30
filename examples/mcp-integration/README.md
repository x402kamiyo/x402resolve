# MCP Integration Example

Demonstrates how MCP-compatible applications use the KAMIYO MCP server to automatically file disputes for poor data quality.

## Use Case

Use this when:
- You're building a programmatic integration
- You need crypto exploit intelligence
- You want automated quality verification
- You want to file disputes programmatically via MCP

## How It Works

```
User → Request exploit data
        ↓
App → Use search_crypto_exploits MCP tool
        ↓
KAMIYO API → Return data
        ↓
App → Evaluate quality automatically
        ↓
    ┌─────────────┴─────────────┐
    │                           │
Quality OK?              Quality Poor?
    │                           │
    ↓                           ↓
Return results          Use file_dispute MCP tool
to user                        ↓
                        x402 Verifier Oracle
                               ↓
                        Quality Score: 45/100
                               ↓
                        Refund: 75%
                               ↓
                        Notify user
```

## Setup

### 1. Configure MCP-Compatible Application

Example configuration for MCP client:

```json
{
  "mcpServers": {
    "kamiyo-security": {
      "command": "python3.11",
      "args": [
        "/absolute/path/to/kamiyo-x402-solana/packages/mcp-server/server.py"
      ],
      "env": {
        "ENVIRONMENT": "development",
        "KAMIYO_API_URL": "http://localhost:8000",
        "X402_VERIFIER_URL": "http://localhost:8001",
        "SOLANA_RPC_URL": "https://api.devnet.solana.com",
        "MCP_JWT_SECRET": "dev_jwt_secret_change_in_production"
      }
    }
  }
}
```

### 2. Install MCP Server Dependencies

```bash
cd ../../packages/mcp-server
pip3.11 install -r requirements-mcp.txt
```

### 3. Start Required Services

```bash
# Terminal 1: KAMIYO API (optional - can use mock data)
cd path/to/kamiyo/api
python main.py

# Terminal 2: x402 Verifier Oracle
cd ../../packages/x402-verifier
python verifier.py

# Terminal 3: Test MCP server
cd ../../packages/mcp-server
python server.py --help
```

### 4. Restart MCP Client

After configuring MCP, restart your MCP-compatible application to load the server.

## Example Interaction

### Scenario 1: Good Quality Data

```
User:
Search for Uniswap V3 exploits on Ethereum

Application:
Searching for Uniswap V3 exploits on Ethereum using the KAMIYO security database.

[Uses search_crypto_exploits MCP tool]

Found 8 Uniswap V3 exploits on Ethereum:

1. **Uniswap V3 Reentrancy** (2024-03-15)
   - Amount: $1,200,000
   - TX: 0x7a8b9c...
   - Source: BlockSec

2. **Uniswap V3 Oracle Manipulation** (2024-02-10)
   - Amount: $850,000
   - TX: 0x9d4e5f...
   - Source: PeckShield

[... 6 more exploits]

All results have complete blockchain verification and source attribution.
Quality assessment: HIGH
```

### Scenario 2: Poor Quality Data → Automatic Dispute

```
User:
Search for Curve Finance exploits on Ethereum, I need comprehensive data

Application:
Searching for Curve Finance exploits on Ethereum.

[Uses search_crypto_exploits MCP tool]

Found 3 results, but quality issues detected:

1. **Euler Finance** - $8.2M
    Wrong protocol (not Curve)
    Missing transaction hash

2. **Mango Markets** - $1.5M
    Wrong chain (Solana, not Ethereum)
    Missing source attribution

3. **Wintermute** - $160M
    Wrong protocol
    Incomplete data

Quality issues detected:
• Wrong protocols (expected Curve, got Euler/Mango/Wintermute)
• Wrong blockchain (Solana instead of Ethereum)
• Missing required fields (tx_hash, source)
• Incomplete dataset (3 vs 10+ expected)

Filing dispute for poor data quality...

[Uses file_dispute MCP tool]

Dispute filed successfully

Dispute ID: dispute_x402_xyz789
Status: Pending verification
Estimated resolution: 24-48 hours

x402 Verifier Oracle will analyze the data quality using:
• Semantic coherence (40%): Does data match "Curve Finance on Ethereum"?
• Completeness (40%): Are transaction hashes and sources present?
• Freshness (20%): Is the data recent?

Based on the issues identified, estimated 75% refund
(approximately $7.50 of your $10.00 payment) once the quality score is
calculated.

Will notify when the dispute is resolved.
```

### Scenario 3: Dispute Resolution

```
User:
What's the status of my dispute?

Application:
Checking the status of your dispute (dispute_x402_xyz789)...

[Uses monitoring capability]

Dispute resolved

Quality Assessment:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: 45/100 (POOR QUALITY)

Breakdown:
• Semantic Coherence: 60%
  ├─ Query: "Curve Finance on Ethereum"
  └─ Data: Mixed protocols (Euler, Mango, Wintermute)

• Completeness: 40%
  ├─ Missing tx_hash: 2/3 records
  └─ Missing source: 2/3 records

• Freshness: 100%
  └─ All data within 30 days

Refund Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Refund Percentage: 75%
Refund Amount: $7.50 (0.0075 SOL)
API Keeps: $2.50 (0.0025 SOL)

Solana Transaction: 7LPz4kQ9...
Resolution Time: 18 hours
Verifier Signature: 0x1a2b3c...

The refund has been automatically processed to your wallet. You received
75% back because the data quality was significantly below acceptable
standards (45/100 vs 80/100 threshold).
```

## MCP Tools Available

### 1. `health_check`

Check MCP server status.

```
User: Check KAMIYO server health

Application: [Uses health_check tool]

KAMIYO MCP Server - Healthy
  Version: 1.0.0
  Uptime: 3,600 seconds (1 hour)
  API Connection: Connected
  Database: Connected
  Environment: Development
```

### 2. `search_crypto_exploits`

Search exploit database with tier-based limits.

```
User: Search for flash loan attacks in 2024

Application: [Uses search_crypto_exploits with parameters]
```

### 3. `assess_defi_protocol_risk`

Assess protocol security based on exploit history.

```
User: How risky is Aave right now?

Application: [Uses assess_defi_protocol_risk tool]
```

### 4. `monitor_wallet`

Check if wallet interacted with exploited protocols (Team+ tier).

```
User: Check if wallet 0x742d... has any exploit exposure

Application: [Uses monitor_wallet tool]
```

### 5. `file_dispute` (NEW)

File quality dispute with automated resolution.

```
User: [Implicitly triggered when quality is poor]

Application: [Automatically uses file_dispute tool when data quality issues detected]
```

## Expected Output

When you use an MCP-compatible application with the KAMIYO MCP server:

1. **MCP Server Logs** (in terminal):
```
[INFO] Starting KAMIYO MCP Server v1.0.0
[INFO] Environment: development
[INFO] Available tools: health_check, search_crypto_exploits, assess_defi_protocol_risk, monitor_wallet, file_dispute
[INFO] MCP Server started successfully
[INFO] Tool invoked: search_crypto_exploits
[INFO] Tool invoked: file_dispute (quality score: 45)
```

2. **Application Interface**:
- Application shows MCP tool usage in the UI
- Real-time tool invocations displayed
- Results presented naturally in conversation

## Testing

### Test 1: Basic Search (No Dispute)

```bash
# In MCP-compatible application:
User: "Search for recent Ethereum exploits"
```

Expected: Application uses `search_crypto_exploits` and returns results.

### Test 2: Automatic Dispute

```bash
# In MCP-compatible application:
User: "Search for Uniswap exploits, I need high-quality data"
```

If data quality is poor, application should automatically:
1. Detect quality issues
2. Explain the problems
3. File dispute using `file_dispute` tool
4. Provide dispute ID and estimated refund

### Test 3: Health Check

```bash
# In MCP-compatible application:
User: "Check if the KAMIYO MCP server is working"
```

Expected: Application uses `health_check` and reports status.

## Key Benefits

**Automated Quality Control**: Applications detect poor data automatically
**No Manual Disputes**: Dispute filing is programmatic via MCP
**Transparent Scoring**: Multi-factor quality assessment
**Fair Refunds**: 0-100% sliding scale based on objective scores
**Fast Resolution**: 24-48h automated processing
**Blockchain Verified**: All transactions on Solana

## Architecture

```
┌─────────────────┐
│ MCP Application │
└────────┬────────┘
         │
         │ MCP Protocol (stdio)
         ↓
┌─────────────────────────┐
│  KAMIYO MCP Server      │
│  5 tools available      │
└────────┬────────────────┘
         │
         │ HTTP/REST
         ↓
┌─────────────────────────┐
│  KAMIYO API             │
│  Exploit Intelligence   │
└────────┬────────────────┘
         │
         │ If quality poor
         ↓
┌─────────────────────────┐
│  x402 Verifier Oracle   │
│  Quality Scoring        │
└────────┬────────────────┘
         │
         │ Solana TX
         ↓
┌─────────────────────────┐
│  Escrow Smart Contract  │
│  Automated Refunds      │
└─────────────────────────┘
```

## Troubleshooting

### MCP Server Not Showing in Application

1. Check `mcp_config.json` path is correct
2. Verify Python 3.11+ is installed
3. Ensure dependencies installed: `pip3.11 install -r requirements-mcp.txt`
4. Check server starts manually: `python3.11 server.py --help`
5. Restart MCP-compatible application

### Dispute Filing Fails

1. Ensure x402 Verifier Oracle is running (`python verifier.py`)
2. Check `X402_VERIFIER_URL` in config
3. Verify network connectivity
4. Check server logs for errors

### Data Quality Always Poor

This is intentional for demo purposes. The system is designed to show dispute resolution.
In production, quality varies based on actual data returned by KAMIYO API.

## Learn More

- [MCP Server Documentation](../../packages/mcp-server/README.md)
- [x402 Payment System](../../docs/X402_PAYMENT_SYSTEM.md)
- [MCP Protocol Spec](https://modelcontextprotocol.io)

## Next Steps

1. Configure MCP server
2. Test basic search
3. Trigger automatic dispute
4. Monitor dispute resolution
5. Integrate into your workflow
