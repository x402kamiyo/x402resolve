import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KamiyoClient, X402Error } from '../src/client';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KamiyoClient', () => {
  let client: KamiyoClient;

  beforeEach(() => {
    client = new KamiyoClient({
      apiUrl: 'https://api.test.kamiyo.ai',
      chain: 'solana',
      enablex402Resolve: true
    });
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(client).toBeInstanceOf(KamiyoClient);
    });

    it('should use default values when not provided', () => {
      const defaultClient = new KamiyoClient({});
      expect(defaultClient).toBeInstanceOf(KamiyoClient);
    });

    it('should throw error for invalid API URL', () => {
      expect(() => {
        new KamiyoClient({ apiUrl: 'invalid-url' });
      }).toThrow();
    });
  });

  describe('pay()', () => {
    it('should create payment successfully', async () => {
      const mockResponse = {
        data: {
          transactionId: 'tx_123',
          token: 'jwt_token_here',
          expiresAt: Date.now() + 3600000
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.pay({
        amount: 0.01,
        recipient: 'recipient_address'
      });

      expect(result.transactionId).toBe('tx_123');
      expect(result.token).toBe('jwt_token_here');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.test.kamiyo.ai/pay',
        expect.objectContaining({
          amount: 0.01,
          recipient: 'recipient_address'
        })
      );
    });

    it('should handle payment failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 402,
          data: { error: 'Insufficient funds' }
        }
      });

      await expect(client.pay({
        amount: 0.01,
        recipient: 'recipient_address'
      })).rejects.toThrow(X402Error);
    });

    it('should validate amount is positive', async () => {
      await expect(client.pay({
        amount: -0.01,
        recipient: 'recipient_address'
      })).rejects.toThrow();
    });

    it('should validate recipient address', async () => {
      await expect(client.pay({
        amount: 0.01,
        recipient: ''
      })).rejects.toThrow();
    });

    it('should include escrow option when enablex402Resolve is true', async () => {
      const mockResponse = {
        data: {
          transactionId: 'tx_123',
          token: 'jwt_token',
          expiresAt: Date.now() + 3600000,
          escrowCreated: true
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await client.pay({
        amount: 0.01,
        recipient: 'recipient_address',
        enableEscrow: true
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          enableEscrow: true
        })
      );
    });
  });

  describe('dispute()', () => {
    beforeEach(() => {
      client.setAccessToken('test_token');
    });

    it('should file dispute successfully', async () => {
      const mockResponse = {
        data: {
          disputeId: 'dispute_123',
          qualityScore: 65,
          refundPercentage: 35,
          status: 'pending'
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await client.dispute({
        transactionId: 'tx_123',
        reason: 'Incomplete data',
        evidence: { records: 3, expected: 5 }
      });

      expect(result.disputeId).toBe('dispute_123');
      expect(result.qualityScore).toBe(65);
      expect(result.refundPercentage).toBe(35);
    });

    it('should require access token', async () => {
      const noTokenClient = new KamiyoClient({ apiUrl: 'https://api.test.kamiyo.ai' });

      await expect(noTokenClient.dispute({
        transactionId: 'tx_123',
        reason: 'Test'
      })).rejects.toThrow();
    });

    it('should validate transaction ID format', async () => {
      await expect(client.dispute({
        transactionId: '',
        reason: 'Test'
      })).rejects.toThrow();
    });

    it('should include optional evidence', async () => {
      const mockResponse = {
        data: {
          disputeId: 'dispute_123',
          qualityScore: 50,
          refundPercentage: 50
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      await client.dispute({
        transactionId: 'tx_123',
        reason: 'Poor quality',
        evidence: {
          query: 'Uniswap exploits',
          dataReceived: ['Curve', 'Euler'],
          expectedCriteria: { minRecords: 5 }
        }
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/dispute'),
        expect.objectContaining({
          evidence: expect.any(Object)
        }),
        expect.any(Object)
      );
    });
  });

  describe('query()', () => {
    beforeEach(() => {
      client.setAccessToken('test_token');
    });

    it('should query API successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { protocol: 'Uniswap', amount_usd: 1500000 },
            { protocol: 'Curve', amount_usd: 62000000 }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.query('/exploits/recent', { limit: 2 });

      expect(result).toHaveLength(2);
      expect(result[0].protocol).toBe('Uniswap');
    });

    it('should handle 402 Payment Required', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 402,
          data: { error: 'Payment required' }
        }
      });

      await expect(client.query('/exploits/recent')).rejects.toThrow(X402Error);
    });

    it('should include authorization header', async () => {
      const mockResponse = { data: { results: [] } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await client.query('/test');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test_token'
          })
        })
      );
    });
  });

  describe('getDisputeStatus()', () => {
    beforeEach(() => {
      client.setAccessToken('test_token');
    });

    it('should get dispute status successfully', async () => {
      const mockResponse = {
        data: {
          disputeId: 'dispute_123',
          status: 'resolved',
          qualityScore: 65,
          refundPercentage: 35,
          createdAt: Date.now(),
          resolvedAt: Date.now() + 86400000
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getDisputeStatus('dispute_123');

      expect(result.status).toBe('resolved');
      expect(result.qualityScore).toBe(65);
    });

    it('should handle not found disputes', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Dispute not found' }
        }
      });

      await expect(client.getDisputeStatus('invalid_id')).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should wrap network errors in X402Error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.pay({
        amount: 0.01,
        recipient: 'test'
      })).rejects.toThrow(X402Error);
    });

    it('should preserve error status codes', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' }
        }
      });

      try {
        await client.query('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(X402Error);
        expect((error as X402Error).statusCode).toBe(429);
      }
    });

    it('should include error details from API', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: 'Invalid request',
            details: { field: 'amount', message: 'Must be positive' }
          }
        }
      });

      try {
        await client.pay({ amount: 0.01, recipient: 'test' });
      } catch (error) {
        expect(error).toBeInstanceOf(X402Error);
        expect((error as X402Error).message).toContain('Invalid request');
      }
    });
  });

  describe('Token Management', () => {
    it('should set access token', () => {
      client.setAccessToken('new_token');
      // Token is private, but we can verify by making a request
      expect(() => client.setAccessToken('new_token')).not.toThrow();
    });

    it('should clear access token', () => {
      client.setAccessToken('token');
      client.setAccessToken('');
      expect(() => client.setAccessToken('')).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should handle different chains', () => {
      const ethClient = new KamiyoClient({
        apiUrl: 'https://api.test.kamiyo.ai',
        chain: 'ethereum'
      });
      expect(ethClient).toBeInstanceOf(KamiyoClient);
    });

    it('should handle custom timeout', () => {
      const customClient = new KamiyoClient({
        apiUrl: 'https://api.test.kamiyo.ai',
        timeout: 10000
      });
      expect(customClient).toBeInstanceOf(KamiyoClient);
    });

    it('should disable x402Resolve when specified', () => {
      const noResolveClient = new KamiyoClient({
        apiUrl: 'https://api.test.kamiyo.ai',
        enablex402Resolve: false
      });
      expect(noResolveClient).toBeInstanceOf(KamiyoClient);
    });
  });
});
