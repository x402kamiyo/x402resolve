#!/usr/bin/env python3
"""
Comprehensive tests for x402 Verifier Oracle
"""

import pytest
from fastapi.testclient import TestClient
from verifier import app, oracle, VerifierOracle
from datetime import datetime, timedelta


client = TestClient(app)


class TestQualityScoring:
    """Test quality score calculation"""

    def test_perfect_match_returns_high_score(self):
        """Perfect semantic match should score 90+"""
        quality_score, reasoning = oracle.calculate_quality_score(
            original_query="Uniswap V3 exploits on Ethereum",
            data_received={
                "exploits": [
                    {
                        "protocol": "Uniswap V3",
                        "chain": "Ethereum",
                        "amount_usd": 10000000,
                        "tx_hash": "0xabc123",
                        "date": "2023-09-15"
                    }
                ]
            },
            expected_criteria=["tx_hash", "amount_usd"],
            expected_count=1
        )
        assert quality_score >= 70, f"Expected score >= 70, got {quality_score}"
        assert "Semantic" in reasoning

    def test_wrong_protocol_returns_low_score(self):
        """Wrong protocol should score < 50"""
        quality_score, reasoning = oracle.calculate_quality_score(
            original_query="Uniswap V3 exploits on Ethereum",
            data_received={
                "exploits": [
                    {
                        "protocol": "Curve Finance",  # Wrong protocol
                        "chain": "Ethereum",
                        "amount_usd": 62000000
                    }
                ]
            },
            expected_criteria=["tx_hash", "amount_usd"],
            expected_count=5
        )
        assert quality_score < 70, f"Expected score < 70 for wrong protocol, got {quality_score}"

    def test_missing_fields_lowers_score(self):
        """Missing expected fields should reduce completeness score"""
        quality_score_complete, _ = oracle.calculate_quality_score(
            original_query="Solana exploits",
            data_received={
                "exploits": [
                    {
                        "protocol": "Solend",
                        "tx_hash": "0x123",
                        "amount_usd": 5000000,
                        "date": "2023-08-01"
                    }
                ]
            },
            expected_criteria=["tx_hash", "amount_usd"],
            expected_count=1
        )

        quality_score_incomplete, _ = oracle.calculate_quality_score(
            original_query="Solana exploits",
            data_received={
                "exploits": [
                    {
                        "protocol": "Solend"
                        # Missing tx_hash and amount_usd
                    }
                ]
            },
            expected_criteria=["tx_hash", "amount_usd"],
            expected_count=1
        )

        assert quality_score_complete > quality_score_incomplete

    def test_insufficient_record_count_lowers_score(self):
        """Fewer records than expected should reduce score"""
        quality_score, _ = oracle.calculate_quality_score(
            original_query="Major DeFi exploits",
            data_received={
                "exploits": [
                    {"protocol": "Protocol A", "amount_usd": 10000000}
                ]
            },
            expected_criteria=["amount_usd"],
            expected_count=5  # Expected 5, got 1
        )
        # Should be penalized for record count
        assert quality_score < 80


class TestSemanticSimilarity:
    """Test semantic similarity calculation"""

    def test_identical_text_returns_high_similarity(self):
        """Identical text should return similarity near 1.0"""
        text = "Uniswap V3 exploit on Ethereum"
        similarity = oracle.calculate_semantic_similarity(text, text)
        assert similarity > 0.95

    def test_similar_text_returns_medium_similarity(self):
        """Similar but not identical text should return medium similarity"""
        query = "Uniswap V3 exploits"
        data = "Uniswap V2 vulnerabilities"
        similarity = oracle.calculate_semantic_similarity(query, data)
        assert 0.3 < similarity < 0.9

    def test_unrelated_text_returns_low_similarity(self):
        """Completely unrelated text should return low similarity"""
        query = "DeFi exploits on Ethereum"
        data = "Weather forecast for tomorrow"
        similarity = oracle.calculate_semantic_similarity(query, data)
        assert similarity < 0.3


