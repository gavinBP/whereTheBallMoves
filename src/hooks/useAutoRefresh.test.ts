import { renderHook, act } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';

describe('useAutoRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should call callback immediately when immediate is true', () => {
    const mockCallback = jest.fn();
    renderHook(() =>
      useAutoRefresh({
        callback: mockCallback,
        intervalMs: 1000,
        enabled: true,
        immediate: true,
      })
    );

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback immediately when immediate is false', () => {
    const mockCallback = jest.fn();
    renderHook(() =>
      useAutoRefresh({
        callback: mockCallback,
        intervalMs: 1000,
        enabled: true,
        immediate: false,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should call callback at regular intervals', () => {
    const mockCallback = jest.fn();
    renderHook(() =>
      useAutoRefresh({
        callback: mockCallback,
        intervalMs: 1000,
        enabled: true,
        immediate: false,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  it('should not call callback when disabled', () => {
    const mockCallback = jest.fn();
    renderHook(() =>
      useAutoRefresh({
        callback: mockCallback,
        intervalMs: 1000,
        enabled: false,
        immediate: true,
      })
    );

    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should use latest callback reference', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    const { rerender } = renderHook(
      ({ callback }) =>
        useAutoRefresh({
          callback,
          intervalMs: 1000,
          enabled: true,
          immediate: false,
        }),
      {
        initialProps: { callback: mockCallback1 },
      }
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).not.toHaveBeenCalled();

    // Update callback
    rerender({ callback: mockCallback2 });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should use new callback
    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('should cleanup interval on unmount', () => {
    const mockCallback = jest.fn();
    const { unmount } = renderHook(() =>
      useAutoRefresh({
        callback: mockCallback,
        intervalMs: 1000,
        enabled: true,
        immediate: false,
      })
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should not be called after unmount
    expect(mockCallback).not.toHaveBeenCalled();
  });
});

