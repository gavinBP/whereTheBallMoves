import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should not call function immediately', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 500));

    act(() => {
      result.current();
    });

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should call function after delay', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 500));

    act(() => {
      result.current();
    });

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should debounce rapid calls', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 500));

    act(() => {
      result.current();
      jest.advanceTimersByTime(200);
      result.current();
      jest.advanceTimersByTime(200);
      result.current();
    });

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should only be called once (the last call)
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 500));

    act(() => {
      result.current('arg1', 'arg2', 123);
      jest.advanceTimersByTime(500);
    });

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should reset timer on each call', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useDebounce(mockFn, 500));

    act(() => {
      result.current();
      jest.advanceTimersByTime(400); // Almost at delay
      result.current(); // Reset timer
      jest.advanceTimersByTime(400); // Still not at delay
    });

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100); // Complete delay
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const mockFn = jest.fn();
    const { result, unmount } = renderHook(() => useDebounce(mockFn, 500));

    act(() => {
      result.current();
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should not be called after unmount
    expect(mockFn).not.toHaveBeenCalled();
  });
});

