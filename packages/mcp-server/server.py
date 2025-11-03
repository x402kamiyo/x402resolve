#!/usr/bin/env python3
"""
x402Resolve MCP Server
MCP server implementation for crypto exploit intelligence and dispute resolution

This server provides MCP tools for exploit search, risk assessment, and
automated dispute filing via x402Resolve protocol.
"""

import sys
import os
import asyncio
import logging
from datetime import datetime
from typing import Any

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("Error: mcp not installed. Run: pip install -r requirements.txt")
    sys.exit(1)

from config import get_mcp_config
from tools import check_wallet_interactions, search_exploits, assess_protocol_risk
from database import get_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load configuration
config = get_mcp_config()

# Get database instance
db = get_db()

# Initialize MCP server
server = Server("x402resolve")

# Global state
server_start_time: datetime | None = None


def get_user_tier(user_id: str | None = None) -> str:
    """Get user subscription tier from database"""
    if not user_id:
        user_id = os.getenv("MCP_USER_ID", "mcp_user")

    try:
        tier = db.get_user_tier(user_id)
        logger.debug(f"User {user_id} has tier: {tier}")
        return tier
    except Exception as e:
        logger.warning(f"Failed to get user tier for {user_id}: {e}")
        return "free"


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools"""
    return [
        Tool(
            name="health_check",
            description="Check MCP server health and status",
            inputSchema={"type": "object", "properties": {}, "required": []}
        ),
        Tool(
            name="search_crypto_exploits",
            description="Search cryptocurrency exploit database",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search term"},
                    "limit": {"type": "integer", "default": 10},
                    "since": {"type": "string", "description": "ISO 8601 date"},
                    "chain": {"type": "string"},
                    "subscription_tier": {"type": "string", "default": "free"}
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="assess_defi_protocol_risk",
            description="Assess security risk for a DeFi protocol",
            inputSchema={
                "type": "object",
                "properties": {
                    "protocol_name": {"type": "string"},
                    "chain": {"type": "string"},
                    "time_window_days": {"type": "integer", "default": 90},
                    "subscription_tier": {"type": "string", "default": "personal"}
                },
                "required": ["protocol_name"]
            }
        ),
        Tool(
            name="monitor_wallet",
            description="Check if wallet has interacted with exploited protocols",
            inputSchema={
                "type": "object",
                "properties": {
                    "wallet_address": {"type": "string"},
                    "chain": {"type": "string", "default": "ethereum"},
                    "lookback_days": {"type": "integer", "default": 90}
                },
                "required": ["wallet_address"]
            }
        ),
        Tool(
            name="file_dispute",
            description="File a dispute for poor data quality with x402Resolve",
            inputSchema={
                "type": "object",
                "properties": {
                    "transaction_id": {"type": "string"},
                    "reason": {"type": "string"},
                    "expected_quality": {"type": "integer"},
                    "evidence": {"type": "string"}
                },
                "required": ["transaction_id", "reason"]
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls"""

    if name == "health_check":
        result = await health_check()
        return [TextContent(type="text", text=str(result))]

    elif name == "search_crypto_exploits":
        query = arguments.get("query")
        limit = arguments.get("limit", 10)
        since = arguments.get("since")
        chain = arguments.get("chain")
        subscription_tier = arguments.get("subscription_tier", "free")

        user_tier = subscription_tier or get_user_tier()
        result = search_exploits(
            query=query,
            limit=limit,
            since=since,
            chain=chain,
            user_tier=user_tier
        )
        return [TextContent(type="text", text=str(result))]

    elif name == "assess_defi_protocol_risk":
        protocol_name = arguments.get("protocol_name")
        chain = arguments.get("chain")
        time_window_days = arguments.get("time_window_days", 90)
        subscription_tier = arguments.get("subscription_tier", "personal")

        user_tier = subscription_tier or get_user_tier()
        result = assess_protocol_risk(
            protocol_name=protocol_name,
            chain=chain,
            time_window_days=time_window_days,
            user_tier=user_tier
        )
        return [TextContent(type="text", text=str(result))]

    elif name == "monitor_wallet":
        wallet_address = arguments.get("wallet_address")
        chain = arguments.get("chain", "ethereum")
        lookback_days = arguments.get("lookback_days", 90)

        user_tier = get_user_tier()
        if user_tier == "free":
            user_tier = None

        result = await check_wallet_interactions(
            wallet_address=wallet_address,
            chain=chain,
            lookback_days=lookback_days,
            user_tier=user_tier
        )
        return [TextContent(type="text", text=str(result))]

    elif name == "file_dispute":
        transaction_id = arguments.get("transaction_id")
        reason = arguments.get("reason")
        expected_quality = arguments.get("expected_quality")
        evidence = arguments.get("evidence")

        result = await file_dispute(
            transaction_id=transaction_id,
            reason=reason,
            expected_quality=expected_quality,
            evidence=evidence
        )
        return [TextContent(type="text", text=str(result))]

    else:
        raise ValueError(f"Unknown tool: {name}")


