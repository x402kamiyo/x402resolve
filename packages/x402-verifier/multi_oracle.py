#!/usr/bin/env python3
"""
Multi-Oracle Consensus System (Phase 2 Prototype)
Implements 3-oracle consensus with median scoring and outlier detection
"""

import logging
import statistics
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import nacl.signing
import nacl.encoding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OracleStatus(Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"


@dataclass
class OracleAssessment:
    """Single oracle's quality assessment"""
    oracle_pubkey: str
    quality_score: int  # 0-100
    reasoning: str
    signature: str
    timestamp: int


@dataclass
class Oracle:
    """Oracle registration and reputation"""
    pubkey: str
    stake: float  # SOL staked
    total_assessments: int
    slashed_count: int
    reputation_score: int  # 0-1000
    status: OracleStatus


@dataclass
class ConsensusResult:
    """Multi-oracle consensus calculation"""
    median_score: int
    mean_score: float
    std_dev: float
    confidence: int  # 0-100
    outlier_indices: List[int]
    assessments: List[OracleAssessment]


class MultiOracleSystem:
    """
    Multi-oracle consensus mechanism for high-value disputes

    Features:
    - 3-oracle consensus with median scoring
    - Outlier detection (>2 std dev from mean)
    - Slashing for dishonest oracles
    - Confidence scoring based on agreement
    """

    # Configuration
    MIN_ORACLES = 3
    MAX_ORACLES = 5
    MIN_STAKE = 10.0  # 10 SOL minimum
    OUTLIER_THRESHOLD = 1.5  # Standard deviations

    # Value thresholds for multi-oracle
    THRESHOLD_OPTIONAL_REVIEW = 0.1  # SOL
    THRESHOLD_MANDATORY_MULTI = 1.0  # SOL

    def __init__(self):
        self.oracles: Dict[str, Oracle] = {}

    def register_oracle(
        self,
        pubkey: str,
        stake: float,
        signing_key: nacl.signing.SigningKey
    ) -> bool:
        """
        Register new oracle with minimum stake requirement

        Args:
            pubkey: Oracle's Ed25519 public key
            stake: SOL staked (must be >= MIN_STAKE)
            signing_key: Oracle's signing key for verification

        Returns:
            True if registered successfully
        """
        if stake < self.MIN_STAKE:
            logger.error(f"Insufficient stake: {stake} SOL < {self.MIN_STAKE} SOL")
            return False

        if pubkey in self.oracles:
            logger.error(f"Oracle {pubkey[:8]} already registered")
            return False

        oracle = Oracle(
            pubkey=pubkey,
            stake=stake,
            total_assessments=0,
            slashed_count=0,
            reputation_score=500,  # Start at median
            status=OracleStatus.ACTIVE
        )

        self.oracles[pubkey] = oracle
        logger.info(f"Registered oracle {pubkey[:8]} with {stake} SOL stake")
        return True

    def calculate_consensus(
        self,
        assessments: List[OracleAssessment]
    ) -> ConsensusResult:
        """
        Calculate consensus from multiple oracle assessments

        Algorithm:
        1. Calculate median score (primary result)
        2. Calculate mean and standard deviation
        3. Identify outliers (>2 std dev from mean)
        4. Calculate confidence (lower std dev = higher confidence)

        Args:
            assessments: List of quality assessments from different oracles

        Returns:
            ConsensusResult with median, statistics, and outliers
        """
        if len(assessments) < self.MIN_ORACLES:
            raise ValueError(f"Requires {self.MIN_ORACLES}+ assessments, got {len(assessments)}")

        scores = [a.quality_score for a in assessments]

        # Calculate median (primary consensus score)
        median_score = int(statistics.median(scores))

        # Calculate mean and standard deviation
        mean_score = statistics.mean(scores)

        if len(scores) > 1:
            std_dev = statistics.stdev(scores)
        else:
            std_dev = 0.0

        # Identify outliers (>2 std dev from mean)
        outlier_indices = []
        for i, score in enumerate(scores):
            deviation = abs(score - mean_score)
            if deviation > (self.OUTLIER_THRESHOLD * std_dev):
                outlier_indices.append(i)
                logger.warning(
                    f"Outlier detected: Oracle {assessments[i].oracle_pubkey[:8]} "
                    f"score {score} deviates {deviation:.1f} from mean {mean_score:.1f}"
                )

        # Calculate confidence (inverse of std dev)
        confidence = self._calculate_confidence(std_dev)

        result = ConsensusResult(
            median_score=median_score,
            mean_score=mean_score,
            std_dev=std_dev,
            confidence=confidence,
            outlier_indices=outlier_indices,
            assessments=assessments
        )

        logger.info(
            f"Consensus: median={median_score}, mean={mean_score:.1f}, "
            f"std_dev={std_dev:.1f}, confidence={confidence}%, "
            f"outliers={len(outlier_indices)}"
        )

        return result

    def _calculate_confidence(self, std_dev: float) -> int:
        """
        Calculate confidence score based on standard deviation

        Lower std dev = higher agreement = higher confidence

        Confidence levels:
        - std_dev < 5: 100% (excellent agreement)
        - std_dev < 10: 90% (good agreement)
        - std_dev < 15: 75% (moderate agreement)
        - std_dev < 20: 60% (weak agreement)
        - std_dev >= 20: 40% (poor agreement)
        """
        if std_dev < 5:
            return 100
        elif std_dev < 10:
            return 90
        elif std_dev < 15:
            return 75
        elif std_dev < 20:
            return 60
        else:
            return 40

    def slash_oracle(self, pubkey: str, reason: str) -> Tuple[float, bool]:
        """
        Slash oracle for dishonest behavior

        Penalties:
        1. First offense: Warning + reputation -100
        2. Second: 10% stake slashed + reputation -200
        3. Third: 50% stake slashed + suspended 30 days
        4. Fourth: 100% stake slashed + permanent ban

        Args:
            pubkey: Oracle public key
            reason: Reason for slashing (outlier, timeout, invalid signature)

        Returns:
            (slashed_amount, banned)
        """
        if pubkey not in self.oracles:
            logger.error(f"Oracle {pubkey[:8]} not registered")
            return (0.0, False)

        oracle = self.oracles[pubkey]
        oracle.slashed_count += 1

        slashed_amount = 0.0
        banned = False

        if oracle.slashed_count == 1:
            # First offense: Warning only
            oracle.reputation_score = max(0, oracle.reputation_score - 100)
            logger.warning(
                f"Oracle {pubkey[:8]} slashed (1st offense): {reason}. "
                f"Reputation: {oracle.reputation_score}"
            )
        elif oracle.slashed_count == 2:
            # Second offense: 10% stake + reputation
            slashed_amount = oracle.stake * 0.10
            oracle.stake -= slashed_amount
            oracle.reputation_score = max(0, oracle.reputation_score - 200)
            logger.warning(
                f"Oracle {pubkey[:8]} slashed (2nd offense): {reason}. "
                f"Slashed {slashed_amount} SOL. Reputation: {oracle.reputation_score}"
            )
        elif oracle.slashed_count == 3:
            # Third offense: 50% stake + suspension
            slashed_amount = oracle.stake * 0.50
            oracle.stake -= slashed_amount
            oracle.status = OracleStatus.SUSPENDED
            logger.error(
                f"Oracle {pubkey[:8]} slashed (3rd offense): {reason}. "
                f"Slashed {slashed_amount} SOL. Suspended 30 days."
            )
        else:
            # Fourth+ offense: 100% stake + permanent ban
            slashed_amount = oracle.stake
            oracle.stake = 0.0
            oracle.status = OracleStatus.BANNED
            banned = True
            logger.error(
                f"Oracle {pubkey[:8]} permanently banned (4th offense): {reason}. "
                f"All stake slashed: {slashed_amount} SOL."
            )

        return (slashed_amount, banned)

    def requires_multi_oracle(self, transaction_value: float) -> Tuple[bool, int]:
        """
        Determine if transaction requires multi-oracle consensus

        Thresholds:
        - < 0.1 SOL: Single oracle
        - 0.1-1 SOL: Single oracle (appealable to multi-oracle)
        - > 1 SOL: Multi-oracle mandatory (3+ oracles)

        Args:
            transaction_value: Escrow amount in SOL

        Returns:
            (required, oracle_count)
        """
        if transaction_value >= self.THRESHOLD_MANDATORY_MULTI:
            return (True, self.MIN_ORACLES)
        elif transaction_value >= self.THRESHOLD_OPTIONAL_REVIEW:
            return (False, 1)  # Optional review available
        else:
            return (False, 1)  # Single oracle only

    def select_oracles(self, count: int, seed: bytes) -> List[str]:
        """
        Pseudo-randomly select active oracles

        Uses deterministic selection based on seed (transaction ID + blockhash)
        to prevent manipulation

        Args:
            count: Number of oracles to select
            seed: Random seed (32 bytes)

        Returns:
            List of selected oracle public keys
        """
        active_oracles = [
            pk for pk, oracle in self.oracles.items()
            if oracle.status == OracleStatus.ACTIVE
        ]

        if len(active_oracles) < count:
            raise ValueError(
                f"Insufficient active oracles: {len(active_oracles)} < {count}"
            )

        # Deterministic pseudo-random selection using seed
        import hashlib
        selected = []
        nonce = 0

        while len(selected) < count:
            # Hash seed + nonce to get pseudo-random index
            h = hashlib.sha256(seed + nonce.to_bytes(4, 'big')).digest()
            index = int.from_bytes(h[:4], 'big') % len(active_oracles)

            oracle_pk = active_oracles[index]
            if oracle_pk not in selected:
                selected.append(oracle_pk)

            nonce += 1

        logger.info(f"Selected {count} oracles: {[pk[:8] for pk in selected]}")
        return selected

    def calculate_fee_split(
        self,
        escrow_amount: float,
        oracle_count: int
    ) -> Dict[str, float]:
        """
        Calculate oracle assessment fees

        Fee structure:
        - Total fee: 0.1% of escrow (min 0.0001 SOL, max 0.01 SOL)
        - Primary oracle: 60% of fee
        - Secondary oracles: 40% split equally

        Args:
            escrow_amount: Transaction value in SOL
            oracle_count: Number of oracles assessing

        Returns:
            Dict mapping role to fee amount
        """
        # Calculate base fee (0.1% of escrow)
        base_fee = escrow_amount * 0.001
        base_fee = max(0.0001, min(base_fee, 0.01))  # Clamp to range

        if oracle_count == 1:
            return {"primary": base_fee}
        else:
            primary_fee = base_fee * 0.60
            secondary_fee = (base_fee * 0.40) / (oracle_count - 1)

            return {
                "primary": primary_fee,
                "secondary": secondary_fee
            }


# Example usage
if __name__ == "__main__":
    # Initialize system
    system = MultiOracleSystem()

    # Register 5 oracles with minimum stake
    oracle_keys = [nacl.signing.SigningKey.generate() for _ in range(5)]
    for i, key in enumerate(oracle_keys):
        pubkey = key.verify_key.encode(encoder=nacl.encoding.HexEncoder).decode()
        system.register_oracle(pubkey, 10.0 + i, key)

    # Simulate high-value transaction (1.5 SOL)
    transaction_value = 1.5
    required, count = system.requires_multi_oracle(transaction_value)

    print(f"\nTransaction: {transaction_value} SOL")
    print(f"Multi-oracle required: {required}")
    print(f"Oracle count: {count}")

    if required:
        # Select 3 oracles
        import secrets
        seed = secrets.token_bytes(32)
        selected = system.select_oracles(count, seed)

        # Simulate assessments
        assessments = [
            OracleAssessment(
                oracle_pubkey=selected[0],
                quality_score=72,
                reasoning="Semantic: 0.82, Completeness: 0.65, Freshness: 1.0",
                signature="abc123...",
                timestamp=1699564800
            ),
            OracleAssessment(
                oracle_pubkey=selected[1],
                quality_score=68,
                reasoning="Semantic: 0.78, Completeness: 0.60, Freshness: 1.0",
                signature="def456...",
                timestamp=1699564810
            ),
            OracleAssessment(
                oracle_pubkey=selected[2],
                quality_score=70,
                reasoning="Semantic: 0.80, Completeness: 0.62, Freshness: 1.0",
                signature="ghi789...",
                timestamp=1699564820
            )
        ]

        # Calculate consensus
        consensus = system.calculate_consensus(assessments)

        print(f"\nConsensus Result:")
        print(f"  Median Score: {consensus.median_score}/100")
        print(f"  Mean Score: {consensus.mean_score:.1f}/100")
        print(f"  Std Dev: {consensus.std_dev:.1f}")
        print(f"  Confidence: {consensus.confidence}%")
        print(f"  Outliers: {consensus.outlier_indices}")

        # Calculate fee distribution
        fees = system.calculate_fee_split(transaction_value, count)
        print(f"\nFee Distribution:")
        print(f"  Primary oracle: {fees['primary']:.6f} SOL")
        print(f"  Secondary oracles: {fees['secondary']:.6f} SOL each")

        # Simulate outlier detection and slashing
        if consensus.outlier_indices:
            outlier_idx = consensus.outlier_indices[0]
            outlier_pk = assessments[outlier_idx].oracle_pubkey
            slashed, banned = system.slash_oracle(outlier_pk, "Outlier assessment")
            print(f"\nSlashing:")
            print(f"  Oracle: {outlier_pk[:8]}")
            print(f"  Amount: {slashed:.6f} SOL")
            print(f"  Banned: {banned}")
