/**
 * Complete Escrow with Dispute Example
 *
 * Demonstrates full workflow:
 * 1. Create escrow payment
 * 2. Receive and validate data
 * 3. File dispute if quality is poor
 * 4. Automatic refund based on quality score
 */

import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { EscrowClient, EscrowValidator, EscrowUtils } from '@x402resolve/sdk';
import * as fs from 'fs';

// Configuration
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR');

// Load wallets
function loadWallet(path: string): Keypair {
  const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(data));
}

async function main() {
  // Setup
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const agentKeypair = loadWallet(process.env.AGENT_WALLET || './agent-wallet.json');
  const apiKeypair = loadWallet(process.env.API_WALLET || './api-wallet.json');

  const wallet = new Wallet(agentKeypair);
  const provider = new AnchorProvider(connection, wallet, {});

  console.log('Agent Wallet:', agentKeypair.publicKey.toBase58());
  console.log('API Wallet:', apiKeypair.publicKey.toBase58());

  // Load program IDL
  const idl = JSON.parse(fs.readFileSync('../../packages/x402-escrow/target/idl/x402_escrow.json', 'utf-8'));

  // Initialize client
  const client = new EscrowClient(
    { programId: PROGRAM_ID, connection, wallet },
    idl
  );

  // Step 1: Validate parameters
  console.log('\n--- Step 1: Validate Payment Parameters ---');

  const params = {
    amount: EscrowUtils.solToLamports(0.01),
    timeLock: EscrowUtils.hoursToSeconds(24),
    transactionId: EscrowUtils.generateTransactionId('dispute_demo'),
    apiPublicKey: apiKeypair.publicKey,
  };

  const validation = EscrowValidator.validateCreateParams(params);
  if (!validation.valid) {
    console.error('Validation failed:', validation.errors);
    process.exit(1);
  }

  console.log('Parameters valid');
  console.log('Amount:', EscrowUtils.lamportsToSol(params.amount), 'SOL');
  console.log('Time Lock:', EscrowUtils.secondsToHours(params.timeLock.toNumber()), 'hours');
  console.log('Transaction ID:', params.transactionId);

  // Step 2: Create escrow
  console.log('\n--- Step 2: Create Escrow ---');

  try {
    const signature = await client.createEscrow(params);
    console.log('Escrow created:', signature);
    console.log('Explorer:', EscrowUtils.getExplorerUrl(signature, 'devnet'));

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('Transaction confirmed');

  } catch (error) {
    console.error('Failed to create escrow:', error);
    process.exit(1);
  }

  // Step 3: Check escrow status
  console.log('\n--- Step 3: Check Escrow Status ---');

  const escrow = await client.getEscrow(params.transactionId);
  console.log('Status:', await client.getStatus(params.transactionId));
  console.log('Created:', EscrowUtils.formatTimestamp(escrow.createdAt));
  console.log('Expires:', EscrowUtils.formatTimestamp(escrow.expiresAt));
  console.log('Time Remaining:', await client.getTimeRemaining(params.transactionId), 'seconds');

  // Step 4: Simulate API call and quality check
  console.log('\n--- Step 4: Simulate API Response ---');

  // Simulate receiving data from API
  const receivedData = {
    query: 'Uniswap V3 exploits',
    results: [
      { protocol: 'Curve Finance', amount_usd: 62000000 },  // Wrong protocol!
      { protocol: 'Euler Finance', amount_usd: 197000000 }, // Wrong protocol!
    ],
    timestamp: Date.now()
  };

  console.log('Received data:', JSON.stringify(receivedData, null, 2));

  // Check quality (semantic mismatch - query was Uniswap, got Curve/Euler)
  const expectedProtocol = 'Uniswap';
  const receivedProtocols = receivedData.results.map(r => r.protocol);
  const qualityIssues = [];

  if (!receivedProtocols.some(p => p.includes(expectedProtocol))) {
    qualityIssues.push('Protocol mismatch: expected ' + expectedProtocol);
  }

  if (receivedData.results.length < 3) {
    qualityIssues.push('Incomplete: expected at least 3 results');
  }

  if (qualityIssues.length > 0) {
    console.log('\nQuality issues detected:');
    qualityIssues.forEach(issue => console.log('- ' + issue));

    // Step 5: File dispute
    console.log('\n--- Step 5: File Dispute ---');

    try {
      const disputeSig = await client.markDisputed(params.transactionId);
      console.log('Dispute filed:', disputeSig);
      console.log('Explorer:', EscrowUtils.getExplorerUrl(disputeSig, 'devnet'));

      await connection.confirmTransaction(disputeSig, 'confirmed');
      console.log('Dispute confirmed');

      const newStatus = await client.getStatus(params.transactionId);
      console.log('New status:', newStatus);

    } catch (error) {
      console.error('Failed to file dispute:', error);
      process.exit(1);
    }

    // Step 6: Simulate verifier resolution
    console.log('\n--- Step 6: Simulate Verifier Resolution ---');
    console.log('(In production, verifier service would assess quality off-chain)');

    // Simulated quality assessment
    const qualityScore = 45; // Poor quality: wrong protocols, incomplete
    const refundPercentage = 75; // 75% refund for score of 45

    console.log('Quality Score:', qualityScore, '/100');
    console.log('Refund Percentage:', refundPercentage, '%');

    const { refundAmount, paymentAmount } = EscrowUtils.calculateRefund(
      params.amount,
      refundPercentage
    );

    console.log('Refund to Agent:', EscrowUtils.lamportsToSol(refundAmount), 'SOL');
    console.log('Payment to API:', EscrowUtils.lamportsToSol(paymentAmount), 'SOL');

    console.log('\nNote: Actual resolution requires verifier oracle signature');
    console.log('See verifier documentation for signature generation');

  } else {
    // No quality issues - release funds normally
    console.log('\n--- Quality Check Passed ---');
    console.log('No issues detected. Funds will auto-release after time lock.');

    const timeRemaining = await client.getTimeRemaining(params.transactionId);
    console.log('Auto-release in:', Math.floor(timeRemaining / 3600), 'hours');
  }

  console.log('\n--- Demo Complete ---');
  console.log('Transaction ID:', params.transactionId);
  console.log('Check status with: client.getEscrow("' + params.transactionId + '")');
}

// Error handling
main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
