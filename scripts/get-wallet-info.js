#!/usr/bin/env node
/**
 * Get Wallet Info and Request Funds
 *
 * Uses @solana/web3.js to get wallet address and balance
 */

const fs = require('fs');
const path = require('path');

// Import from root node_modules
const { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } = require('@solana/web3.js');

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
  console.log(' Wallet Information');
  console.log('='.repeat(70));
  console.log('');
  console.log('Public Key:', publicKey);
  console.log('');

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  try {
    const balance = await connection.getBalance(keypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    console.log('Current Balance:', solBalance, 'SOL');
    console.log('');

    const requiredSOL = 2.6;
    const recommendedSOL = 5.0;

    if (solBalance >= requiredSOL) {
      console.log('✓ Sufficient funds for deployment!');
      console.log('  Required:', requiredSOL, 'SOL');
      console.log('  Available:', solBalance, 'SOL');
    } else {
      const shortfall = requiredSOL - solBalance;
      console.log('✗ Insufficient funds for deployment');
      console.log('  Required:', requiredSOL, 'SOL');
      console.log('  Available:', solBalance, 'SOL');
      console.log('  Shortfall:', shortfall.toFixed(2), 'SOL');
      console.log('');
      console.log('To fund your wallet:');
      console.log('');
      console.log('Option 1: Solana CLI (if installed)');
      console.log('  $ solana config set --url devnet');
      console.log('  $ solana airdrop 2', publicKey);
      console.log('');
      console.log('Option 2: Web faucet');
      console.log('  Visit: https://faucet.solana.com');
      console.log('  Enter public key:', publicKey);
      console.log('');
      console.log('Option 3: QuickNode faucet');
      console.log('  Visit: https://faucet.quicknode.com/solana/devnet');
      console.log('  Enter public key:', publicKey);
      console.log('');
      console.log('Recommended: Request', recommendedSOL, 'SOL for buffer');
    }
  } catch (error) {
    console.log('Could not check balance:', error.message);
    console.log('');
    console.log('To fund your wallet, use public key:', publicKey);
  }

  console.log('');
  console.log('='.repeat(70));
}

main().catch(console.error);
