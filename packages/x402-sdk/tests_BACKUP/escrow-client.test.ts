import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PublicKey } from '@solana/web3.js';
import { EscrowClient, EscrowStatus } from '../src/escrow-client';

// Mock @solana/web3.js
jest.mock('@solana/web3.js');

describe('EscrowClient', () => {
  let client: EscrowClient;
  let mockConnection: any;
  let mockWallet: any;

  beforeEach(() => {
    mockConnection = {
      getAccountInfo: jest.fn(),
      getBalance: jest.fn(),
      sendTransaction: jest.fn(),
      confirmTransaction: jest.fn()
    };

    mockWallet = {
      publicKey: new PublicKey('11111111111111111111111111111111'),
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn()
    };

    client = new EscrowClient(mockConnection, mockWallet);
    jest.clearAllMocks();
  });

  describe('createEscrow()', () => {
    it('should create escrow with valid parameters', async () => {
      const params = {
        amount: 0.01,
        recipient: new PublicKey('22222222222222222222222222222222'),
        timeLockDuration: 86400,
        transactionId: 'tx_123'
      };

      mockConnection.sendTransaction.mockResolvedValueOnce('signature_123');
      mockConnection.confirmTransaction.mockResolvedValueOnce({ value: { err: null } });

      const result = await client.createEscrow(params);

      expect(result.signature).toBe('signature_123');
      expect(result.escrowPda).toBeDefined();
    });

    it('should validate amount is within limits', async () => {
      await expect(client.createEscrow({
        amount: 0,
        recipient: new PublicKey('22222222222222222222222222222222'),
        timeLockDuration: 86400,
        transactionId: 'tx_123'
      })).rejects.toThrow('Amount must be positive');
    });

    it('should validate time lock duration', async () => {
      await expect(client.createEscrow({
        amount: 0.01,
        recipient: new PublicKey('22222222222222222222222222222222'),
        timeLockDuration: 0,
        transactionId: 'tx_123'
      })).rejects.toThrow('Time lock duration invalid');
    });

    it('should validate transaction ID format', async () => {
      await expect(client.createEscrow({
        amount: 0.01,
        recipient: new PublicKey('22222222222222222222222222222222'),
        timeLockDuration: 86400,
        transactionId: ''
      })).rejects.toThrow('Transaction ID required');
    });

    it('should handle transaction failure', async () => {
      mockConnection.sendTransaction.mockRejectedValueOnce(new Error('Insufficient funds'));

      await expect(client.createEscrow({
        amount: 0.01,
        recipient: new PublicKey('22222222222222222222222222222222'),
        timeLockDuration: 86400,
        transactionId: 'tx_123'
      })).rejects.toThrow();
    });
  });

  describe('getEscrowDetails()', () => {
    it('should fetch escrow details successfully', async () => {
      const mockAccountInfo = {
        data: Buffer.from([/* mock escrow data */]),
        owner: new PublicKey('program_id'),
        lamports: 10000000
      };

      mockConnection.getAccountInfo.mockResolvedValueOnce(mockAccountInfo);

      const escrowPda = new PublicKey('33333333333333333333333333333333');
      const details = await client.getEscrowDetails(escrowPda);

      expect(details).toBeDefined();
      expect(mockConnection.getAccountInfo).toHaveBeenCalledWith(escrowPda);
    });

    it('should handle non-existent escrow', async () => {
      mockConnection.getAccountInfo.mockResolvedValueOnce(null);

      const escrowPda = new PublicKey('33333333333333333333333333333333');

      await expect(client.getEscrowDetails(escrowPda)).rejects.toThrow('Escrow not found');
    });

    it('should parse escrow status correctly', async () => {
      const mockAccountInfo = {
        data: Buffer.from([/* mock data with status */]),
        owner: new PublicKey('program_id'),
        lamports: 10000000
      };

      mockConnection.getAccountInfo.mockResolvedValueOnce(mockAccountInfo);

      const escrowPda = new PublicKey('33333333333333333333333333333333');
      const details = await client.getEscrowDetails(escrowPda);

      expect(details.status).toBeDefined();
      expect([
        EscrowStatus.Active,
        EscrowStatus.Disputed,
        EscrowStatus.Released,
        EscrowStatus.Refunded
      ]).toContain(details.status);
    });
  });

  describe('releaseFunds()', () => {
    it('should release funds after time lock', async () => {
      const escrowPda = new PublicKey('33333333333333333333333333333333');

      mockConnection.sendTransaction.mockResolvedValueOnce('signature_release');
      mockConnection.confirmTransaction.mockResolvedValueOnce({ value: { err: null } });

      const result = await client.releaseFunds(escrowPda);

      expect(result.signature).toBe('signature_release');
      expect(mockConnection.sendTransaction).toHaveBeenCalled();
    });

    it('should handle release before time lock expiry', async () => {
      mockConnection.sendTransaction.mockRejectedValueOnce(
        new Error('Time lock not expired')
      );

      const escrowPda = new PublicKey('33333333333333333333333333333333');

      await expect(client.releaseFunds(escrowPda)).rejects.toThrow('Time lock');
    });
  });

  describe('markDisputed()', () => {
    it('should mark escrow as disputed', async () => {
      const escrowPda = new PublicKey('33333333333333333333333333333333');

      mockConnection.sendTransaction.mockResolvedValueOnce('signature_dispute');
      mockConnection.confirmTransaction.mockResolvedValueOnce({ value: { err: null } });

      const result = await client.markDisputed(escrowPda, 'Incomplete data');

      expect(result.signature).toBe('signature_dispute');
    });

    it('should require dispute reason', async () => {
      const escrowPda = new PublicKey('33333333333333333333333333333333');

      await expect(client.markDisputed(escrowPda, '')).rejects.toThrow('Reason required');
    });

    it('should prevent duplicate disputes', async () => {
      mockConnection.sendTransaction.mockRejectedValueOnce(
        new Error('Already disputed')
      );

      const escrowPda = new PublicKey('33333333333333333333333333333333');

      await expect(client.markDisputed(escrowPda, 'Test')).rejects.toThrow('Already disputed');
    });
  });

  describe('resolveDispute()', () => {
    it('should resolve dispute with quality score', async () => {
      const params = {
        escrowPda: new PublicKey('33333333333333333333333333333333'),
        qualityScore: 65,
        signature: new Uint8Array(64)
      };

      mockConnection.sendTransaction.mockResolvedValueOnce('signature_resolve');
      mockConnection.confirmTransaction.mockResolvedValueOnce({ value: { err: null } });

      const result = await client.resolveDispute(params);

      expect(result.signature).toBe('signature_resolve');
      expect(result.refundPercentage).toBe(35); // 100 - 65
    });

    it('should validate quality score range', async () => {
      await expect(client.resolveDispute({
        escrowPda: new PublicKey('33333333333333333333333333333333'),
        qualityScore: 101,
        signature: new Uint8Array(64)
      })).rejects.toThrow('Quality score must be 0-100');

      await expect(client.resolveDispute({
        escrowPda: new PublicKey('33333333333333333333333333333333'),
        qualityScore: -1,
        signature: new Uint8Array(64)
      })).rejects.toThrow('Quality score must be 0-100');
    });

    it('should require valid signature', async () => {
      await expect(client.resolveDispute({
        escrowPda: new PublicKey('33333333333333333333333333333333'),
        qualityScore: 65,
        signature: new Uint8Array(32) // Wrong length
      })).rejects.toThrow('Invalid signature length');
    });

    it('should calculate refund correctly', async () => {
      const testCases = [
        { score: 85, expectedRefund: 0 },   // >= 80: no refund
        { score: 75, expectedRefund: 25 },  // 50-79: partial
        { score: 65, expectedRefund: 35 },
        { score: 50, expectedRefund: 50 },
        { score: 40, expectedRefund: 100 }  // < 50: full refund
      ];

      for (const { score, expectedRefund } of testCases) {
        mockConnection.sendTransaction.mockResolvedValueOnce('sig');
        mockConnection.confirmTransaction.mockResolvedValueOnce({ value: { err: null } });

        const result = await client.resolveDispute({
          escrowPda: new PublicKey('33333333333333333333333333333333'),
          qualityScore: score,
          signature: new Uint8Array(64)
        });

        expect(result.refundPercentage).toBe(expectedRefund);
      }
    });
  });

  describe('PDA Derivation', () => {
    it('should derive deterministic escrow PDA', () => {
      const transactionId = 'tx_123';
      const pda1 = client.deriveEscrowPda(transactionId);
      const pda2 = client.deriveEscrowPda(transactionId);

      expect(pda1.toString()).toBe(pda2.toString());
    });

    it('should derive different PDAs for different transaction IDs', () => {
      const pda1 = client.deriveEscrowPda('tx_123');
      const pda2 = client.deriveEscrowPda('tx_456');

      expect(pda1.toString()).not.toBe(pda2.toString());
    });
  });

  describe('Event Subscription', () => {
    it('should subscribe to escrow events', async () => {
      const callback = jest.fn();
      const escrowPda = new PublicKey('33333333333333333333333333333333');

      mockConnection.onAccountChange = jest.fn((pubkey, cb) => {
        // Simulate account change
        setTimeout(() => cb({ data: Buffer.from([]), lamports: 0 }), 10);
        return 1; // subscription ID
      });

      const subscriptionId = await client.subscribeToEscrow(escrowPda, callback);

      expect(subscriptionId).toBeDefined();
      expect(mockConnection.onAccountChange).toHaveBeenCalled();

      // Wait for callback
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe from escrow events', () => {
      mockConnection.removeAccountChangeListener = jest.fn();

      const subscriptionId = 123;
      client.unsubscribeFromEscrow(subscriptionId);

      expect(mockConnection.removeAccountChangeListener).toHaveBeenCalledWith(subscriptionId);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate escrow amount limits', () => {
      expect(client.validateAmount(0.001)).toBe(true);
      expect(client.validateAmount(100)).toBe(true);
      expect(client.validateAmount(0)).toBe(false);
      expect(client.validateAmount(-0.01)).toBe(false);
      expect(client.validateAmount(1001)).toBe(false);
    });

    it('should validate time lock duration', () => {
      expect(client.validateTimeLock(3600)).toBe(true);      // 1 hour
      expect(client.validateTimeLock(86400)).toBe(true);     // 1 day
      expect(client.validateTimeLock(604800)).toBe(true);    // 7 days
      expect(client.validateTimeLock(0)).toBe(false);        // Too short
      expect(client.validateTimeLock(10000000)).toBe(false); // Too long
    });

    it('should validate transaction ID format', () => {
      expect(client.validateTransactionId('tx_abc123')).toBe(true);
      expect(client.validateTransactionId('5Eykt4UsFJWrhgnJaboRHPpqMJCd7pVzRF8GzMHxfK')).toBe(true);
      expect(client.validateTransactionId('')).toBe(false);
      expect(client.validateTransactionId('invalid id')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle RPC errors gracefully', async () => {
      mockConnection.getAccountInfo.mockRejectedValueOnce(new Error('RPC error'));

      const escrowPda = new PublicKey('33333333333333333333333333333333');

      await expect(client.getEscrowDetails(escrowPda)).rejects.toThrow('RPC error');
    });

    it('should handle transaction confirmation timeout', async () => {
      mockConnection.sendTransaction.mockResolvedValueOnce('signature');
      mockConnection.confirmTransaction.mockRejectedValueOnce(new Error('Timeout'));

      await expect(client.createEscrow({
        amount: 0.01,
        recipient: new PublicKey('22222222222222222222222222222222'),
        timeLockDuration: 86400,
        transactionId: 'tx_123'
      })).rejects.toThrow('Timeout');
    });

    it('should handle invalid account owner', async () => {
      const mockAccountInfo = {
        data: Buffer.from([]),
        owner: new PublicKey('invalid_program_id'),
        lamports: 10000000
      };

      mockConnection.getAccountInfo.mockResolvedValueOnce(mockAccountInfo);

      const escrowPda = new PublicKey('33333333333333333333333333333333');

      await expect(client.getEscrowDetails(escrowPda)).rejects.toThrow('Invalid account owner');
    });
  });
});