async def health_check() -> dict:
    """Check MCP server health and status"""
    try:
        uptime = None
        if server_start_time:
            uptime = (datetime.now() - server_start_time).total_seconds()

        # Check API connection
        api_status = "unknown"
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{config.kamiyo_api_url}/health")
                api_status = "connected" if response.status_code == 200 else "degraded"
        except Exception as e:
            logger.warning(f"API health check failed: {e}")
            api_status = "disconnected"

        # Check database
        db_status = "unknown"
        try:
            db.execute_with_retry("SELECT 1", readonly=True)
            db_status = "connected"
        except Exception as e:
            logger.warning(f"Database health check failed: {e}")
            db_status = "disconnected"

        # Determine overall status
        if api_status == "connected" and db_status == "connected":
            overall_status = "healthy"
        elif api_status == "disconnected" or db_status == "disconnected":
            overall_status = "degraded"
        else:
            overall_status = "healthy"

        return {
            "status": overall_status,
            "version": config.version,
            "uptime_seconds": uptime,
            "server_name": config.name,
            "environment": config.environment,
            "api_connection": api_status,
            "database": db_status,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "version": config.version,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


async def file_dispute(
    transaction_id: str,
    reason: str,
    expected_quality: int | None = None,
    evidence: str | None = None
) -> dict:
    """File a dispute for poor data quality with x402Resolve"""
    try:
        import httpx

        verifier_url = config.x402_verifier_url or "http://localhost:8001"

        logger.info(f"Filing dispute for transaction {transaction_id}")

        dispute_payload = {
            "transaction_id": transaction_id,
            "reason": reason,
            "expected_quality": expected_quality,
            "evidence": evidence,
            "filed_at": datetime.now().isoformat(),
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{verifier_url}/api/v1/disputes",
                json=dispute_payload
            )

            if response.status_code == 201:
                result = response.json()
                logger.info(f"Dispute filed successfully: {result.get('dispute_id')}")
                return result
            else:
                logger.error(f"Failed to file dispute: {response.status_code}")
                return {
                    "error": "dispute_filing_failed",
                    "message": f"Failed to file dispute: {response.text}",
                    "transaction_id": transaction_id,
                    "status_code": response.status_code,
                }

    except Exception as e:
        logger.error(f"Error filing dispute: {e}")
        return {
            "error": "dispute_filing_error",
            "message": str(e),
            "transaction_id": transaction_id,
            "help": "Ensure x402 Verifier Oracle is running",
        }


async def startup():
    """Initialize server resources on startup"""
    global server_start_time
    server_start_time = datetime.now()

    logger.info(f"Starting x402Resolve MCP Server v{config.version}")
    logger.info(f"Environment: {config.environment}")
    logger.info(f"KAMIYO API URL: {config.kamiyo_api_url}")

    # Test database connection
    try:
        db.execute_with_retry("SELECT 1", readonly=True)
        logger.info("Database connection: OK")
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")

    # Test API connection
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{config.kamiyo_api_url}/health")
            if response.status_code == 200:
                logger.info("KAMIYO API connection: OK")
    except Exception as e:
        logger.warning(f"KAMIYO API connection failed: {e}")

    logger.info("x402Resolve MCP Server started successfully")
    logger.info("Available tools: health_check, search_crypto_exploits, assess_defi_protocol_risk, monitor_wallet, file_dispute")


async def shutdown():
    """Clean up resources on shutdown"""
    logger.info("x402Resolve MCP Server shutting down...")
    logger.info("x402Resolve MCP Server stopped")


async def main():
    """Main entry point for the MCP server"""
    try:
        await startup()

        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options()
            )

        await shutdown()

    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    except Exception as e:
        logger.error(f"Server error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