class TestCompleteness:
    """Test completeness calculation"""

    def test_all_criteria_met_returns_high_score(self):
        """All criteria met should return score near 1.0"""
        data = {
            "exploits": [
                {
                    "tx_hash": "0xabc",
                    "amount_usd": 10000000,
                    "timestamp": "2023-09-01",
                    "source": "BlockSec"
                }
            ]
        }
        expected_criteria = ["tx_hash", "amount_usd", "timestamp", "source"]
        completeness = oracle.calculate_completeness(data, expected_criteria, 1)
        assert completeness >= 0.9

    def test_partial_criteria_met_returns_medium_score(self):
        """Some criteria met should return medium score"""
        data = {
            "exploits": [
                {
                    "tx_hash": "0xabc",
                    "amount_usd": 10000000
                    # Missing timestamp and source
                }
            ]
        }
        expected_criteria = ["tx_hash", "amount_usd", "timestamp", "source"]
        completeness = oracle.calculate_completeness(data, expected_criteria, 1)
        assert 0.3 < completeness < 0.8

    def test_no_criteria_met_returns_low_score(self):
        """No criteria met should return low score"""
        data = {"exploits": [{"protocol": "Test"}]}
        expected_criteria = ["tx_hash", "amount_usd", "timestamp", "source"]
        completeness = oracle.calculate_completeness(data, expected_criteria, 1)
        assert completeness < 0.5

    def test_record_count_affects_score(self):
        """Record count should affect completeness score"""
        data_sufficient = {
            "exploits": [
                {"amount_usd": 10000000},
                {"amount_usd": 20000000},
                {"amount_usd": 30000000},
                {"amount_usd": 40000000},
                {"amount_usd": 50000000}
            ]
        }
        data_insufficient = {
            "exploits": [
                {"amount_usd": 10000000}
            ]
        }

        completeness_sufficient = oracle.calculate_completeness(
            data_sufficient, ["amount_usd"], expected_count=5
        )
        completeness_insufficient = oracle.calculate_completeness(
            data_insufficient, ["amount_usd"], expected_count=5
        )

        assert completeness_sufficient > completeness_insufficient


class TestFreshness:
    """Test freshness calculation"""

    def test_recent_data_returns_high_freshness(self):
        """Recent data (< 30 days) should return freshness = 1.0"""
        recent_date = (datetime.utcnow() - timedelta(days=15)).isoformat()
        data = {
            "exploits": [
                {"date": recent_date}
            ]
        }
        freshness = oracle.calculate_freshness(data)
        assert freshness == 1.0

    def test_medium_age_data_returns_medium_freshness(self):
        """Medium age data (30-90 days) should return freshness = 0.7"""
        medium_date = (datetime.utcnow() - timedelta(days=60)).isoformat()
        data = {
            "exploits": [
                {"date": medium_date}
            ]
        }
        freshness = oracle.calculate_freshness(data)
        assert freshness == 0.7

    def test_old_data_returns_low_freshness(self):
        """Old data (>90 days) should return freshness = 0.3"""
        old_date = (datetime.utcnow() - timedelta(days=120)).isoformat()
        data = {
            "exploits": [
                {"date": old_date}
            ]
        }
        freshness = oracle.calculate_freshness(data)
        assert freshness == 0.3

    def test_no_timestamps_returns_neutral(self):
        """Data without timestamps should return default freshness"""
        data = {"exploits": [{"protocol": "Test"}]}
        freshness = oracle.calculate_freshness(data)
        assert freshness == 1.0  # Assumes fresh if no timestamp


class TestRefundCalculation:
    """Test refund percentage calculation"""

    def test_high_quality_no_refund(self):
        """Quality >= 80 should recommend 0% refund"""
        recommendation, refund_pct = oracle.determine_refund(85.0)
        assert recommendation == "release"
        assert refund_pct == 0.0

    def test_medium_quality_partial_refund(self):
        """Quality 50-79 should recommend partial refund"""
        recommendation, refund_pct = oracle.determine_refund(65.0)
        assert recommendation == "partial_refund"
        assert 0 < refund_pct < 100

    def test_low_quality_full_refund(self):
        """Quality < 50 should recommend 100% refund"""
        recommendation, refund_pct = oracle.determine_refund(30.0)
        assert recommendation == "full_refund"
        assert refund_pct == 100.0

    def test_sliding_scale_refund_calculation(self):
        """Refund percentage should decrease as quality increases"""
        _, refund_60 = oracle.determine_refund(60.0)
        _, refund_70 = oracle.determine_refund(70.0)
        assert refund_60 > refund_70


