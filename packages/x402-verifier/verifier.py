#!/usr/bin/env python3
"""
x402 Verifier Oracle
Programmatic quality assessment for dispute resolution
"""

import logging
import hashlib
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import nacl.signing
import nacl.encoding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="x402 Verifier Oracle",
    description="Programmatic quality assessment for x402Resolve",
    version="1.0.0"
)

# Load sentence transformer model for semantic similarity
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# Verifier signing key (in production, load from secure vault)
VERIFIER_PRIVATE_KEY = nacl.signing.SigningKey.generate()
VERIFIER_PUBLIC_KEY = VERIFIER_PRIVATE_KEY.verify_key


class QualityVerificationRequest(BaseModel):
    """Request to verify data quality"""
    original_query: str
    data_received: Dict
    expected_criteria: List[str]
    transaction_id: str
    expected_record_count: Optional[int] = None


class QualityVerificationResponse(BaseModel):
    """Verification result with quality score and refund recommendation"""
    quality_score: float  # 0-100
    recommendation: str   # 'release' | 'partial_refund' | 'full_refund'
    refund_percentage: float  # 0-100
    reasoning: str
    signature: str  # Ed25519 signature for Solana verification


class VerifierOracle:
    """
    x402 Verifier Oracle - Programmatic quality assessment

    Calculates quality score based on:
    1. Semantic similarity (40%)
    2. Completeness (40%)
    3. Freshness (20%)
    """

    def __init__(self):
        self.model = model
        self.signing_key = VERIFIER_PRIVATE_KEY

    def calculate_semantic_similarity(self, query: str, data: str) -> float:
        """
        Calculate cosine similarity between query and data

        Returns: 0.0-1.0 (higher = more similar)
        """
        try:
            # Generate embeddings
            query_embedding = self.model.encode([query])[0]
            data_embedding = self.model.encode([data])[0]

            # Calculate cosine similarity
            similarity = cosine_similarity(
                query_embedding.reshape(1, -1),
                data_embedding.reshape(1, -1)
            )[0][0]

            return float(similarity)
        except Exception as e:
            logger.error(f"Semantic similarity error: {e}")
            return 0.0

    def calculate_completeness(
        self,
        data: Dict,
        expected_criteria: List[str],
        expected_count: Optional[int]
    ) -> float:
        """
        Calculate how complete the data is

        Factors:
        - Coverage of expected criteria keywords
        - Record count vs expected

        Returns: 0.0-1.0 (higher = more complete)
        """
        data_str = str(data).lower()

        # Check criteria coverage
        criteria_matched = sum(
            1 for criterion in expected_criteria
            if criterion.lower() in data_str
        )
        criteria_score = criteria_matched / len(expected_criteria) if expected_criteria else 1.0

        # Check record count if expected
        record_count_score = 1.0
        if expected_count and 'exploits' in data:
            actual_count = len(data.get('exploits', []))
            if actual_count > 0:
                record_count_score = min(actual_count / expected_count, 1.0)
            else:
                record_count_score = 0.0

        # Weighted average
        completeness = (criteria_score * 0.6) + (record_count_score * 0.4)

        return completeness

    def calculate_freshness(self, data: Dict) -> float:
        """
        Calculate data freshness

        For security/exploit data, checks timestamp recency

        Returns: 0.0-1.0 (higher = fresher)
        """
        try:
            # Extract timestamps from data
            timestamps = []

            if 'exploits' in data:
                for exploit in data.get('exploits', []):
                    if 'date' in exploit:
                        try:
                            timestamp = datetime.fromisoformat(exploit['date'])
                            timestamps.append(timestamp)
                        except:
                            continue

            if not timestamps:
                # No timestamps found, assume fresh
                return 1.0

            # Calculate average age
            now = datetime.utcnow()
            avg_age_days = sum(
                (now - ts).days for ts in timestamps
            ) / len(timestamps)

            # Freshness score: exponential decay
            # Fresh (0-30 days) = 1.0
            # Medium (30-90 days) = 0.7
            # Old (90+ days) = 0.3
            if avg_age_days <= 30:
                freshness = 1.0
            elif avg_age_days <= 90:
                freshness = 0.7
            else:
                freshness = 0.3

            return freshness
        except Exception as e:
            logger.error(f"Freshness calculation error: {e}")
            return 0.5  # Neutral if can't determine

    def calculate_quality_score(
        self,
        original_query: str,
        data_received: Dict,
        expected_criteria: List[str],
        expected_count: Optional[int]
    ) -> tuple[float, str]:
        """
        Calculate overall quality score

        Weighted factors:
        - Semantic similarity (40%)
        - Completeness (40%)
        - Freshness (20%)

        Returns: (quality_score 0-100, reasoning string)
        """
        # Convert data to string for semantic matching
        data_str = str(data_received)

        # Calculate individual scores
        semantic_score = self.calculate_semantic_similarity(original_query, data_str)
        completeness_score = self.calculate_completeness(
            data_received,
            expected_criteria,
            expected_count
        )
        freshness_score = self.calculate_freshness(data_received)

        # Weighted average
        quality_score = (
            semantic_score * 0.4 +
            completeness_score * 0.4 +
            freshness_score * 0.2
        ) * 100

        reasoning = (
            f"Semantic: {semantic_score:.2f}, "
            f"Completeness: {completeness_score:.2f}, "
            f"Freshness: {freshness_score:.2f}"
        )

        logger.info(f"Quality Score: {quality_score:.2f} | {reasoning}")

        return (quality_score, reasoning)

    def determine_refund(self, quality_score: float) -> tuple[str, float]:
        """
        Determine refund recommendation based on quality score

        Thresholds:
        - 80-100: Full release (0% refund)
        - 50-79: Partial refund (sliding scale)
        - 0-49: Full refund (100%)

        Returns: (recommendation, refund_percentage)
        """
        if quality_score >= 80:
            return ("release", 0.0)
        elif quality_score >= 50:
            # Sliding scale: (80 - score) / 80
            refund_pct = ((80 - quality_score) / 80) * 100
            return ("partial_refund", refund_pct)
        else:
            return ("full_refund", 100.0)

    def sign_result(self, transaction_id: str, quality_score: int) -> str:
        """
        Sign verification result with verifier's private key

        This signature is verified by Solana escrow program
        to ensure the score came from an authorized verifier
        """
        message = f"{transaction_id}:{quality_score}".encode()
        signed = self.signing_key.sign(message)
        signature_hex = signed.signature.hex()
        return signature_hex


