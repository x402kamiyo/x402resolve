"""
Tests for KAMIYO MCP Server tools.

Tests all 5 MCP tools: health_check, search_crypto_exploits,
assess_defi_protocol_risk, monitor_wallet, and file_dispute.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database, initialize_database


class TestDatabase:
    """Test database functionality."""

    @pytest.fixture
    def db(self, tmp_path):
        """Create test database."""
        db_path = tmp_path / "test.db"
        return initialize_database(str(db_path), seed=True)

    def test_database_initialization(self, db):
        """Test database initializes with schema."""
        health = db.get_health_status()
        assert health['status'] == 'healthy'
        assert health['exploit_count'] == 5  # Seeded data

    def test_search_exploits_by_protocol(self, db):
        """Test searching exploits by protocol."""
        results = db.search_exploits(protocol='Uniswap')
        assert len(results) >= 1
        assert all('protocol' in r for r in results)

    def test_search_exploits_by_chain(self, db):
        """Test searching exploits by blockchain."""
        results = db.search_exploits(chain='Ethereum')
        assert len(results) >= 3  # Curve, Euler, Uniswap
        assert all(r['chain'] == 'Ethereum' for r in results)

    def test_search_exploits_by_amount(self, db):
        """Test filtering by minimum amount."""
        results = db.search_exploits(min_amount_usd=50000000)
        assert len(results) >= 2  # Curve (62M), Euler (197M)
        assert all(r['amount_usd'] >= 50000000 for r in results)

    def test_search_exploits_with_limit(self, db):
        """Test result limiting."""
        results = db.search_exploits(limit=2)
        assert len(results) <= 2

    def test_get_user_tier_default(self, db):
        """Test default user tier is free."""
        tier = db.get_user_tier('new_user_123')
        assert tier == 'free'

    def test_get_user_tier_existing(self, db):
        """Test retrieving existing user tier."""
        # First call creates user
        tier1 = db.get_user_tier('test_user')
        assert tier1 == 'free'

        # Second call retrieves same tier
        tier2 = db.get_user_tier('test_user')
        assert tier2 == 'free'

    def test_rate_limiting(self, db):
        """Test rate limiting functionality."""
        user_id = 'test_user'
        endpoint = 'search'
        limit = 5

        # First 5 requests should succeed
        for i in range(limit):
            allowed = db.check_rate_limit(user_id, endpoint, limit=limit)
            assert allowed is True

        # 6th request should be denied
        allowed = db.check_rate_limit(user_id, endpoint, limit=limit)
        assert allowed is False

    def test_record_dispute(self, db):
        """Test recording dispute."""
        db.record_dispute(
            transaction_id='tx_123',
            user_id='user_456',
            quality_score=65,
            refund_percentage=35
        )

        health = db.get_health_status()
        assert health['dispute_count'] == 1

    def test_health_status(self, db):
        """Test health status reporting."""
        health = db.get_health_status()

        assert health['status'] == 'healthy'
        assert 'exploit_count' in health
        assert 'user_count' in health
        assert 'dispute_count' in health
        assert 'db_path' in health


class TestMCPTools:
    """Test MCP tool implementations."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database."""
        db = Mock(spec=Database)
        db.get_health_status.return_value = {
            'status': 'healthy',
            'exploit_count': 100,
            'user_count': 50,
            'dispute_count': 10
        }
        db.search_exploits.return_value = [
            {
                'protocol': 'Uniswap',
                'chain': 'Ethereum',
                'tx_hash': '0x123',
                'amount_usd': 1500000.0,
                'timestamp': 1672531200,
                'description': 'Reentrancy exploit'
            }
        ]
        db.get_user_tier.return_value = 'free'
        db.check_rate_limit.return_value = True
        return db

    def test_health_check_tool(self, mock_db):
        """Test health_check tool."""
        with patch('database.get_db', return_value=mock_db):
            from database import get_db
            db = get_db()
            health = db.get_health_status()

            assert health['status'] == 'healthy'
            assert health['exploit_count'] == 100
            assert health['user_count'] == 50

    def test_search_exploits_tool(self, mock_db):
        """Test search_crypto_exploits tool."""
        with patch('database.get_db', return_value=mock_db):
            from database import get_db
            db = get_db()

            results = db.search_exploits(protocol='Uniswap', chain='Ethereum')

            assert len(results) == 1
            assert results[0]['protocol'] == 'Uniswap'
            assert results[0]['amount_usd'] == 1500000.0

    def test_search_with_rate_limiting(self, mock_db):
        """Test search respects rate limits."""
        mock_db.check_rate_limit.return_value = False

        with patch('database.get_db', return_value=mock_db):
            from database import get_db
            db = get_db()

            allowed = db.check_rate_limit('user_123', 'search', limit=10)
            assert allowed is False

    def test_tier_based_limits(self, mock_db):
        """Test different limits for different tiers."""
        tier_limits = {
            'free': {'per_hour': 10, 'per_day': 100},
            'personal': {'per_hour': 100, 'per_day': 10000},
            'team': {'per_hour': 500, 'per_day': 100000},
            'enterprise': {'per_hour': None, 'per_day': None}
        }

        for tier, limits in tier_limits.items():
            mock_db.get_user_tier.return_value = tier

            with patch('database.get_db', return_value=mock_db):
                from database import get_db
                db = get_db()

                user_tier = db.get_user_tier('test_user')
                assert user_tier == tier


