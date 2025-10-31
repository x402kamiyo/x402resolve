/**
 * Reputation Manager Tests
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { ReputationManager, EntityReputation } from '../src/reputation';

describe('ReputationManager', () => {
  let connection: Connection;
  let reputationManager: ReputationManager;
  let testEntity: Keypair;

  beforeAll(() => {
    connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    testEntity = Keypair.generate();

    const programId = new PublicKey('AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR');
    // Note: In real tests, initialize with actual program
    reputationManager = new ReputationManager(connection, null as any, programId);
  });

  describe('PDA derivation', () => {
    it('should derive reputation PDA correctly', () => {
      const [pda, bump] = reputationManager.getReputationPDA(testEntity.publicKey);
      expect(pda).toBeInstanceOf(PublicKey);
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThan(256);
    });

    it('should derive rate limiter PDA correctly', () => {
      const [pda, bump] = reputationManager.getRateLimiterPDA(testEntity.publicKey);
      expect(pda).toBeInstanceOf(PublicKey);
      expect(bump).toBeGreaterThanOrEqual(0);
      expect(bump).toBeLessThan(256);
    });

    it('should derive consistent PDAs', () => {
      const [pda1] = reputationManager.getReputationPDA(testEntity.publicKey);
      const [pda2] = reputationManager.getReputationPDA(testEntity.publicKey);
      expect(pda1.toString()).toBe(pda2.toString());
    });
  });

  describe('Dispute success rate calculation', () => {
    it('should return 0 for no disputes', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 10,
        disputesFiled: 0,
        disputesWon: 0,
        disputesPartial: 0,
        disputesLost: 0,
        averageQualityReceived: 85,
        reputationScore: 800,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const rate = reputationManager.getDisputeSuccessRate(reputation);
      expect(rate).toBe(0);
    });

    it('should calculate 100% success rate for all wins', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 10,
        disputesFiled: 5,
        disputesWon: 5,
        disputesPartial: 0,
        disputesLost: 0,
        averageQualityReceived: 85,
        reputationScore: 800,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const rate = reputationManager.getDisputeSuccessRate(reputation);
      expect(rate).toBe(100);
    });

    it('should calculate 50% success rate for partial wins', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 10,
        disputesFiled: 4,
        disputesWon: 0,
        disputesPartial: 4,
        disputesLost: 0,
        averageQualityReceived: 70,
        reputationScore: 600,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const rate = reputationManager.getDisputeSuccessRate(reputation);
      expect(rate).toBe(50);
    });

    it('should calculate mixed success rate correctly', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
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
      const rate = reputationManager.getDisputeSuccessRate(reputation);
      expect(rate).toBe(60);
    });
  });

  describe('Verification level limits', () => {
    it('should return correct limits for Basic level', () => {
      const limits = reputationManager.getVerificationLevelLimits('Basic');
      expect(limits.level).toBe('Basic');
      expect(limits.hourlyLimit).toBe(1);
      expect(limits.dailyLimit).toBe(10);
    });

    it('should return correct limits for Staked level', () => {
      const limits = reputationManager.getVerificationLevelLimits('Staked');
      expect(limits.level).toBe('Staked');
      expect(limits.hourlyLimit).toBe(10);
      expect(limits.dailyLimit).toBe(100);
    });

    it('should return correct limits for Social level', () => {
      const limits = reputationManager.getVerificationLevelLimits('Social');
      expect(limits.level).toBe('Social');
      expect(limits.hourlyLimit).toBe(50);
      expect(limits.dailyLimit).toBe(500);
    });

    it('should return correct limits for KYC level', () => {
      const limits = reputationManager.getVerificationLevelLimits('KYC');
      expect(limits.level).toBe('KYC');
      expect(limits.hourlyLimit).toBe(1000);
      expect(limits.dailyLimit).toBe(10000);
    });
  });

  describe('Dispute cost calculation', () => {
    it('should return base cost for no reputation', () => {
      const cost = reputationManager.calculateDisputeCost(null);
      expect(cost).toBe(0.001);
    });

    it('should return base cost for no transactions', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 0,
        disputesFiled: 0,
        disputesWon: 0,
        disputesPartial: 0,
        disputesLost: 0,
        averageQualityReceived: 0,
        reputationScore: 500,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const cost = reputationManager.calculateDisputeCost(reputation);
      expect(cost).toBe(0.001);
    });

    it('should return 1x cost for low dispute rate (0-20%)', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 100,
        disputesFiled: 10, // 10% dispute rate
        disputesWon: 5,
        disputesPartial: 3,
        disputesLost: 2,
        averageQualityReceived: 85,
        reputationScore: 850,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const cost = reputationManager.calculateDisputeCost(reputation);
      expect(cost).toBe(0.001);
    });

    it('should return 2x cost for moderate dispute rate (21-40%)', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 100,
        disputesFiled: 30, // 30% dispute rate
        disputesWon: 15,
        disputesPartial: 10,
        disputesLost: 5,
        averageQualityReceived: 75,
        reputationScore: 700,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const cost = reputationManager.calculateDisputeCost(reputation);
      expect(cost).toBe(0.002);
    });

    it('should return 5x cost for high dispute rate (41-60%)', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 100,
        disputesFiled: 50, // 50% dispute rate
        disputesWon: 25,
        disputesPartial: 15,
        disputesLost: 10,
        averageQualityReceived: 65,
        reputationScore: 600,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const cost = reputationManager.calculateDisputeCost(reputation);
      expect(cost).toBe(0.005);
    });

    it('should return 10x cost for very high dispute rate (>60%)', () => {
      const reputation: EntityReputation = {
        entity: testEntity.publicKey,
        entityType: 'Agent',
        totalTransactions: 100,
        disputesFiled: 70, // 70% dispute rate
        disputesWon: 30,
        disputesPartial: 25,
        disputesLost: 15,
        averageQualityReceived: 55,
        reputationScore: 500,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };

      const cost = reputationManager.calculateDisputeCost(reputation);
      expect(cost).toBe(0.01);
    });
  });
});
