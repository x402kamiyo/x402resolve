# x402Resolve SDK Usage Guide

Comprehensive guide for integrating the x402Resolve escrow system into your application.

## Installation

```bash
npm install @x402resolve/sdk @solana/web3.js @coral-xyz/anchor
```

## Quick Start

```typescript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { EscrowClient, EscrowUtils } from '@x402resolve/sdk';
import idl from './idl/x402_escrow.json';

// Setup
const connection = new Connection('https://api.devnet.solana.com');
const wallet = new Wallet(Keypair.generate());
const programId = new PublicKey('BtSoJmuFZCq8DmWbesuAbu7E6KJijeSeLLBUWTKC6x4P');

// Initialize client
const client = new EscrowClient({ programId, connection, wallet }, idl);

// Create escrow
const signature = await client.createEscrow({
  amount: EscrowUtils.solToLamports(0.1), // 0.1 SOL
  timeLock: EscrowUtils.hoursToSeconds(24), // 24 hours
  transactionId: EscrowUtils.generateTransactionId(),
  apiPublicKey: new PublicKey('...'),
});

console.log(`Escrow created: ${signature}`);
```

## Core Features

### 1. Creating an Escrow

```typescript
import { EscrowClient, EscrowValidator, EscrowUtils } from '@x402resolve/sdk';

// Validate parameters before creating
const params = {
  amount: EscrowUtils.solToLamports(0.5),
  timeLock: EscrowUtils.hoursToSeconds(48),
  transactionId: 'my_unique_tx_id_123',
  apiPublicKey: apiAddress,
};

const validation = EscrowValidator.validateCreateParams(params);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Create escrow
try {
  const signature = await client.createEscrow(params);
  console.log('✅ Escrow created:', signature);
  console.log('View on Explorer:', EscrowUtils.getExplorerUrl(signature, 'devnet'));
} catch (error) {
  console.error('Failed to create escrow:', error);
}
```

### 2. Releasing Funds (Happy Path)

```typescript
// Agent is satisfied with API response
const transactionId = 'my_unique_tx_id_123';

// Check escrow status first
const status = await client.getStatus(transactionId);
console.log('Current status:', status);

if (status === 'Active') {
  const signature = await client.releaseFunds(transactionId);
  console.log('✅ Funds released:', signature);
}
```

### 3. Dispute Resolution

```typescript
// Step 1: Agent marks as disputed
const disputeSig = await client.markDisputed(transactionId);
console.log('✅ Dispute marked:', disputeSig);

// Step 2: Verifier resolves (off-chain quality assessment)
const qualityScore = 45; // 0-100
const refundPercentage = 75; // 75% refund for poor quality
const signature = generateVerifierSignature(transactionId, qualityScore);

const resolveSig = await client.resolveDispute(
  transactionId,
  qualityScore,
  refundPercentage,
  signature,
  verifierPublicKey
);

console.log('✅ Dispute resolved:', resolveSig);

// Check resolution details
const escrow = await client.getEscrow(transactionId);
console.log('Quality Score:', escrow.qualityScore);
console.log('Refund:', escrow.refundPercentage + '%');
```

### 4. Checking Escrow Status

```typescript
// Get full escrow data
const escrow = await client.getEscrow(transactionId);
console.log('Agent:', escrow.agent.toBase58());
console.log('API:', escrow.api.toBase58());
console.log('Amount:', EscrowUtils.lamportsToSol(escrow.amount), 'SOL');
console.log('Created:', EscrowUtils.formatTimestamp(escrow.createdAt));
console.log('Expires:', EscrowUtils.formatTimestamp(escrow.expiresAt));

// Check if expired
const isExpired = await client.isExpired(transactionId);
console.log('Expired:', isExpired);

// Get time remaining
const timeRemaining = await client.getTimeRemaining(transactionId);
console.log('Time remaining:', timeRemaining, 'seconds');
console.log('Hours remaining:', EscrowUtils.secondsToHours(timeRemaining));
```

### 5. Event Monitoring

