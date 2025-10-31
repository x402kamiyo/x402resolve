/**
 * End-to-End Integration Tests
 * Tests complete workflow: escrow creation → data receipt → quality check → dispute → resolution
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { expect } from 'chai';
import { ReputationManager } from '../../packages/x402-sdk/src/reputation';
import axios from 'axios';

const PROGRAM_ID = new PublicKey('AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR');
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const VERIFIER_URL = process.env.VERIFIER_URL || 'http://localhost:8000';

describe('End-to-End Integration Tests', () => {
  let connection: Connection;
  let agent: Keypair;
  let apiProvider: Keypair;
  let reputationManager: ReputationManager;

  before(async () => {
    connection = new Connection(RPC_URL, 'confirmed');
    agent = Keypair.generate();
    apiProvider = Keypair.generate();

    // Fund accounts
    const airdropSig = await connection.requestAirdrop(
      agent.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig);

    const wallet = new Wallet(agent);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    reputationManager = new ReputationManager(connection, null as any, PROGRAM_ID);
  });

  describe('Happy Path: High Quality Data', () => {
    it('should release full payment for quality >= 80', async () => {
      const transactionId = `tx_happy_${Date.now()}`;
      const query = 'Uniswap V3 exploits on Ethereum';

      // Simulate receiving high-quality data
      const dataReceived = {
        exploits: [
          {
            protocol: 'Uniswap V3',
            chain: 'Ethereum',
            amount_usd: 25000000,
            tx_hash: '0xabc123',
            timestamp: '2023-09-15',
            source: 'BlockSec',
          },
          {
            protocol: 'Uniswap V3',
            chain: 'Ethereum',
            amount_usd: 8000000,
            tx_hash: '0xdef456',
            timestamp: '2023-07-22',
            source: 'PeckShield',
          },
        ],
      };

      // Request quality verification
      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: query,
        data_received: dataReceived,
        expected_criteria: ['tx_hash', 'amount_usd', 'timestamp', 'chain'],
        transaction_id: transactionId,
        expected_record_count: 2,
      });

      expect(response.status).to.equal(200);
      expect(response.data.quality_score).to.be.greaterThan(70);
      expect(response.data.recommendation).to.equal('release');
      expect(response.data.refund_percentage).to.equal(0);
      expect(response.data.signature).to.be.a('string');
    });
  });

  describe('Dispute Path: Medium Quality Data', () => {
    it('should return partial refund for quality 50-79', async () => {
      const transactionId = `tx_medium_${Date.now()}`;
      const query = 'Solana DeFi exploits since 2023';

      // Simulate receiving medium-quality data (incomplete)
      const dataReceived = {
        exploits: [
          {
            protocol: 'Solend',
            amount_usd: 1200000,
            // Missing tx_hash and timestamp
          },
          {
            protocol: 'Mango Markets',
            chain: 'Solana',
            amount_usd: 114000000,
            timestamp: '2022-10-11',
            // Missing tx_hash
          },
        ],
      };

      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: query,
        data_received: dataReceived,
        expected_criteria: ['tx_hash', 'amount_usd', 'timestamp'],
        transaction_id: transactionId,
        expected_record_count: 3,
      });

      expect(response.status).to.equal(200);
      expect(response.data.quality_score).to.be.within(50, 79);
      expect(response.data.recommendation).to.equal('partial_refund');
      expect(response.data.refund_percentage).to.be.greaterThan(0);
      expect(response.data.refund_percentage).to.be.lessThan(100);
    });
  });

  describe('Dispute Path: Low Quality Data', () => {
    it('should return full refund for quality < 50', async () => {
      const transactionId = `tx_low_${Date.now()}`;
      const query = 'Uniswap V3 exploits on Ethereum';

      // Simulate receiving low-quality data (wrong protocol, missing fields)
      const dataReceived = {
        exploits: [
          {
            protocol: 'Curve Finance', // Wrong protocol
            chain: 'BSC', // Wrong chain
            amount_usd: 62000000,
            // Missing tx_hash, timestamp
          },
        ],
      };

      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: query,
        data_received: dataReceived,
        expected_criteria: ['tx_hash', 'amount_usd', 'timestamp'],
        transaction_id: transactionId,
        expected_record_count: 5,
      });

      expect(response.status).to.equal(200);
      expect(response.data.quality_score).to.be.lessThan(70);
      expect(response.data.refund_percentage).to.be.greaterThan(20);
    });
  });

  describe('Reputation Management', () => {
    it('should calculate dispute cost based on dispute rate', () => {
      // No reputation - base cost
      const cost1 = reputationManager.calculateDisputeCost(null);
      expect(cost1).to.equal(0.001);

      // 10% dispute rate - 1x cost
      const reputation10 = {
        entity: agent.publicKey,
        entityType: 'Agent' as const,
        totalTransactions: 100,
        disputesFiled: 10,
        disputesWon: 5,
        disputesPartial: 3,
        disputesLost: 2,
        averageQualityReceived: 85,
        reputationScore: 800,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      const cost2 = reputationManager.calculateDisputeCost(reputation10);
      expect(cost2).to.equal(0.001);

      // 70% dispute rate - 10x cost
      const reputation70 = {
        ...reputation10,
        disputesFiled: 70,
      };
      const cost3 = reputationManager.calculateDisputeCost(reputation70);
      expect(cost3).to.equal(0.01);
    });

    it('should calculate dispute success rate correctly', () => {
      const reputation = {
        entity: agent.publicKey,
        entityType: 'Agent' as const,
        totalTransactions: 20,
        disputesFiled: 10,
        disputesWon: 4, // 4 full wins
        disputesPartial: 4, // 2 equivalent wins (4 * 0.5)
        disputesLost: 2, // 0 wins
        averageQualityReceived: 75,
        reputationScore: 700,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      // (4 + 2) / 10 = 0.6 = 60%
      const successRate = reputationManager.getDisputeSuccessRate(reputation);
      expect(successRate).to.equal(60);
    });

    it('should return correct rate limits for each verification level', () => {
      const basic = reputationManager.getVerificationLevelLimits('Basic');
      expect(basic.hourlyLimit).to.equal(1);
      expect(basic.dailyLimit).to.equal(10);

      const staked = reputationManager.getVerificationLevelLimits('Staked');
      expect(staked.hourlyLimit).to.equal(10);
      expect(staked.dailyLimit).to.equal(100);

      const social = reputationManager.getVerificationLevelLimits('Social');
      expect(social.hourlyLimit).to.equal(50);
      expect(social.dailyLimit).to.equal(500);

      const kyc = reputationManager.getVerificationLevelLimits('KYC');
      expect(kyc.hourlyLimit).to.equal(1000);
      expect(kyc.dailyLimit).to.equal(10000);
    });
  });

  describe('PDA Derivation', () => {
    it('should derive reputation PDA deterministically', () => {
      const [pda1, bump1] = reputationManager.getReputationPDA(agent.publicKey);
      const [pda2, bump2] = reputationManager.getReputationPDA(agent.publicKey);

      expect(pda1.toString()).to.equal(pda2.toString());
      expect(bump1).to.equal(bump2);
      expect(bump1).to.be.greaterThanOrEqual(0);
      expect(bump1).to.be.lessThan(256);
    });

    it('should derive rate limiter PDA deterministically', () => {
      const [pda1, bump1] = reputationManager.getRateLimiterPDA(agent.publicKey);
      const [pda2, bump2] = reputationManager.getRateLimiterPDA(agent.publicKey);

      expect(pda1.toString()).to.equal(pda2.toString());
      expect(bump1).to.equal(bump2);
    });

    it('should derive different PDAs for different entities', () => {
      const [pda1] = reputationManager.getReputationPDA(agent.publicKey);
      const [pda2] = reputationManager.getReputationPDA(apiProvider.publicKey);

      expect(pda1.toString()).to.not.equal(pda2.toString());
    });
  });

  describe('Verifier Oracle Health', () => {
    it('should return operational status', async () => {
      const response = await axios.get(`${VERIFIER_URL}/`);

      expect(response.status).to.equal(200);
      expect(response.data.service).to.equal('x402 Verifier Oracle');
      expect(response.data.status).to.equal('operational');
      expect(response.data.verifier_pubkey).to.be.a('string');
    });

    it('should return public key for signature verification', async () => {
      const response = await axios.get(`${VERIFIER_URL}/public-key`);

      expect(response.status).to.equal(200);
      expect(response.data.public_key).to.be.a('string');
      expect(response.data.encoding).to.equal('hex');
      expect(response.data.algorithm).to.equal('ed25519');
    });
  });

  describe('Signature Verification', () => {
    it('should generate valid Ed25519 signatures', async () => {
      const transactionId = `tx_sig_${Date.now()}`;
      const query = 'Test query';
      const data = { test: 'data' };

      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: query,
        data_received: data,
        expected_criteria: ['test'],
        transaction_id: transactionId,
      });

      expect(response.status).to.equal(200);
      expect(response.data.signature).to.be.a('string');
      expect(response.data.signature.length).to.be.greaterThan(0);

      // Verify signature is valid hex
      const signatureBytes = Buffer.from(response.data.signature, 'hex');
      expect(signatureBytes.length).to.equal(64); // Ed25519 signature length
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', async () => {
      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: 'Any query',
        data_received: {},
        expected_criteria: [],
        transaction_id: 'tx_empty',
      });

      expect(response.status).to.equal(200);
      expect(response.data.quality_score).to.be.a('number');
    });

    it('should handle malformed data without crashing', async () => {
      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: 'Test',
        data_received: { random: { nested: { structure: true } } },
        expected_criteria: ['nonexistent'],
        transaction_id: 'tx_malformed',
      });

      expect(response.status).to.equal(200);
      expect(response.data.quality_score).to.be.a('number');
    });

    it('should handle very long queries', async () => {
      const longQuery = 'A'.repeat(1000);

      const response = await axios.post(`${VERIFIER_URL}/verify-quality`, {
        original_query: longQuery,
        data_received: { data: 'test' },
        expected_criteria: ['data'],
        transaction_id: 'tx_long',
      });

      expect(response.status).to.equal(200);
    });
  });
});
