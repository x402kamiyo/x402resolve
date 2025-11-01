/**
 * Autonomous Agent Example
 *
 * Demonstrates autonomous agent that:
 * - Monitors data needs
 * - Creates escrow payments
 * - Verifies data quality
 * - Files disputes when quality fails
 * - Makes accept/reject decisions autonomously
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

interface AgentConfig {
  name: string;
  operationMode: 'autonomous' | 'supervised';
  checkIntervalSeconds: number;
  minQualityScore: number;
  autoDisputeThreshold: number;
  autoAcceptThreshold: number;
  defaultPaymentAmount: number;
  maxPaymentPerDay: number;
  solanaRpcUrl: string;
  verifierUrl: string;
  apiUrl: string;
  programId: string;
}

const config: AgentConfig = {
  name: process.env.AGENT_NAME || 'CryptoSecurityBot',
  operationMode: (process.env.OPERATION_MODE as any) || 'autonomous',
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL_SECONDS || '300'),
  minQualityScore: parseInt(process.env.MIN_QUALITY_SCORE || '80'),
  autoDisputeThreshold: parseInt(process.env.AUTO_DISPUTE_THRESHOLD || '75'),
  autoAcceptThreshold: parseInt(process.env.AUTO_ACCEPT_THRESHOLD || '85'),
  defaultPaymentAmount: parseFloat(process.env.DEFAULT_PAYMENT_AMOUNT_SOL || '0.01'),
  maxPaymentPerDay: parseFloat(process.env.MAX_PAYMENT_PER_DAY_SOL || '1.0'),
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  verifierUrl: process.env.VERIFIER_URL || 'http://localhost:8000',
  apiUrl: process.env.API_URL || 'https://api.kamiyo.ai',
  programId: process.env.PROGRAM_ID || 'AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR'
};

// ============================================================================
// Agent State
// ============================================================================

interface Payment {
  id: string;
  amount: number;
  timestamp: number;
  query: string;
  status: 'pending' | 'completed' | 'disputed' | 'refunded';
}

interface AgentState {
  totalPayments: number;
  totalDisputes: number;
  totalRefunds: number;
  paymentsToday: number;
  lastCheckTime: number;
  payments: Payment[];
}

let agentState: AgentState = {
  totalPayments: 0,
  totalDisputes: 0,
  totalRefunds: 0,
  paymentsToday: 0,
  lastCheckTime: 0,
  payments: []
};

// ============================================================================
// Logging
// ============================================================================

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${config.name}] [${level}] ${message}`;

  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// ============================================================================
// Agent Intelligence - Decision Making (Musubi: Creative Force)
// ============================================================================

class Musubi {
  /**
   * Decide if payment is needed based on agent's current state and goals
   */
  shouldMakePayment(): boolean {
    // Check daily spending limit
    if (agentState.paymentsToday >= config.maxPaymentPerDay / config.defaultPaymentAmount) {
      log('WARN', 'Daily payment limit reached, skipping payment');
      return false;
    }

    // In autonomous mode, always try to get fresh data
    if (config.operationMode === 'autonomous') {
      const timeSinceLastCheck = Date.now() - agentState.lastCheckTime;
      const shouldCheck = timeSinceLastCheck > config.checkIntervalSeconds * 1000;

      if (shouldCheck) {
        log('INFO', 'Time for periodic data refresh');
        return true;
      }
    }

    return false;
  }

  /**
   * Decide what to query for based on agent's goals
   */
  determineQuery(): string {
    // Agent's goal: Monitor recent DeFi security incidents
    const queries = [
      'Recent Uniswap exploits',
      'Flash loan attacks this month',
      'DeFi reentrancy vulnerabilities',
      'Price oracle manipulation attacks',
      'Recent bridge hacks'
    ];

    // Simple intelligence: rotate through queries
    const index = agentState.totalPayments % queries.length;
    return queries[index];
  }

  /**
   * Evaluate data quality and decide on action
   */
  evaluateAndDecide(qualityScore: number, data: any): {
    action: 'accept' | 'dispute' | 'review';
    reason: string;
  } {
    if (qualityScore >= config.autoAcceptThreshold) {
      return {
        action: 'accept',
        reason: `Quality score ${qualityScore} meets acceptance threshold ${config.autoAcceptThreshold}`
      };
    }

    if (qualityScore < config.autoDisputeThreshold) {
      return {
        action: 'dispute',
        reason: `Quality score ${qualityScore} below dispute threshold ${config.autoDisputeThreshold}`
      };
    }

    // In between thresholds - agent needs to analyze further
    return {
      action: 'review',
      reason: `Quality score ${qualityScore} requires additional analysis`
    };
  }

  /**
   * Analyze data in detail for edge cases
   */
  async analyzeData(data: any, query: string): Promise<{
    shouldDispute: boolean;
    reason: string;
  }> {
    log('INFO', 'Agent performing detailed analysis...');

    // Check 1: Minimum record count
    if (!data || !Array.isArray(data) || data.length < 3) {
      return {
        shouldDispute: true,
        reason: 'Insufficient records returned (expected at least 3)'
      };
    }

    // Check 2: Required fields present
    const requiredFields = ['protocol', 'chain', 'amount_usd', 'tx_hash'];
    const missingFields = requiredFields.filter(field =>
      !data.every(record => record.hasOwnProperty(field))
    );

    if (missingFields.length > 0) {
      return {
        shouldDispute: true,
        reason: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Check 3: Data relevance
    const queryLower = query.toLowerCase();
    const relevantRecords = data.filter(record => {
      const recordStr = JSON.stringify(record).toLowerCase();
      return queryLower.split(' ').some(term => recordStr.includes(term));
    });

    if (relevantRecords.length < data.length * 0.5) {
      return {
        shouldDispute: true,
        reason: `Only ${relevantRecords.length}/${data.length} records relevant to query`
      };
    }

    // All checks passed
    return {
      shouldDispute: false,
      reason: 'Data passed all quality checks'
    };
  }
}

// ============================================================================
// Agent Actions (Kotowari: Logic & Principle)
// ============================================================================

class Kotowari {
  private connection: Connection;
  private wallet: Keypair;
  private brain: Musubi;

  constructor(connection: Connection, wallet: Keypair) {
    this.connection = connection;
    this.wallet = wallet;
    this.brain = new Musubi();
  }

  /**
   * Simulated payment (in real implementation, would call escrow smart contract)
   */
  async makePayment(query: string): Promise<Payment> {
    log('INFO', `Creating payment for query: "${query}"`);

    const payment: Payment = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      amount: config.defaultPaymentAmount,
      timestamp: Date.now(),
      query: query,
      status: 'pending'
    };

    agentState.totalPayments++;
    agentState.paymentsToday++;
    agentState.payments.push(payment);

    log('INFO', 'Payment created', {
      id: payment.id,
      amount: payment.amount,
      query: payment.query
    });

    return payment;
  }

  /**
   * Simulated API call (in real implementation, would call actual API)
   */
  async fetchData(query: string): Promise<any> {
    log('INFO', `Fetching data for: "${query}"`);

    // Simulate API response with varying quality
    const scenarios = [
      {
        // Good data
        data: [
          { protocol: 'Uniswap V3', chain: 'Ethereum', amount_usd: 1500000, tx_hash: '0x123abc' },
          { protocol: 'Uniswap V3', chain: 'Ethereum', amount_usd: 800000, tx_hash: '0x456def' },
          { protocol: 'Uniswap V3', chain: 'Ethereum', amount_usd: 2100000, tx_hash: '0x789ghi' },
        ],
        quality: 92
      },
      {
        // Missing fields
        data: [
          { protocol: 'Curve', chain: 'Ethereum', amount_usd: 500000 }, // Missing tx_hash
          { protocol: 'Curve', amount_usd: 300000, tx_hash: '0xabc123' }, // Missing chain
        ],
        quality: 45
      },
      {
        // Wrong data
        data: [
          { protocol: 'Curve', chain: 'BSC', amount_usd: 1000000, tx_hash: '0xwrong1' },
          { protocol: 'PancakeSwap', chain: 'BSC', amount_usd: 500000, tx_hash: '0xwrong2' },
        ],
        quality: 35
      }
    ];

    // Randomly select scenario (weighted towards good data)
    const rand = Math.random();
    const scenario = rand < 0.6 ? scenarios[0] : rand < 0.8 ? scenarios[1] : scenarios[2];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    log('INFO', 'Data received', {
      recordCount: scenario.data.length,
      estimatedQuality: scenario.quality
    });

    return scenario.data;
  }

  /**
   * Verify data quality using verifier oracle
   */
  async verifyQuality(query: string, data: any): Promise<{
    score: number;
    breakdown: any;
  }> {
    log('INFO', 'Requesting quality verification from oracle...');

    try {
      // In real implementation, would call verifier oracle API
      // For demo, simulate quality scoring
      const hasAllFields = data.every((record: any) =>
        record.protocol && record.chain && record.amount_usd && record.tx_hash
      );

      const queryTerms = query.toLowerCase().split(' ');
      const relevanceScore = data.reduce((sum: number, record: any) => {
        const recordStr = JSON.stringify(record).toLowerCase();
        const matches = queryTerms.filter(term => recordStr.includes(term)).length;
        return sum + (matches / queryTerms.length);
      }, 0) / data.length;

      const completenessScore = hasAllFields ? 1.0 : 0.4;
      const semanticScore = relevanceScore;
      const freshnessScore = 1.0; // Assume fresh for demo

      const overallScore = Math.round(
        (semanticScore * 0.4 + completenessScore * 0.4 + freshnessScore * 0.2) * 100
      );

      log('INFO', 'Quality verification complete', {
        score: overallScore,
        semantic: Math.round(semanticScore * 100),
        completeness: Math.round(completenessScore * 100),
        freshness: Math.round(freshnessScore * 100)
      });

      return {
        score: overallScore,
        breakdown: {
          semantic: semanticScore,
          completeness: completenessScore,
          freshness: freshnessScore
        }
      };
    } catch (error) {
      log('ERROR', 'Quality verification failed', error);
      throw error;
    }
  }

  /**
   * File dispute automatically
   */
  async fileDispute(payment: Payment, qualityScore: number, data: any, reason: string): Promise<void> {
    log('WARN', `Filing dispute for payment ${payment.id}`, {
      reason,
      qualityScore,
      paymentAmount: payment.amount
    });

    // Calculate refund
    let refundPercentage = 0;
    if (qualityScore < 50) {
      refundPercentage = 100;
    } else if (qualityScore < 80) {
      refundPercentage = Math.round((80 - qualityScore) / 80 * 100);
    }

    const refundAmount = payment.amount * (refundPercentage / 100);

    log('INFO', 'Dispute filed successfully', {
      disputeId: `dispute_${payment.id}`,
      qualityScore,
      refundPercentage,
      refundAmount
    });

    // Update state
    payment.status = 'disputed';
    agentState.totalDisputes++;

    if (refundAmount > 0) {
      agentState.totalRefunds += refundAmount;
      payment.status = 'refunded';
    }
  }

  /**
   * Accept payment (release escrow to seller)
   */
  async acceptPayment(payment: Payment, reason: string): Promise<void> {
    log('INFO', `Accepting payment ${payment.id}`, { reason });
    payment.status = 'completed';
  }

  /**
   * Main agent loop - one complete cycle
   */
  async runCycle(): Promise<void> {
    log('INFO', '='.repeat(70));
    log('INFO', 'Starting new agent cycle');
    log('INFO', '='.repeat(70));

    try {
      // Step 1: Decide if payment is needed
      if (!this.brain.shouldMakePayment()) {
        log('INFO', 'No action needed this cycle');
        return;
      }

      // Step 2: Determine what to query for
      const query = this.brain.determineQuery();

      // Step 3: Make payment
      const payment = await this.makePayment(query);

      // Step 4: Fetch data from API
      const data = await this.fetchData(query);

      // Step 5: Verify quality
      const { score: qualityScore, breakdown } = await this.verifyQuality(query, data);

      // Step 6: Agent decides what to do
      const decision = this.brain.evaluateAndDecide(qualityScore, data);

      log('INFO', `Agent decision: ${decision.action.toUpperCase()}`, {
        reason: decision.reason
      });

      // Step 7: Execute decision
      if (decision.action === 'accept') {
        await this.acceptPayment(payment, decision.reason);
      } else if (decision.action === 'dispute') {
        await this.fileDispute(payment, qualityScore, data, decision.reason);
      } else if (decision.action === 'review') {
        // Additional analysis needed
        const analysis = await this.brain.analyzeData(data, query);

        if (analysis.shouldDispute) {
          await this.fileDispute(payment, qualityScore, data, analysis.reason);
        } else {
          await this.acceptPayment(payment, analysis.reason);
        }
      }

      // Update last check time
      agentState.lastCheckTime = Date.now();

      // Print current stats
      this.printStats();

    } catch (error) {
      log('ERROR', 'Cycle failed', error);
    }
  }

  /**
   * Print agent statistics
   */
  printStats(): void {
    log('INFO', 'Agent Statistics', {
      totalPayments: agentState.totalPayments,
      totalDisputes: agentState.totalDisputes,
      totalRefunds: `${agentState.totalRefunds.toFixed(4)} SOL`,
      disputeRate: `${((agentState.totalDisputes / agentState.totalPayments) * 100).toFixed(1)}%`,
      paymentsToday: agentState.paymentsToday
    });
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('AUTONOMOUS AGENT DEMO');
  console.log('x402Resolve - Solana x402 Hackathon 2025');
  console.log('='.repeat(70) + '\n');

  log('INFO', `Agent "${config.name}" initializing...`);
  log('INFO', 'Configuration', {
    mode: config.operationMode,
    minQualityScore: config.minQualityScore,
    autoDisputeThreshold: config.autoDisputeThreshold,
    autoAcceptThreshold: config.autoAcceptThreshold,
    defaultPayment: `${config.defaultPaymentAmount} SOL`
  });

  // Initialize Solana connection
  const connection = new Connection(config.solanaRpcUrl, 'confirmed');
  log('INFO', `Connected to Solana: ${config.solanaRpcUrl}`);

  // Generate or load wallet
  const wallet = Keypair.generate(); // In production, load from env
  log('INFO', `Agent wallet: ${wallet.publicKey.toBase58()}`);

  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  log('INFO', `Wallet balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  if (balance === 0) {
    log('WARN', 'Wallet has no SOL. On devnet, get SOL from: solana airdrop 2');
  }

  // Create agent
  const agent = new Kotowari(connection, wallet);

  // Run multiple cycles for demonstration
  const numCycles = 5;
  log('INFO', `Running ${numCycles} autonomous cycles...\n`);

  for (let i = 0; i < numCycles; i++) {
    log('INFO', `\n*** CYCLE ${i + 1}/${numCycles} ***\n`);
    await agent.runCycle();

    // Wait between cycles
    if (i < numCycles - 1) {
      const waitTime = 2000; // 2 seconds for demo
      log('INFO', `Waiting ${waitTime/1000}s before next cycle...\n`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  log('INFO', '\n' + '='.repeat(70));
  log('INFO', 'DEMO COMPLETE');
  log('INFO', '='.repeat(70));

  log('INFO', 'Final Statistics', {
    totalPayments: agentState.totalPayments,
    totalDisputes: agentState.totalDisputes,
    totalRefunds: `${agentState.totalRefunds.toFixed(4)} SOL`,
    disputeRate: `${((agentState.totalDisputes / agentState.totalPayments) * 100).toFixed(1)}%`,
    successRate: `${(((agentState.totalPayments - agentState.totalDisputes) / agentState.totalPayments) * 100).toFixed(1)}%`
  });

  log('INFO', '\nKey Demonstrations:');
  log('INFO', '✓ Autonomous decision making (no human intervention)');
  log('INFO', '✓ Automatic quality verification');
  log('INFO', '✓ Automatic dispute filing for poor quality');
  log('INFO', '✓ Intelligent data analysis and thresholds');
  log('INFO', '✓ Complete payment lifecycle management');
}

// Run the agent
main().catch(error => {
  log('ERROR', 'Fatal error', error);
  process.exit(1);
});