```typescript
// Subscribe to all events
const listenerIds = client.subscribeToEvents({
  onInitialized: (event) => {
    console.log('Escrow initialized:', {
      escrow: event.escrow.toBase58(),
      amount: EscrowUtils.lamportsToSol(event.amount),
      transactionId: event.transactionId,
    });
  },

  onDisputed: (event) => {
    console.log('Dispute marked:', {
      escrow: event.escrow.toBase58(),
      agent: event.agent.toBase58(),
      timestamp: EscrowUtils.formatTimestamp(event.timestamp),
    });
  },

  onResolved: (event) => {
    console.log('Dispute resolved:', {
      escrow: event.escrow.toBase58(),
      qualityScore: event.qualityScore,
      refundPercentage: event.refundPercentage + '%',
      refundAmount: EscrowUtils.lamportsToSol(event.refundAmount),
      paymentAmount: EscrowUtils.lamportsToSol(event.paymentAmount),
    });
  },

  onReleased: (event) => {
    console.log('Funds released:', {
      escrow: event.escrow.toBase58(),
      amount: EscrowUtils.lamportsToSol(event.amount),
      api: event.api.toBase58(),
    });
  },
});

// Cleanup when done
client.unsubscribeFromEvents(listenerIds);
```

## Error Handling with Retry Logic

### Basic Retry

```typescript
import { RetryableOperations } from '@x402resolve/sdk';

const retryOps = new RetryableOperations({
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
});

// Automatically retry on transient errors
const signature = await retryOps.sendTransaction(
  () => client.createEscrow(params),
  'Create Escrow'
);
```

### Advanced Retry Configuration

```typescript
import { RetryHandler, RetryableOperations } from '@x402resolve/sdk';

const customConfig = {
  maxRetries: 5,
  initialDelay: 500,
  maxDelay: 60000,
  backoffMultiplier: 3,
  retryableErrors: [
    'Transaction was not confirmed',
    'Blockhash not found',
    'timeout',
    '429',
    '503',
  ],
};

const retryOps = new RetryableOperations(customConfig);

// Use for all operations
const escrow = await retryOps.fetchAccount(
  () => client.getEscrow(transactionId),
  'Fetch Escrow'
);
```

### Circuit Breaker for Preventing Cascading Failures

```typescript
import { BatchHandler } from '@x402resolve/sdk';

const batchHandler = new BatchHandler(
  { maxRetries: 3 }, // retry config
  { failureThreshold: 5, timeout: 60000 } // circuit breaker config
);

// Execute multiple operations
const operations = [
  () => client.createEscrow(params1),
  () => client.createEscrow(params2),
  () => client.createEscrow(params3),
];

const results = await batchHandler.executeBatch(operations, {
  parallel: true,
  context: 'Batch Escrow Creation',
});

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Operation ${index + 1} succeeded:`, result.result);
  } else {
    console.error(`Operation ${index + 1} failed:`, result.error?.message);
  }
});
```

## Validation

### Client-Side Validation

```typescript
import { EscrowValidator } from '@x402resolve/sdk';

// Validate individual parameters
const amountCheck = EscrowValidator.validateAmount(1_000_000_000); // 1 SOL
if (!amountCheck.valid) {
  console.error('Amount error:', amountCheck.error);
}

const timeLockCheck = EscrowValidator.validateTimeLock(86400); // 24 hours
if (!timeLockCheck.valid) {
  console.error('Time lock error:', timeLockCheck.error);
}

const txIdCheck = EscrowValidator.validateTransactionId('my_tx_id');
if (!txIdCheck.valid) {
  console.error('Transaction ID error:', txIdCheck.error);
}

// Validate all parameters at once
const params = {
  amount: EscrowUtils.solToLamports(0.1),
  timeLock: EscrowUtils.hoursToSeconds(24),
  transactionId: 'my_tx_id',
  apiPublicKey: apiAddress,
};

const validation = EscrowValidator.validateCreateParams(params);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}
```

### Validation Constraints

```typescript
// Amount constraints
EscrowValidator.MIN_AMOUNT; // 1,000,000 lamports (0.001 SOL)
EscrowValidator.MAX_AMOUNT; // 1,000,000,000,000 lamports (1000 SOL)

// Time lock constraints
EscrowValidator.MIN_TIME_LOCK; // 3600 seconds (1 hour)
EscrowValidator.MAX_TIME_LOCK; // 2,592,000 seconds (30 days)

// Transaction ID constraints
EscrowValidator.MAX_TRANSACTION_ID_LENGTH; // 64 characters
```

## Utility Functions

### Converting Units

```typescript
import { EscrowUtils } from '@x402resolve/sdk';

// SOL <-> Lamports
const lamports = EscrowUtils.solToLamports(1.5); // 1,500,000,000
const sol = EscrowUtils.lamportsToSol(new BN(1_000_000_000)); // 1.0

// Hours <-> Seconds
const seconds = EscrowUtils.hoursToSeconds(48); // BN(172800)
const hours = EscrowUtils.secondsToHours(86400); // 24
```

### Generating Transaction IDs

```typescript
// Generate unique ID
const txId = EscrowUtils.generateTransactionId(); // "tx_1698765432123_abc123"

