import { retryWithBackoff, isRetryableError } from './retry';

describe('retry', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
      });

      // Fast-forward through retry delay
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Allow promise to resolve

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });

      // First retry after 100ms
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      // Second retry after 200ms (100 * 2)
      jest.advanceTimersByTime(200);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should respect max delay', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 500, // Max delay is less than initial
        backoffMultiplier: 2,
      });

      // Should wait maxDelayMs (500ms) not initialDelayMs * multiplier
      jest.advanceTimersByTime(500);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const error = new Error('Persistent error');
      const mockFn = jest.fn().mockRejectedValue(error);

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 2,
        initialDelayMs: 100,
      });

      // Fast-forward through all retries
      jest.advanceTimersByTime(100); // First retry
      await Promise.resolve();
      jest.advanceTimersByTime(200); // Second retry
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should pass retry count to function', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      await promise;

      expect(mockFn).toHaveBeenCalledWith(0); // First call
      expect(mockFn).toHaveBeenCalledWith(1); // First retry
    });

    it('should respect retryable function', async () => {
      const retryableError = new Error('Network error');
      const nonRetryableError = new Error('Invalid input');

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(nonRetryableError);

      const promise = retryWithBackoff(mockFn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryable: (error) => {
          return error instanceof Error && error.message.includes('Network');
        },
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // Should not retry non-retryable error
      await expect(promise).rejects.toThrow('Invalid input');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const error = new Error('Network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify connection errors as retryable', () => {
      const error = new Error('ECONNREFUSED');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify DNS errors as retryable', () => {
      const error = new Error('ENOTFOUND');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not identify other errors as retryable', () => {
      const error = new Error('Invalid input');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should handle non-Error objects', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });
});

