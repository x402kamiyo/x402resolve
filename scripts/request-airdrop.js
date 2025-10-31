#!/usr/bin/env node
/**
 * Request Devnet SOL Airdrop
 *
 * Automatically requests SOL from Solana devnet
 */

const fs = require('fs');
const path = require('path');
const { Keypair, Connection, LAMPORTS_PER_SOL } = require('@solana/web3.js');

async function main() {
  // Load wallet
  const walletPath = path.join(__dirname, '..', '.solana', 'x402-devnet-wallet.json');
  if (!fs.existsSync(walletPath)) {
    console.error('Wallet not found. Run create-wallet.js first.');
    process.exit(1);
  }

  const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  const publicKey = keypair.publicKey.toBase58();

  console.log('='.repeat(70));
  console.log(' Requesting Devnet SOL Airdrop');
  console.log('='.repeat(70));
  console.log('');
  console.log('Public Key:', publicKey);
  console.log('');

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  try {
    console.log('Requesting airdrop...');

    // Request 2 SOL (maximum per request)
    const signature = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL
    );

    console.log('Airdrop requested. Transaction:', signature);
    console.log('Waiting for confirmation...');

    // Wait for confirmation
    await connection.confirmTransaction(signature);

    console.log('✓ Airdrop confirmed!');
    console.log('');

    // Check new balance
    const balance = await connection.getBalance(keypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    console.log('New Balance:', solBalance, 'SOL');
    console.log('');

    const requiredSOL = 2.6;
    if (solBalance >= requiredSOL) {
      console.log('✓ Sufficient funds for deployment!');
    } else {
      const shortfall = requiredSOL - solBalance;
      console.log('Need', shortfall.toFixed(2), 'more SOL');
      console.log('Run this script again or use a web faucet');
    }
  } catch (error) {
    console.log('✗ Airdrop failed:', error.message);
    console.log('');
    console.log('This can happen if:');
    console.log('  - Rate limit reached (wait a few minutes)');
    console.log('  - Network issues');
    console.log('  - Devnet faucet is down');
    console.log('');
    console.log('Try using a web faucet instead:');
    console.log('  https://faucet.solana.com');
    console.log('  https://faucet.quicknode.com/solana/devnet');
  }

  console.log('');
  console.log('='.repeat(70));
}

main().catch(console.error);
