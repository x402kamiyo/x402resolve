#!/usr/bin/env ts-node
/**
 * Basic Payment Example
 *
 * Demonstrates simple payment for API access without escrow.
 * Use this when you trust the API provider or don't need dispute resolution.
 */

import { KamiyoClient, X402Error } from '@kamiyo/x402-sdk';

async function main() {
  console.log('='.repeat(70));
  console.log('💰 x402 Basic Payment Example');
  console.log('='.repeat(70));
  console.log();

  // Initialize client WITHOUT x402Resolve
  const client = new KamiyoClient({
    apiUrl: 'https://api.kamiyo.io',
    chain: 'solana',
    enablex402Resolve: false  // No escrow, instant release
  });

  try {
    // Step 1: Pay for API access
    console.log('📤 Step 1: Paying for API access...');
    console.log('-'.repeat(70));

    const payment = await client.pay({
      amount: 0.01,  // 0.01 SOL
      recipient: 'API_WALLET_ADDRESS_HERE',
      metadata: {
        purpose: 'exploit_data_access',
        plan: 'basic'
      }
    });

    console.log('✅ Payment successful!');
    console.log(`   Transaction ID: ${payment.transactionId}`);
    console.log(`   Access Token: ${payment.token.substring(0, 32)}...`);
    console.log(`   Expires: ${new Date(payment.expiresAt).toLocaleString()}`);
    console.log();

    // Step 2: Set access token
    client.setAccessToken(payment.token);

    // Step 3: Query API
    console.log('🔍 Step 2: Querying API...');
    console.log('-'.repeat(70));

    const exploits = await client.query('/exploits/recent', {
      limit: 5
    });

    console.log(`✅ Received ${exploits.length} recent exploits:`);
    exploits.forEach((exploit: any, i: number) => {
      console.log(`   ${i + 1}. ${exploit.protocol} - $${exploit.amount_usd.toLocaleString()}`);
    });
    console.log();

    console.log('='.repeat(70));
    console.log('✅ Example complete!');
    console.log('='.repeat(70));

  } catch (error) {
    if (error instanceof X402Error) {
      console.error('❌ x402 Error:');
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      if (error.statusCode) {
        console.error(`   Status: ${error.statusCode}`);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

main();