// With custom prefix
const customId = EscrowUtils.generateTransactionId('payment'); // "payment_1698765432123_def456"
```

### Calculating Refunds

```typescript
const amount = EscrowUtils.solToLamports(1.0); // 1 SOL
const refundPercentage = 60; // 60% refund

const { refundAmount, paymentAmount } = EscrowUtils.calculateRefund(amount, refundPercentage);

console.log('Refund:', EscrowUtils.lamportsToSol(refundAmount), 'SOL'); // 0.6 SOL
console.log('Payment:', EscrowUtils.lamportsToSol(paymentAmount), 'SOL'); // 0.4 SOL
```

## Common Patterns

### 1. Complete Escrow Lifecycle

```typescript
async function completeEscrowWorkflow() {
  const txId = EscrowUtils.generateTransactionId('api_call');

  // 1. Create escrow
  const createSig = await client.createEscrow({
    amount: EscrowUtils.solToLamports(0.1),
    timeLock: EscrowUtils.hoursToSeconds(24),
    transactionId: txId,
    apiPublicKey: apiAddress,
  });
  console.log('✅ Created:', createSig);

  // 2. Make API call (off-chain)
  const apiResponse = await makeApiCall();

  // 3. Evaluate quality
  if (apiResponse.quality === 'good') {
    // Release funds
    const releaseSig = await client.releaseFunds(txId);
    console.log('✅ Released:', releaseSig);
  } else {
    // Dispute
    const disputeSig = await client.markDisputed(txId);
    console.log('✅ Disputed:', disputeSig);

    // Wait for verifier resolution
    // (In practice, verifier would be a separate service)
  }
}
```

### 2. Monitoring Agent Escrows

```typescript
async function monitorAgentEscrows(agentPubkey: PublicKey) {
  const escrows = await client.getAgentEscrows(agentPubkey);

  for (const escrow of escrows) {
    const status = getEscrowStatus(escrow.status);
    const isExpired = await client.isExpired(escrow.transactionId);

    console.log({
      txId: escrow.transactionId,
      amount: EscrowUtils.lamportsToSol(escrow.amount),
      status,
      isExpired,
    });

    // Handle expired escrows
    if (isExpired && status === 'Active') {
      console.log('⚠️ Escrow expired, can be released by anyone');
    }
  }
}
```

### 3. Batch Escrow Creation with Retry

```typescript
async function createMultipleEscrows(params: CreateEscrowParams[]) {
  const batchHandler = new BatchHandler();

  const operations = params.map((param) => () => client.createEscrow(param));

  const results = await batchHandler.executeBatch(operations, {
    parallel: true,
    stopOnError: false,
    context: 'Batch Create',
  });

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  return { successful, failed };
}
```

## Error Handling

### Common Errors

```typescript
try {
  await client.createEscrow(params);
} catch (error) {
  if (error.message.includes('InvalidAmount')) {
    console.error('Amount must be between 0.001 and 1000 SOL');
  } else if (error.message.includes('InvalidTimeLock')) {
    console.error('Time lock must be between 1 hour and 30 days');
  } else if (error.message.includes('DisputeWindowExpired')) {
    console.error('Cannot dispute after time lock expires');
  } else if (error.message.includes('TimeLockNotExpired')) {
    console.error('Time lock has not expired yet');
  } else {
    console.error('Transaction failed:', error.message);
  }
}
```

## Best Practices

1. **Always validate inputs** before sending transactions
2. **Use retry logic** for transient network errors
3. **Subscribe to events** for real-time updates
4. **Check escrow status** before operations
5. **Handle time locks** appropriately
6. **Generate unique transaction IDs** for each escrow
7. **Monitor circuit breaker state** in production
8. **Log all operations** for debugging

## TypeScript Types

```typescript
import {
  EscrowClient,
  EscrowConfig,
  CreateEscrowParams,
  EscrowAccount,
  RetryConfig,
} from '@x402resolve/sdk';

// All types are fully typed for TypeScript
```

## Support

- Documentation: `/packages/x402-sdk/README.md`
- Examples: `/packages/x402-sdk/examples/`
- Issues: GitHub Issues
- Program ID: `BtSoJmuFZCq8DmWbesuAbu7E6KJijeSeLLBUWTKC6x4P` (devnet)

## Next Steps

- Review validation rules in `VALIDATION_IMPROVEMENTS.md`
- Run demo script in `packages/x402-escrow/demo/`
- Check deployment guide in `DEPLOYMENT.md`
- Read security considerations in `SECURITY.md`