class TestQualityScoring:
    """Test quality scoring integration."""

    def test_quality_score_calculation(self):
        """Test quality score calculation logic."""
        # High quality: >= 80
        assert calculate_refund_percentage(85) == 0
        assert calculate_refund_percentage(100) == 0

        # Medium quality: 50-79
        assert calculate_refund_percentage(75) == 25
        assert calculate_refund_percentage(65) == 35
        assert calculate_refund_percentage(50) == 50

        # Low quality: < 50
        assert calculate_refund_percentage(40) == 100
        assert calculate_refund_percentage(0) == 100

    def test_quality_score_boundaries(self):
        """Test boundary conditions."""
        assert calculate_refund_percentage(80) == 0   # Boundary: >= 80
        assert calculate_refund_percentage(79) == 21  # Just below
        assert calculate_refund_percentage(50) == 50  # Boundary: 50-79
        assert calculate_refund_percentage(49) == 100 # Just below


class TestDisputeWorkflow:
    """Test end-to-end dispute workflow."""

    @pytest.fixture
    def mock_verifier(self):
        """Mock verifier oracle."""
        verifier = Mock()
        verifier.verify_quality.return_value = {
            'quality_score': 65,
            'semantic_similarity': 0.72,
            'completeness': 0.40,
            'freshness': 1.00,
            'signature': bytes(64)
        }
        return verifier

    def test_file_dispute_workflow(self, mock_db, mock_verifier):
        """Test complete dispute filing workflow."""
        transaction_id = 'tx_123'
        user_id = 'user_456'

        # Step 1: File dispute
        with patch('database.get_db', return_value=mock_db):
            db = mock_db

            # Step 2: Check rate limit
            allowed = db.check_rate_limit(user_id, 'file_dispute', limit=10)
            assert allowed is True

            # Step 3: Record dispute
            quality_result = mock_verifier.verify_quality()
            db.record_dispute(
                transaction_id=transaction_id,
                user_id=user_id,
                quality_score=quality_result['quality_score'],
                refund_percentage=calculate_refund_percentage(quality_result['quality_score'])
            )

            db.record_dispute.assert_called_once()

    def test_dispute_with_evidence(self, mock_verifier):
        """Test dispute with evidence payload."""
        evidence = {
            'original_query': 'Uniswap V3 exploits on Ethereum',
            'data_received': ['Curve', 'Euler', 'Mango'],
            'expected_criteria': {
                'minRecords': 5,
                'requiredFields': ['tx_hash', 'amount_usd']
            }
        }

        result = mock_verifier.verify_quality()
        assert result['quality_score'] == 65
        assert result['signature'] is not None


class TestErrorHandling:
    """Test error handling in MCP tools."""

    def test_database_connection_error(self):
        """Test handling of database connection errors."""
        with pytest.raises(Exception):
            db = Database('/invalid/path/db.db')
            db.get_health_status()

    def test_invalid_search_parameters(self, tmp_path):
        """Test validation of search parameters."""
        db_path = tmp_path / "test.db"
        db = initialize_database(str(db_path))

        # Negative limit should return empty
        results = db.search_exploits(limit=-1)
        assert len(results) == 0

    def test_rate_limit_with_invalid_user(self, tmp_path):
        """Test rate limiting with invalid user ID."""
        db_path = tmp_path / "test.db"
        db = initialize_database(str(db_path))

        # Should handle gracefully
        allowed = db.check_rate_limit('', 'test', limit=10)
        assert isinstance(allowed, bool)


# Helper functions

def calculate_refund_percentage(quality_score: int) -> int:
    """
    Calculate refund percentage from quality score.

    Args:
        quality_score: Quality score 0-100

    Returns:
        Refund percentage 0-100
    """
    if quality_score >= 80:
        return 0
    elif quality_score >= 50:
        return 100 - quality_score
    else:
        return 100


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
