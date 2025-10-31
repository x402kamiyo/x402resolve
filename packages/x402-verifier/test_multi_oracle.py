#!/usr/bin/env python3
"""
Multi-Oracle System Tests
Tests consensus calculation, outlier detection, and slashing mechanisms
"""

import pytest
import nacl.signing
import nacl.encoding
from multi_oracle import (
    MultiOracleSystem,
    OracleAssessment,
    OracleStatus,
    ConsensusResult
)


class TestMultiOracleRegistration:
    """Test oracle registration and stake requirements"""

    def test_register_oracle_with_sufficient_stake(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()

        result = system.register_oracle(pubkey, 10.0, key)

        assert result == True
        assert pubkey in system.oracles
        assert system.oracles[pubkey].stake == 10.0

    def test_register_oracle_with_insufficient_stake(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()

        result = system.register_oracle(pubkey, 5.0, key)  # < 10 SOL minimum

        assert result == False
        assert pubkey not in system.oracles

    def test_cannot_register_same_oracle_twice(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()

        result1 = system.register_oracle(pubkey, 10.0, key)
        result2 = system.register_oracle(pubkey, 15.0, key)

        assert result1 == True
        assert result2 == False


class TestConsensusCalculation:
    """Test multi-oracle consensus mechanism"""

    def test_consensus_with_perfect_agreement(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 75, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 75, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 75, "reason", "sig3", 1002)
        ]

        consensus = system.calculate_consensus(assessments)

        assert consensus.median_score == 75
        assert consensus.mean_score == 75.0
        assert consensus.std_dev == 0.0
        assert consensus.confidence == 100
        assert len(consensus.outlier_indices) == 0

    def test_consensus_with_slight_variance(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 72, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 68, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 70, "reason", "sig3", 1002)
        ]

        consensus = system.calculate_consensus(assessments)

        assert consensus.median_score == 70  # Middle value
        assert 69 < consensus.mean_score < 71  # Average close to 70
        assert consensus.std_dev < 5  # Low variance
        assert consensus.confidence == 100  # High confidence

    def test_consensus_identifies_outliers(self):
        system = MultiOracleSystem()
        # Mean: 71, one score 85 points away (more than 2 std devs)
        assessments = [
            OracleAssessment("oracle1", 70, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 72, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 70, "reason", "sig3", 1002),
            OracleAssessment("oracle4", 71, "reason", "sig4", 1003),
            OracleAssessment("oracle5", 5, "reason", "sig5", 1004)  # Clear outlier
        ]

        consensus = system.calculate_consensus(assessments)

        assert len(consensus.outlier_indices) > 0
        assert 4 in consensus.outlier_indices  # Fifth oracle is outlier

    def test_consensus_requires_minimum_oracles(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 70, "reason", "sig1", 1000)
        ]  # Only 1 assessment

        with pytest.raises(ValueError):
            system.calculate_consensus(assessments)


class TestConfidenceScoring:
    """Test confidence calculation based on agreement"""

    def test_high_confidence_with_low_variance(self):
        system = MultiOracleSystem()
        confidence = system._calculate_confidence(3.0)  # Very low std dev
        assert confidence == 100

    def test_medium_confidence_with_moderate_variance(self):
        system = MultiOracleSystem()
        confidence = system._calculate_confidence(12.0)
        assert 70 <= confidence <= 80

    def test_low_confidence_with_high_variance(self):
        system = MultiOracleSystem()
        confidence = system._calculate_confidence(25.0)  # High disagreement
        assert confidence == 40


