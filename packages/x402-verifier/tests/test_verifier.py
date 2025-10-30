"""
Comprehensive tests for x402 Verifier Oracle

Tests quality scoring algorithm including:
- Semantic coherence
- Completeness validation
- Freshness assessment
- Sliding scale refund calculation
"""

import pytest
from datetime import datetime, timedelta
from verifier import VerifierOracle


class TestSemanticSimilarity:
    """Test semantic similarity calculation"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_identical_query_and_data(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = "Uniswap V3 exploits on Ethereum"
        score = self.oracle.calculate_semantic_similarity(query, data)
        assert score > 0.95, "Identical text should have similarity > 0.95"

    def test_similar_query_and_data(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = "Uniswap V3 security incidents on Ethereum blockchain"
        score = self.oracle.calculate_semantic_similarity(query, data)
        assert score > 0.7, "Similar text should have similarity > 0.7"

    def test_unrelated_query_and_data(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = "Bitcoin price prediction for 2024"
        score = self.oracle.calculate_semantic_similarity(query, data)
        assert score < 0.5, "Unrelated text should have similarity < 0.5"

    def test_partial_match(self):
        query = "Curve Finance exploits on Ethereum"
        data = "Curve Finance on Ethereum network"
        score = self.oracle.calculate_semantic_similarity(query, data)
        assert 0.6 < score < 0.9, "Partial match should be 0.6-0.9"


class TestCompleteness:
    """Test data completeness scoring"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_all_criteria_met(self):
        data = {
            "exploits": [
                {"protocol": "Uniswap V3", "chain": "Ethereum", "amount": 1000000}
            ]
        }
        criteria = ["Uniswap", "Ethereum", "V3"]
        score = self.oracle.calculate_completeness(data, criteria, None)
        assert score == 1.0, "All criteria met should give 1.0"

    def test_partial_criteria_met(self):
        data = {
            "exploits": [
                {"protocol": "Uniswap", "chain": "Polygon"}
            ]
        }
        criteria = ["Uniswap", "Ethereum", "V3"]
        score = self.oracle.calculate_completeness(data, criteria, None)
        assert 0.3 < score < 0.4, "1/3 criteria should give ~0.33"

    def test_no_criteria_met(self):
        data = {
            "exploits": [
                {"protocol": "Curve", "chain": "Polygon"}
            ]
        }
        criteria = ["Uniswap", "Ethereum", "V3"]
        score = self.oracle.calculate_completeness(data, criteria, None)
        assert score < 0.5, "No criteria met should give low score"

    def test_record_count_exact(self):
        data = {
            "exploits": [
                {"protocol": "Uniswap"} for _ in range(10)
            ]
        }
        criteria = ["Uniswap"]
        score = self.oracle.calculate_completeness(data, criteria, 10)
        assert score == 1.0, "Exact record count should give 1.0"

    def test_record_count_less_than_expected(self):
        data = {
            "exploits": [
                {"protocol": "Uniswap"} for _ in range(3)
            ]
        }
        criteria = ["Uniswap"]
        score = self.oracle.calculate_completeness(data, criteria, 10)
        assert 0.5 < score < 0.8, "3/10 records should reduce score"

    def test_record_count_zero(self):
        data = {"exploits": []}
        criteria = ["Uniswap"]
        score = self.oracle.calculate_completeness(data, criteria, 10)
        assert score < 0.5, "Zero records should give low score"


