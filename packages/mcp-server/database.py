"""
Database module for KAMIYO MCP server.

Provides connection management and query execution for SQLite database.
Handles exploit data, user subscriptions, and rate limiting.
"""

import sqlite3
import logging
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


class Database:
    """SQLite database manager for KAMIYO MCP server."""

    def __init__(self, db_path: str = "data/kamiyo.db"):
        """
        Initialize database connection.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self._ensure_db_directory()
        self._initialize_schema()

    def _ensure_db_directory(self):
        """Create database directory if it doesn't exist."""
        db_dir = Path(self.db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)

    def _initialize_schema(self):
        """Create database tables if they don't exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Exploits table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS exploits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    protocol TEXT NOT NULL,
                    chain TEXT NOT NULL,
                    tx_hash TEXT UNIQUE NOT NULL,
                    amount_usd REAL NOT NULL,
                    timestamp INTEGER NOT NULL,
                    description TEXT,
                    created_at INTEGER DEFAULT (strftime('%s', 'now'))
                )
            """)

            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    tier TEXT NOT NULL DEFAULT 'free',
                    created_at INTEGER DEFAULT (strftime('%s', 'now')),
                    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
                )
            """)

            # Rate limiting table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rate_limits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    endpoint TEXT NOT NULL,
                    request_count INTEGER DEFAULT 0,
                    window_start INTEGER NOT NULL,
                    UNIQUE(user_id, endpoint, window_start)
                )
            """)

            # Disputes table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS disputes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT UNIQUE NOT NULL,
                    user_id TEXT NOT NULL,
                    quality_score INTEGER,
                    refund_percentage INTEGER,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at INTEGER DEFAULT (strftime('%s', 'now')),
                    resolved_at INTEGER
                )
            """)

            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_exploits_protocol
                ON exploits(protocol)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_exploits_chain
                ON exploits(chain)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_exploits_timestamp
                ON exploits(timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_rate_limits_user
                ON rate_limits(user_id, window_start)
            """)

            conn.commit()
            logger.info(f"Database initialized at {self.db_path}")

    @contextmanager
    def get_connection(self):
        """
        Get database connection context manager.

        Yields:
            sqlite3.Connection: Database connection
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def execute_with_retry(
        self,
        query: str,
        params: Optional[tuple] = None,
        readonly: bool = False,
        max_retries: int = 3
    ) -> Optional[List[sqlite3.Row]]:
        """
        Execute query with retry logic.

        Args:
            query: SQL query to execute
            params: Query parameters
            readonly: If True, return results; if False, commit changes
            max_retries: Maximum number of retry attempts

        Returns:
            List of rows for readonly queries, None for write queries
        """
        for attempt in range(max_retries):
            try:
                with self.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(query, params or ())

                    if readonly:
                        return cursor.fetchall()
                    else:
                        conn.commit()
                        return None
            except sqlite3.OperationalError as e:
                if attempt == max_retries - 1:
                    logger.error(f"Database query failed after {max_retries} attempts: {e}")
                    raise
                logger.warning(f"Database query attempt {attempt + 1} failed, retrying: {e}")

        return None

    def search_exploits(
        self,
        protocol: Optional[str] = None,
        chain: Optional[str] = None,
        date_from: Optional[int] = None,
        date_to: Optional[int] = None,
        min_amount_usd: Optional[float] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search exploits with filters.

        Args:
            protocol: Filter by protocol name
            chain: Filter by blockchain
            date_from: Filter by start timestamp
            date_to: Filter by end timestamp
            min_amount_usd: Filter by minimum amount
            limit: Maximum number of results

        Returns:
            List of exploit records
        """
        query = "SELECT * FROM exploits WHERE 1=1"
        params = []

        if protocol:
            query += " AND protocol LIKE ?"
            params.append(f"%{protocol}%")

        if chain:
            query += " AND chain = ?"
            params.append(chain)

        if date_from:
            query += " AND timestamp >= ?"
            params.append(date_from)

        if date_to:
            query += " AND timestamp <= ?"
            params.append(date_to)

        if min_amount_usd:
            query += " AND amount_usd >= ?"
            params.append(min_amount_usd)

        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)

        rows = self.execute_with_retry(query, tuple(params), readonly=True)
        return [dict(row) for row in rows] if rows else []

    def get_user_tier(self, user_id: str) -> str:
        """
        Get user subscription tier.

        Args:
            user_id: User identifier

        Returns:
            Subscription tier (free, personal, team, enterprise)
        """
        query = "SELECT tier FROM users WHERE user_id = ?"
        rows = self.execute_with_retry(query, (user_id,), readonly=True)

        if rows and len(rows) > 0:
            return rows[0]['tier']

        # Default to free tier for new users
        self.execute_with_retry(
            "INSERT OR IGNORE INTO users (user_id, tier) VALUES (?, ?)",
            (user_id, 'free')
        )
        return 'free'

    def check_rate_limit(self, user_id: str, endpoint: str, limit: int, window_seconds: int = 3600) -> bool:
        """
        Check if user has exceeded rate limit.

        Args:
            user_id: User identifier
            endpoint: API endpoint
            limit: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            True if under limit, False if exceeded
        """
        import time
        current_time = int(time.time())
        window_start = current_time - window_seconds

        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Get current count
            cursor.execute("""
                SELECT SUM(request_count) as total
                FROM rate_limits
                WHERE user_id = ? AND endpoint = ? AND window_start > ?
            """, (user_id, endpoint, window_start))

            row = cursor.fetchone()
            current_count = row['total'] if row and row['total'] else 0

            if current_count >= limit:
                return False

            # Increment counter
            cursor.execute("""
                INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
                VALUES (?, ?, 1, ?)
                ON CONFLICT(user_id, endpoint, window_start)
                DO UPDATE SET request_count = request_count + 1
            """, (user_id, endpoint, current_time))

            conn.commit()
            return True

    def record_dispute(self, transaction_id: str, user_id: str, quality_score: int, refund_percentage: int):
        """
        Record a dispute in the database.

        Args:
            transaction_id: Solana transaction ID
            user_id: User who filed dispute
            quality_score: Calculated quality score (0-100)
            refund_percentage: Refund percentage (0-100)
        """
        self.execute_with_retry("""
            INSERT INTO disputes (transaction_id, user_id, quality_score, refund_percentage, status)
            VALUES (?, ?, ?, ?, 'resolved')
        """, (transaction_id, user_id, quality_score, refund_percentage))

    def get_health_status(self) -> Dict[str, Any]:
        """
        Get database health status.

        Returns:
            Health status information
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Check exploits count
                cursor.execute("SELECT COUNT(*) as count FROM exploits")
                exploit_count = cursor.fetchone()['count']

                # Check users count
                cursor.execute("SELECT COUNT(*) as count FROM users")
                user_count = cursor.fetchone()['count']

                # Check disputes count
                cursor.execute("SELECT COUNT(*) as count FROM disputes")
                dispute_count = cursor.fetchone()['count']

                return {
                    "status": "healthy",
                    "exploit_count": exploit_count,
                    "user_count": user_count,
                    "dispute_count": dispute_count,
                    "db_path": self.db_path
                }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }

    def seed_sample_data(self):
        """Seed database with sample exploit data for testing."""
        sample_exploits = [
            ("Uniswap", "Ethereum", "0x1234567890abcdef", 1500000.0, 1672531200, "Reentrancy exploit"),
            ("Curve", "Ethereum", "0xabcdef1234567890", 62000000.0, 1690848000, "Vyper compiler bug"),
            ("Euler Finance", "Ethereum", "0xfedcba0987654321", 197000000.0, 1678665600, "Donation attack"),
            ("Mango Markets", "Solana", "0x567890abcdef1234", 116000000.0, 1665619200, "Oracle manipulation"),
            ("BNB Bridge", "BSC", "0xdef1234567890abc", 586000000.0, 1665014400, "Private key compromise"),
        ]

        with self.get_connection() as conn:
            cursor = conn.cursor()
            for exploit in sample_exploits:
                cursor.execute("""
                    INSERT OR IGNORE INTO exploits
                    (protocol, chain, tx_hash, amount_usd, timestamp, description)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, exploit)
            conn.commit()

        logger.info(f"Seeded {len(sample_exploits)} sample exploits")


# Global database instance
_db: Optional[Database] = None


def get_db() -> Database:
    """
    Get global database instance (singleton).

    Returns:
        Database instance
    """
    global _db
    if _db is None:
        _db = Database()
    return _db


def initialize_database(db_path: str = "data/kamiyo.db", seed: bool = False):
    """
    Initialize database with optional sample data.

    Args:
        db_path: Path to database file
        seed: If True, seed with sample data
    """
    global _db
    _db = Database(db_path)
    if seed:
        _db.seed_sample_data()
    return _db