class TestSlashingMechanism:
    """Test oracle penalties for dishonest behavior"""

    def test_first_offense_warning_only(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0, key)

        slashed, banned = system.slash_oracle(pubkey, "Outlier assessment")

        assert slashed == 0.0  # No stake slashed on first offense
        assert banned == False
        assert system.oracles[pubkey].reputation_score == 400  # 500 - 100

    def test_second_offense_partial_slash(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0, key)

        system.slash_oracle(pubkey, "First offense")
        slashed, banned = system.slash_oracle(pubkey, "Second offense")

        assert slashed == 1.0  # 10% of 10 SOL
        assert banned == False
        assert system.oracles[pubkey].stake == 9.0

    def test_third_offense_suspension(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0, key)

        system.slash_oracle(pubkey, "First")
        system.slash_oracle(pubkey, "Second")
        slashed, banned = system.slash_oracle(pubkey, "Third")

        assert slashed == 4.5  # 50% of remaining 9 SOL
        assert banned == False
        assert system.oracles[pubkey].status == OracleStatus.SUSPENDED

    def test_fourth_offense_permanent_ban(self):
        system = MultiOracleSystem()
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0, key)

        system.slash_oracle(pubkey, "First")
        system.slash_oracle(pubkey, "Second")
        system.slash_oracle(pubkey, "Third")
        slashed, banned = system.slash_oracle(pubkey, "Fourth")

        assert slashed == 4.5  # All remaining stake
        assert banned == True
        assert system.oracles[pubkey].status == OracleStatus.BANNED
        assert system.oracles[pubkey].stake == 0.0


class TestOracleSelection:
    """Test random oracle selection mechanism"""

    def test_select_oracles_deterministic(self):
        system = MultiOracleSystem()

        # Register 5 oracles
        for i in range(5):
            key = nacl.signing.SigningKey.generate()
            pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
            system.register_oracle(pubkey, 10.0 + i, key)

        seed = b'x' * 32
        selected1 = system.select_oracles(3, seed)
        selected2 = system.select_oracles(3, seed)

        assert selected1 == selected2  # Same seed → same selection

    def test_select_oracles_different_seeds(self):
        system = MultiOracleSystem()

        for i in range(5):
            key = nacl.signing.SigningKey.generate()
            pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
            system.register_oracle(pubkey, 10.0 + i, key)

        seed1 = b'a' * 32
        seed2 = b'b' * 32
        selected1 = system.select_oracles(3, seed1)
        selected2 = system.select_oracles(3, seed2)

        # Different seeds likely produce different selections
        # (not guaranteed, but very probable)
        assert len(selected1) == 3
        assert len(selected2) == 3

    def test_select_oracles_insufficient_active(self):
        system = MultiOracleSystem()

        # Only register 2 oracles
        for i in range(2):
            key = nacl.signing.SigningKey.generate()
            pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
            system.register_oracle(pubkey, 10.0, key)

        seed = b'x' * 32

        with pytest.raises(ValueError):
            system.select_oracles(3, seed)  # Need 3, only have 2


class TestMultiOracleThresholds:
    """Test transaction value thresholds for multi-oracle"""

    def test_low_value_single_oracle(self):
        system = MultiOracleSystem()
        required, count = system.requires_multi_oracle(0.05)  # 0.05 SOL

        assert required == False
        assert count == 1

    def test_medium_value_optional_review(self):
        system = MultiOracleSystem()
        required, count = system.requires_multi_oracle(0.5)  # 0.5 SOL

        assert required == False  # Optional, not required
        assert count == 1

    def test_high_value_mandatory_multi_oracle(self):
        system = MultiOracleSystem()
        required, count = system.requires_multi_oracle(1.5)  # 1.5 SOL

        assert required == True
        assert count == 3


class TestFeeDistribution:
    """Test oracle fee calculation and distribution"""

    def test_single_oracle_gets_full_fee(self):
        system = MultiOracleSystem()
        fees = system.calculate_fee_split(10.0, 1)

        assert "primary" in fees
        assert "secondary" not in fees
        assert fees["primary"] == 0.01  # Capped at max

    def test_multi_oracle_60_40_split(self):
        system = MultiOracleSystem()
        fees = system.calculate_fee_split(100.0, 3)

        assert fees["primary"] == 0.01 * 0.60  # 60% of max fee
        assert fees["secondary"] == 0.01 * 0.40 / 2  # 40% split between 2

    def test_minimum_fee_enforced(self):
        system = MultiOracleSystem()
        fees = system.calculate_fee_split(0.01, 1)  # Very small transaction

        assert fees["primary"] >= 0.0001  # Minimum fee

    def test_maximum_fee_capped(self):
        system = MultiOracleSystem()
        fees = system.calculate_fee_split(1000.0, 1)  # Very large transaction

        assert fees["primary"] == 0.01  # Capped at maximum