# Global oracle instance
oracle = VerifierOracle()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "x402 Verifier Oracle",
        "version": "1.0.0",
        "status": "operational",
        "verifier_pubkey": VERIFIER_PUBLIC_KEY.encode(
            encoder=nacl.encoding.HexEncoder
        ).decode()
    }


@app.post("/verify-quality", response_model=QualityVerificationResponse)
async def verify_quality(request: QualityVerificationRequest):
    """
    Verify data quality and recommend refund

    This is the core endpoint for x402Resolve dispute resolution.

    Process:
    1. Calculate quality score (0-100)
    2. Determine refund recommendation
    3. Sign result with verifier's private key
    4. Return score + signature for Solana escrow
    """
    try:
        logger.info(f"Verifying quality for transaction: {request.transaction_id}")

        # Calculate quality score
        quality_score, reasoning = oracle.calculate_quality_score(
            request.original_query,
            request.data_received,
            request.expected_criteria,
            request.expected_record_count
        )

        # Determine refund
        recommendation, refund_percentage = oracle.determine_refund(quality_score)

        # Sign result
        signature = oracle.sign_result(
            request.transaction_id,
            int(quality_score)
        )

        logger.info(
            f"Quality: {quality_score:.2f} | "
            f"Recommendation: {recommendation} | "
            f"Refund: {refund_percentage:.2f}%"
        )

        return QualityVerificationResponse(
            quality_score=quality_score,
            recommendation=recommendation,
            refund_percentage=refund_percentage,
            reasoning=reasoning,
            signature=signature
        )

    except Exception as e:
        logger.error(f"Verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/public-key")
async def get_public_key():
    """
    Get verifier's public key for signature verification

    Solana escrow program uses this to validate signatures
    """
    return {
        "public_key": VERIFIER_PUBLIC_KEY.encode(
            encoder=nacl.encoding.HexEncoder
        ).decode(),
        "encoding": "hex",
        "algorithm": "ed25519"
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(" x402 Verifier Oracle starting...")
    logger.info(f"📡 Verifier Public Key: {VERIFIER_PUBLIC_KEY.encode(encoder=nacl.encoding.HexEncoder).decode()}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
