#!/usr/bin/env node
/**
 * Fund Solana Devnet Wallet
 *
 * Requests SOL from devnet faucet for testing
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load wallet
const walletPath = path.join(__dirname, '..', '.solana', 'x402-devnet-wallet.json');
if (!fs.existsSync(walletPath)) {
  console.error('Wallet not found. Run create-wallet.js first.');
  process.exit(1);
}

const keypair = JSON.parse(fs.readFileSync(walletPath, 'utf8'));

// For this demo, we'll extract what would be the public key
// In a real implementation, we'd need @solana/web3.js to derive the actual public key
// For now, just show instructions

console.log('='.repeat(70));
console.log(' Wallet Funding Instructions');
console.log('='.repeat(70));
console.log('');
console.log('Your wallet keypair is saved at:', walletPath);
console.log('');
console.log('To fund your wallet with devnet SOL:');
console.log('');
console.log('Option 1: Install Solana CLI and use airdrop');
console.log('  $ sh -c "$(curl -sSfL https://release.solana.com/stable/install)"');
console.log('  $ solana config set --url devnet');
console.log('  $ solana-keygen pubkey', walletPath);
console.log('  $ solana airdrop 2 <YOUR_PUBKEY> --url devnet');
console.log('');
console.log('Option 2: Use web faucet');
console.log('  1. Get your public key with: solana-keygen pubkey', walletPath);
console.log('  2. Visit: https://faucet.solana.com');
console.log('  3. Paste your public key and request 2 SOL');
console.log('');
console.log('Option 3: Use QuickNode faucet');
console.log('  1. Visit: https://faucet.quicknode.com/solana/devnet');
console.log('  2. Enter your public key');
console.log('  3. Request devnet SOL');
console.log('');
console.log('Required: ~2.6 SOL for program deployment');
console.log('Recommended: Request 5 SOL to have buffer');
console.log('');
console.log('='.repeat(70));
console.log('');
console.log('NOTE: Without Solana CLI or @solana/web3.js, we cannot');
console.log('automatically derive the public key or request funds.');
console.log('Please install one of these tools to continue.');
console.log('');
console.log('='.repeat(70));
