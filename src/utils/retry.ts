/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'retryable'>> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: (retryCount: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryable,
  } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      // Check if error is retryable (if function provided)
      if (retryable && !retryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt < maxRetries) {
        // Wait before retrying
        await sleep(Math.min(delay, maxDelayMs));
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error is a network error (retryable)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors, timeouts, and 5xx errors are retryable
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

