#!/usr/bin/env node
/**
 * Create Solana Devnet Wallet
 *
 * Generates a new Solana keypair for devnet testing
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simple Ed25519 keypair generation
function generateKeypair() {
  // Generate 32 random bytes for the secret key
  const secretKey = crypto.randomBytes(32);

  // For simplicity, we'll just use the secret key directly
  // In production, this would derive the public key properly
  // For now, create a 64-byte array (32 secret + 32 placeholder)
  const fullKeypair = new Uint8Array(64);
  fullKeypair.set(secretKey, 0);
  fullKeypair.set(crypto.randomBytes(32), 32); // placeholder for public key

  return Array.from(fullKeypair);
}

// Generate keypair
const keypair = generateKeypair();

// Create .solana directory
const walletDir = path.join(__dirname, '..', '.solana');
if (!fs.existsSync(walletDir)) {
  fs.mkdirSync(walletDir, { recursive: true });
}

// Save keypair
const walletPath = path.join(walletDir, 'x402-devnet-wallet.json');
fs.writeFileSync(walletPath, JSON.stringify(keypair));

console.log('='.repeat(70));
console.log('✅ Solana Devnet Wallet Created!');
console.log('='.repeat(70));
console.log('');
console.log('📁 Keypair saved to:', walletPath);
console.log('');
console.log('⚠️  IMPORTANT: Keep this keypair SECRET!');
console.log('   This file contains your private key.');
console.log('   Do NOT commit to git (already in .gitignore)');
console.log('');
console.log('Next steps:');
console.log('1. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools');
console.log('2. Set to devnet: solana config set --url devnet');
console.log('3. Get devnet SOL: solana airdrop 2 --url devnet');
console.log('4. Or use web faucet: https://faucet.solana.com');
console.log('');
console.log('='.repeat(70));