class TestOracleFallbacks:
    """Test oracle failure and fallback mechanisms"""

    def test_handle_oracle_timeout_with_backup(self):
        system = MultiOracleSystem()

        # Register 3 oracles
        for i in range(3):
            key = nacl.signing.SigningKey.generate()
            pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
            system.register_oracle(pubkey, 10.0, key)

        oracles_list = list(system.oracles.keys())
        timeout_oracle = oracles_list[0]

        # Handle timeout
        backup = system.handle_oracle_timeout(timeout_oracle, 3600)

        assert backup is not None
        assert backup != timeout_oracle
        assert backup in system.oracles
        assert system.oracles[timeout_oracle].reputation_score == 450  # 500 - 50

    def test_handle_oracle_timeout_no_backup(self):
        system = MultiOracleSystem()

        # Register only 1 oracle
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0, key)

        # Handle timeout - no backup available
        backup = system.handle_oracle_timeout(pubkey)

        assert backup is None

    def test_full_oracle_failure_new_set(self):
        system = MultiOracleSystem()

        # Register 6 oracles (3 failed, 3 available)
        for i in range(6):
            key = nacl.signing.SigningKey.generate()
            pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
            system.register_oracle(pubkey, 10.0 + i, key)

        oracles_list = list(system.oracles.keys())
        failed = oracles_list[:3]

        resolution = system.handle_full_oracle_failure(failed, 1.5)

        assert resolution["strategy"] == "new_oracle_set"
        assert len(resolution["oracles"]) == 3
        assert all(o not in failed for o in resolution["oracles"])

    def test_full_oracle_failure_reduced_threshold(self):
        system = MultiOracleSystem()

        # Register 4 oracles (3 failed, 1 available)
        for i in range(4):
            key = nacl.signing.SigningKey.generate()
            pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
            system.register_oracle(pubkey, 10.0, key)

        oracles_list = list(system.oracles.keys())
        failed = oracles_list[:2]

        resolution = system.handle_full_oracle_failure(failed, 1.5)

        assert resolution["strategy"] == "reduced_threshold"
        assert len(resolution["oracles"]) == 2

    def test_full_oracle_failure_admin_oracle(self):
        system = MultiOracleSystem()

        # Register 1 high-reputation oracle
        key = nacl.signing.SigningKey.generate()
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0, key)
        system.oracles[pubkey].reputation_score = 950  # Admin level

        # All others failed
        failed = ["oracle1", "oracle2", "oracle3"]

        resolution = system.handle_full_oracle_failure(failed, 1.5)

        assert resolution["strategy"] == "admin_oracle"
        assert len(resolution["oracles"]) == 1
        assert resolution["oracles"][0] == pubkey

    def test_full_oracle_failure_delayed_retry(self):
        system = MultiOracleSystem()

        # No oracles available
        failed = ["oracle1", "oracle2", "oracle3"]

        resolution = system.handle_full_oracle_failure(failed, 2.0)

        assert resolution["strategy"] == "delayed_retry"
        assert resolution["retry_hours"] == 24
        assert resolution["interim_refund_pct"] == 50
        assert resolution["interim_refund_amount"] == 1.0  # 50% of 2.0


class TestCollusionDetection:
    """Test collusion detection mechanisms"""

    def test_detect_collusion_identical_scores(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 75, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 75, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 75, "reason", "sig3", 1002)
        ]

        detected, indices = system.detect_collusion(assessments)

        assert detected == True
        assert len(indices) == 3

    def test_detect_collusion_low_variance(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 70, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 71, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 70, "reason", "sig3", 1002)
        ]

        detected, indices = system.detect_collusion(assessments)

        assert detected == True  # Variance < 2.0

    def test_detect_collusion_paired_scores(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 80, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 80, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 65, "reason", "sig3", 1002)
        ]

        detected, indices = system.detect_collusion(assessments)

        assert detected == True
        assert 0 in indices and 1 in indices

    def test_no_collusion_detected(self):
        system = MultiOracleSystem()
        assessments = [
            OracleAssessment("oracle1", 70, "reason", "sig1", 1000),
            OracleAssessment("oracle2", 85, "reason", "sig2", 1001),
            OracleAssessment("oracle3", 92, "reason", "sig3", 1002)
        ]

        detected, indices = system.detect_collusion(assessments)

        assert detected == False
        assert len(indices) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