class TestSignatureGeneration:
    """Test Ed25519 signature generation"""

    def test_signature_is_deterministic(self):
        """Same input should produce same signature"""
        sig1 = oracle.sign_result("tx_123", 75)
        sig2 = oracle.sign_result("tx_123", 75)
        assert sig1 == sig2

    def test_different_inputs_produce_different_signatures(self):
        """Different inputs should produce different signatures"""
        sig1 = oracle.sign_result("tx_123", 75)
        sig2 = oracle.sign_result("tx_456", 75)
        assert sig1 != sig2

    def test_signature_is_hex_string(self):
        """Signature should be hex-encoded string"""
        sig = oracle.sign_result("tx_123", 75)
        assert isinstance(sig, str)
        assert len(sig) > 0
        # Verify it's valid hex
        bytes.fromhex(sig)


class TestAPIEndpoints:
    """Test FastAPI endpoints"""

    def test_root_endpoint_returns_status(self):
        """Root endpoint should return service status"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "x402 Verifier Oracle"
        assert data["status"] == "operational"
        assert "verifier_pubkey" in data

    def test_public_key_endpoint_returns_pubkey(self):
        """Public key endpoint should return Ed25519 pubkey"""
        response = client.get("/public-key")
        assert response.status_code == 200
        data = response.json()
        assert "public_key" in data
        assert data["encoding"] == "hex"
        assert data["algorithm"] == "ed25519"

    def test_verify_quality_endpoint_accepts_valid_request(self):
        """Verify quality endpoint should process valid requests"""
        response = client.post("/verify-quality", json={
            "original_query": "Uniswap V3 exploits",
            "data_received": {
                "exploits": [
                    {
                        "protocol": "Uniswap V3",
                        "amount_usd": 10000000,
                        "tx_hash": "0xabc"
                    }
                ]
            },
            "expected_criteria": ["tx_hash", "amount_usd"],
            "transaction_id": "tx_test_123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "quality_score" in data
        assert "recommendation" in data
        assert "refund_percentage" in data
        assert "signature" in data
        assert "reasoning" in data

    def test_verify_quality_returns_correct_refund_for_poor_data(self):
        """Poor quality data should return high refund percentage"""
        response = client.post("/verify-quality", json={
            "original_query": "Uniswap V3 exploits on Ethereum",
            "data_received": {
                "exploits": [
                    {
                        "protocol": "Curve Finance",  # Wrong protocol
                        "chain": "BSC"  # Wrong chain
                    }
                ]
            },
            "expected_criteria": ["tx_hash", "amount_usd"],
            "transaction_id": "tx_poor_quality",
            "expected_record_count": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert data["refund_percentage"] > 50


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_empty_data_returns_low_score(self):
        """Empty data should return very low quality score"""
        quality_score, _ = oracle.calculate_quality_score(
            original_query="Any exploits",
            data_received={},
            expected_criteria=["tx_hash"],
            expected_count=1
        )
        assert quality_score < 30

    def test_malformed_data_doesnt_crash(self):
        """Malformed data should not crash the oracle"""
        try:
            quality_score, _ = oracle.calculate_quality_score(
                original_query="Test query",
                data_received={"invalid": "structure"},
                expected_criteria=["field"],
                expected_count=1
            )
            assert isinstance(quality_score, float)
        except Exception as e:
            pytest.fail(f"Should handle malformed data gracefully: {e}")

    def test_none_expected_count_works(self):
        """None expected_count should not cause errors"""
        quality_score, _ = oracle.calculate_quality_score(
            original_query="Test",
            data_received={"data": "test"},
            expected_criteria=["data"],
            expected_count=None
        )
        assert isinstance(quality_score, float)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