class TestFreshness:
    """Test data freshness scoring"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_fresh_data(self):
        today = datetime.utcnow()
        data = {
            "exploits": [
                {"date": (today - timedelta(days=5)).isoformat()},
                {"date": (today - timedelta(days=10)).isoformat()},
            ]
        }
        score = self.oracle.calculate_freshness(data)
        assert score == 1.0, "Data within 30 days should be 1.0"

    def test_medium_age_data(self):
        today = datetime.utcnow()
        data = {
            "exploits": [
                {"date": (today - timedelta(days=60)).isoformat()},
            ]
        }
        score = self.oracle.calculate_freshness(data)
        assert score == 0.7, "Data 30-90 days old should be 0.7"

    def test_old_data(self):
        today = datetime.utcnow()
        data = {
            "exploits": [
                {"date": (today - timedelta(days=120)).isoformat()},
            ]
        }
        score = self.oracle.calculate_freshness(data)
        assert score == 0.3, "Data 90+ days old should be 0.3"

    def test_no_timestamps(self):
        data = {"exploits": [{"protocol": "Uniswap"}]}
        score = self.oracle.calculate_freshness(data)
        assert score == 1.0, "No timestamps should default to 1.0"


class TestQualityScore:
    """Test overall quality score calculation"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_perfect_quality(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = {
            "exploits": [
                {
                    "protocol": "Uniswap V3",
                    "chain": "Ethereum",
                    "amount": 1000000,
                    "date": datetime.utcnow().isoformat()
                } for _ in range(10)
            ]
        }
        criteria = ["Uniswap", "V3", "Ethereum"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, 10)
        assert score >= 80, f"Perfect match should score >= 80, got {score}"

    def test_poor_quality_wrong_protocol(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = {
            "exploits": [
                {
                    "protocol": "Curve Finance",
                    "chain": "Ethereum",
                    "date": datetime.utcnow().isoformat()
                }
            ]
        }
        criteria = ["Uniswap", "V3", "Ethereum"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, 10)
        assert score < 60, f"Wrong protocol should score < 60, got {score}"

    def test_poor_quality_wrong_chain(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = {
            "exploits": [
                {
                    "protocol": "Uniswap V3",
                    "chain": "Polygon",
                    "date": datetime.utcnow().isoformat()
                }
            ]
        }
        criteria = ["Uniswap", "V3", "Ethereum"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, 10)
        assert score < 70, f"Wrong chain should score < 70, got {score}"

    def test_medium_quality_incomplete(self):
        query = "Uniswap V3 exploits on Ethereum"
        data = {
            "exploits": [
                {
                    "protocol": "Uniswap V3",
                    "chain": "Ethereum",
                    "date": datetime.utcnow().isoformat()
                } for _ in range(5)
            ]
        }
        criteria = ["Uniswap", "V3", "Ethereum"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, 10)
        assert 60 <= score < 90, f"Partial data should score 60-90, got {score}"


class TestRefundCalculation:
    """Test sliding scale refund calculation"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_score_95_no_refund(self):
        recommendation, refund = self.oracle.determine_refund(95)
        assert recommendation == "release"
        assert refund == 0.0

    def test_score_80_no_refund(self):
        recommendation, refund = self.oracle.determine_refund(80)
        assert recommendation == "release"
        assert refund == 0.0

    def test_score_75_partial_refund(self):
        recommendation, refund = self.oracle.determine_refund(75)
        assert recommendation == "partial_refund"
        assert 5 < refund < 7  # (80-75)/80 * 100 ≈ 6.25%

    def test_score_60_partial_refund(self):
        recommendation, refund = self.oracle.determine_refund(60)
        assert recommendation == "partial_refund"
        assert 24 < refund < 26  # (80-60)/80 * 100 = 25%

    def test_score_50_partial_refund(self):
        recommendation, refund = self.oracle.determine_refund(50)
        assert recommendation == "partial_refund"
        assert 37 < refund < 38  # (80-50)/80 * 100 = 37.5%

    def test_score_45_full_refund(self):
        recommendation, refund = self.oracle.determine_refund(45)
        assert recommendation == "full_refund"
        assert refund == 100.0

    def test_score_0_full_refund(self):
        recommendation, refund = self.oracle.determine_refund(0)
        assert recommendation == "full_refund"
        assert refund == 100.0


class TestSignatureGeneration:
    """Test Ed25519 signature generation"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_signature_format(self):
        signature = self.oracle.sign_result("tx_12345", 75)
        assert isinstance(signature, str)
        assert len(signature) == 128  # 64 bytes = 128 hex chars

    def test_signature_deterministic(self):
        sig1 = self.oracle.sign_result("tx_12345", 75)
        sig2 = self.oracle.sign_result("tx_12345", 75)
        # Same input should give same signature (same oracle instance)
        assert sig1 == sig2

    def test_different_transactions_different_signatures(self):
        sig1 = self.oracle.sign_result("tx_12345", 75)
        sig2 = self.oracle.sign_result("tx_67890", 75)
        assert sig1 != sig2

    def test_different_scores_different_signatures(self):
        sig1 = self.oracle.sign_result("tx_12345", 75)
        sig2 = self.oracle.sign_result("tx_12345", 50)
        assert sig1 != sig2


class TestEdgeCases:
    """Test edge cases and error handling"""

    def setup_method(self):
        self.oracle = VerifierOracle()

    def test_empty_data(self):
        query = "Uniswap exploits"
        data = {}
        criteria = ["Uniswap"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, None)
        assert score < 50, "Empty data should give low score"

    def test_empty_criteria(self):
        query = "Uniswap exploits"
        data = {"exploits": [{"protocol": "Uniswap"}]}
        criteria = []
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, None)
        # Should still work, completeness defaults to 1.0 with empty criteria
        assert score >= 0

    def test_malformed_dates(self):
        data = {
            "exploits": [
                {"date": "invalid-date-format"},
            ]
        }
        score = self.oracle.calculate_freshness(data)
        assert score == 1.0, "Malformed dates should default to 1.0"

    def test_very_long_query(self):
        query = "Uniswap " * 1000  # Very long query
        data = {"exploits": [{"protocol": "Uniswap"}]}
        criteria = ["Uniswap"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, None)
        assert 0 <= score <= 100, "Should handle long queries"

    def test_unicode_data(self):
        query = "Uniswap exploits 🦄"
        data = {"exploits": [{"protocol": "Uniswap 🦄"}]}
        criteria = ["Uniswap"]
        score, reasoning = self.oracle.calculate_quality_score(query, data, criteria, None)
        assert 0 <= score <= 100, "Should handle unicode"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
