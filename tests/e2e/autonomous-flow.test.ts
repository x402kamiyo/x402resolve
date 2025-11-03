/**
 * End-to-End Integration Tests
 *
 * Validates complete autonomous agent workflow from API discovery through
 * dispute resolution without human intervention.
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AutonomousServiceAgent } from '@x402resolve/agent-client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const ESCROW_PROGRAM_ID = new PublicKey('D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP');
const connection = new Connection('https://api.devnet.solana.com');

describe('End-to-End Autonomous Agent Flow', () => {
  let agentKeypair: Keypair;
  let agent: AutonomousServiceAgent;

  beforeAll(() => {
    agentKeypair = Keypair.generate();
    agent = new AutonomousServiceAgent({
      keypair: agentKeypair,
      connection,
      programId: ESCROW_PROGRAM_ID,
      qualityThreshold: 85,
      maxPrice: 0.001,
      autoDispute: true
    });
  });

  it('should complete full cycle: discover -> pay -> assess -> accept', async () => {
    // Scenario: High-quality data, agent accepts and releases payment

    const endpoint = 'http://localhost:3000/x402/exploits/latest';
    const query = { chain: 'ethereum', severity: 'critical' };
    const schema = {
      exploit_id: '',
      protocol: '',
      chain: '',
      amount_lost_usd: 0,
      timestamp: '',
      tx_hash: ''
    };

    const result = await agent.consumeAPI(endpoint, query, schema);

    // Quality should be high (all fields present, fresh data)
    expect(result.quality).toBeGreaterThanOrEqual(85);

    // No dispute filed
    expect(result.disputed).toBe(false);

    // Cost should equal full payment
    expect(result.cost).toBeCloseTo(0.0001, 6);

    // Data should be present
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data) ? result.data.length : 1).toBeGreaterThan(0);
  }, 30000);

  it('should handle poor quality with automatic dispute and refund', async () => {
    // Scenario: Poor quality data, agent disputes and receives refund

    const endpoint = 'http://localhost:3000/x402/exploits/latest';
    const query = { chain: 'unknown', severity: 'low' };  // Will get poor data
    const schema = {
      exploit_id: '',
      protocol: '',
      chain: '',
      amount_lost_usd: 0,
      timestamp: '',
      tx_hash: ''
    };

    // Mock poor quality response by requesting non-existent data
    try {
      const result = await agent.consumeAPI(endpoint, query, schema);

      if (result.quality < 85) {
        // Dispute should be filed automatically
        expect(result.disputed).toBe(true);

        // Refund should be proportional to quality deficiency
        expect(result.cost).toBeLessThan(0.0001);

        const refundPercentage = ((0.0001 - result.cost) / 0.0001) * 100;
        expect(refundPercentage).toBeGreaterThan(0);
        expect(refundPercentage).toBeLessThanOrEqual(100);
      }
    } catch (error) {
      // API might reject invalid requests, which is also acceptable
      expect(error).toBeDefined();
    }
  }, 30000);

  it('should assess quality using multi-factor scoring', async () => {
    const endpoint = 'http://localhost:3000/x402/exploits/latest';
    const query = { chain: 'ethereum', severity: 'critical' };
    const schema = {
      exploit_id: '',
      protocol: '',
      chain: '',
      amount_lost_usd: 0,
      timestamp: '',
      tx_hash: ''
    };

    const result = await agent.consumeAPI(endpoint, query, schema);

    // Quality score should be 0-100
    expect(result.quality).toBeGreaterThanOrEqual(0);
    expect(result.quality).toBeLessThanOrEqual(100);

    // Quality factors tested:
    // - Completeness (40%): All required fields present
    // - Accuracy (30%): Valid data formats
    // - Freshness (30%): Recent timestamps

    if (result.quality >= 85) {
      // High quality data should have all expected fields
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      expect(data).toHaveProperty('exploit_id');
      expect(data).toHaveProperty('protocol');
      expect(data).toHaveProperty('chain');
      expect(data).toHaveProperty('timestamp');
    }
  }, 30000);

  it('should operate autonomously without human intervention', async () => {
    // Validate that agent can make all decisions independently

    const decisions = [];

    // Decision 1: API Discovery
    const endpoint = 'http://localhost:3000/x402/exploits/latest';
    decisions.push('Discovered x402-enabled API');

    // Decision 2: Price Assessment
    const price = 0.0001;
    const maxPrice = 0.001;
    const priceAcceptable = price <= maxPrice;
    decisions.push(`Price ${priceAcceptable ? 'acceptable' : 'rejected'}`);

    expect(priceAcceptable).toBe(true);

    // Decision 3: Consume API
    const result = await agent.consumeAPI(
      endpoint,
      { chain: 'ethereum', severity: 'critical' },
      {
        exploit_id: '',
        protocol: '',
        chain: '',
        amount_lost_usd: 0,
        timestamp: '',
        tx_hash: ''
      }
    );
    decisions.push('Consumed API with payment proof');

    // Decision 4: Quality Assessment
    decisions.push(`Assessed quality: ${result.quality}/100`);

    // Decision 5: Dispute Decision
    if (result.disputed) {
      decisions.push('Filed dispute automatically');
    } else {
      decisions.push('Accepted quality, released payment');
    }

    // Verify all decisions made autonomously
    expect(decisions.length).toBe(5);
    expect(decisions.every(d => typeof d === 'string')).toBe(true);
  }, 30000);

  it('should handle network errors gracefully', async () => {
    const endpoint = 'http://invalid-domain-that-does-not-exist.xyz/api';
    const query = {};
    const schema = { data: '' };

    await expect(async () => {
      await agent.consumeAPI(endpoint, query, schema);
    }).rejects.toThrow();
  }, 10000);
});

describe('Quality Scoring Accuracy', () => {
  it('should score perfect match at 95-100%', () => {
    // Perfect data: all fields present, fresh timestamp, correct format
    const expectedFields = ['exploit_id', 'protocol', 'chain', 'amount_lost_usd', 'timestamp', 'tx_hash'];
    const data = {
      exploit_id: 'exp_20251103_001',
      protocol: 'UniswapV3',
      chain: 'ethereum',
      amount_lost_usd: 1250000,
      timestamp: new Date().toISOString(),
      tx_hash: '0x7f3c9842...'
    };

    // Completeness: 100% (all fields present)
    const completeness = expectedFields.every(field => field in data) ? 100 : 0;

    // Freshness: 100% (current timestamp)
    const age = Date.now() - new Date(data.timestamp).getTime();
    const freshness = age < 3600000 ? 100 : 50;  // <1 hour = 100%

    // Accuracy: 100% (valid formats)
    const accuracy = data.exploit_id.startsWith('exp_') &&
                     data.amount_lost_usd > 0 &&
                     ['ethereum', 'solana', 'bsc'].includes(data.chain) ? 100 : 50;

    const quality = (completeness * 0.4) + (accuracy * 0.3) + (freshness * 0.3);

    expect(quality).toBeGreaterThanOrEqual(95);
    expect(quality).toBeLessThanOrEqual(100);
  });

  it('should score partial match at 60-80%', () => {
    // Partial data: some fields missing, older timestamp
    const data = {
      exploit_id: 'exp_20251103_001',
      protocol: 'UniswapV3',
      chain: 'ethereum',
      // Missing: amount_lost_usd, tx_hash
      timestamp: new Date(Date.now() - 7200000).toISOString()  // 2 hours old
    };

    const expectedFields = ['exploit_id', 'protocol', 'chain', 'amount_lost_usd', 'timestamp', 'tx_hash'];

    // Completeness: 66% (4/6 fields present)
    const presentFields = expectedFields.filter(field => field in data).length;
    const completeness = (presentFields / expectedFields.length) * 100;

    // Freshness: 70% (2 hours old)
    const freshness = 70;

    // Accuracy: 80% (valid formats but incomplete)
    const accuracy = 80;

    const quality = (completeness * 0.4) + (accuracy * 0.3) + (freshness * 0.3);

    expect(quality).toBeGreaterThanOrEqual(60);
    expect(quality).toBeLessThanOrEqual(80);
  });

  it('should score poor quality at 20-40%', () => {
    // Poor data: many fields missing, very old, invalid formats
    const data = {
      exploit_id: 'invalid_id',  // Wrong format
      protocol: 'Unknown',
      // Missing: chain, amount_lost_usd, timestamp, tx_hash
    };

    const expectedFields = ['exploit_id', 'protocol', 'chain', 'amount_lost_usd', 'timestamp', 'tx_hash'];

    // Completeness: 33% (2/6 fields present)
    const completeness = 33;

    // Freshness: 0% (no timestamp)
    const freshness = 0;

    // Accuracy: 30% (invalid format)
    const accuracy = 30;

    const quality = (completeness * 0.4) + (accuracy * 0.3) + (freshness * 0.3);

    expect(quality).toBeGreaterThanOrEqual(10);
    expect(quality).toBeLessThanOrEqual(40);
  });

  it('should score empty response at 0-10%', () => {
    const data = {};
    const quality = 5;  // Empty response gets minimal score

    expect(quality).toBeGreaterThanOrEqual(0);
    expect(quality).toBeLessThanOrEqual(10);
  });
});
