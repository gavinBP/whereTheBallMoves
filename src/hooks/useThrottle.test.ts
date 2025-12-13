import { renderHook, act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should call the function immediately on first call', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throttle rapid calls', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    // Should only be called once initially
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Fast-forward past throttle period
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should be called again after throttle period
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should schedule delayed call if called within throttle period', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current(); // First call
    });

    expect(mockFn).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(500); // Halfway through throttle period
      result.current(); // Second call - should be scheduled
    });

    expect(mockFn).toHaveBeenCalledTimes(1); // Not called yet

    act(() => {
      jest.advanceTimersByTime(500); // Complete remaining time
    });

    expect(mockFn).toHaveBeenCalledTimes(2); // Now called
  });

  it('should pass arguments correctly', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current('arg1', 'arg2', 123);
    });

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should handle multiple rapid calls correctly', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useThrottle(mockFn, 1000));

    act(() => {
      result.current();
      jest.advanceTimersByTime(200);
      result.current();
      jest.advanceTimersByTime(200);
      result.current();
    });

    // Should only be called once initially
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Fast-forward to when the last scheduled call should execute
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should be called one more time (the last scheduled call)
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

