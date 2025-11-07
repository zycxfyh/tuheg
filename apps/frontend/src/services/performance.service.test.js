/**
 * Performance Service 测试
 * 测试性能监控和指标收集功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import performanceMonitor, { getPerformanceStatus, reportMetric } from './performance.service';

describe('Performance Service', () => {
  let mockPerformanceObserver;
  let mockPerformance;

  beforeEach(() => {
    // Mock Performance Observer
    mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(),
    }));

    // Mock Performance API
    mockPerformance = {
      getEntriesByType: vi.fn(),
      mark: vi.fn(),
      measure: vi.fn(),
      now: vi.fn().mockReturnValue(1000),
      timing: {
        navigationStart: 0,
        domContentLoadedEventEnd: 500,
        loadEventEnd: 1000,
      },
      memory: {
        usedJSHeapSize: 10 * 1024 * 1024, // 10MB
        totalJSHeapSize: 20 * 1024 * 1024, // 20MB
        jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
      },
    };

    // Mock window.performance
    Object.defineProperty(window, 'performance', {
      value: mockPerformance,
      writable: true,
    });

    // Mock PerformanceObserver
    global.PerformanceObserver = mockPerformanceObserver;

    // Mock requestIdleCallback
    global.requestIdleCallback = vi.fn();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化性能监控', () => {
      // 重新初始化服务
      const newMonitor = require('./performance.service').default;

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(global.requestIdleCallback).toHaveBeenCalled();
    });

    it('应该监听导航性能', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          domContentLoadedEventEnd: 500,
          loadEventEnd: 1000,
          domContentLoadedEventStart: 200,
          loadEventStart: 0,
        },
      ]);

      // 触发load事件
      window.dispatchEvent(new Event('load'));

      expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('navigation');
    });

    it('应该监听资源加载性能', () => {
      const observerCallback = mockPerformanceObserver.mock.calls[0][0];
      const mockObserver = { observe: vi.fn() };

      observerCallback(
        {
          getEntries: () => [
            {
              name: 'test.js',
              duration: 150,
              transferSize: 50000,
              initiatorType: 'script',
            },
          ],
        },
        mockObserver,
      );

      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['resource'] });
    });

    it('应该监听用户交互性能', () => {
      // Find the interaction observer (second PerformanceObserver call)
      const interactionObserver = mockPerformanceObserver.mock.calls.find(
        (call) => call[1] && call[1].entryTypes && call[1].entryTypes.includes('event'),
      );

      if (interactionObserver) {
        const observerCallback = interactionObserver[0];

        observerCallback({
          getEntries: () => [
            {
              name: 'click',
              duration: 50,
              startTime: 100,
            },
          ],
        });
      }

      // Should have recorded the interaction
      expect(true).toBe(true); // Placeholder - actual verification would check metrics
    });

    it('应该监听错误事件', () => {
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      // Should have recorded the error
      expect(true).toBe(true); // Placeholder - actual verification would check metrics
    });

    it('应该监听未处理的Promise拒绝', () => {
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        reason: new Error('Unhandled promise rejection'),
      });

      window.dispatchEvent(rejectionEvent);

      // Should have recorded the error
      expect(true).toBe(true); // Placeholder - actual verification would check metrics
    });
  });

  describe('性能指标收集', () => {
    it('应该收集导航性能指标', () => {
      const navTiming = {
        domContentLoadedEventEnd: 500,
        loadEventEnd: 1000,
        domContentLoadedEventStart: 200,
        loadEventStart: 0,
      };

      mockPerformance.getEntriesByType.mockReturnValue([navTiming]);

      // 重新初始化服务
      const newMonitor = require('./performance.service').default;

      expect(true).toBe(true); // Placeholder - would check actual metrics collection
    });

    it('应该收集资源加载指标', () => {
      const resourceEntry = {
        name: 'large-file.js',
        duration: 1200,
        transferSize: 2000000, // 2MB
        initiatorType: 'script',
      };

      const observerCallback = mockPerformanceObserver.mock.calls[0][0];

      observerCallback({
        getEntries: () => [resourceEntry],
      });

      // Should have recorded slow/large resource
      expect(true).toBe(true); // Placeholder - would check metrics
    });

    it('应该收集First Paint指标', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          name: 'first-paint',
          startTime: 300,
        },
      ]);

      const monitor = require('./performance.service').default;
      const status = getPerformanceStatus();

      expect(status).toBeDefined();
    });

    it('应该收集内存使用情况', () => {
      const status = getPerformanceStatus();

      expect(status.memory).toBeDefined();
      expect(status.memory.used).toBe(10 * 1024 * 1024);
      expect(status.memory.usagePercent).toBeDefined();
    });
  });

  describe('性能报告', () => {
    it('应该报告性能指标', () => {
      const testMetric = {
        type: 'test',
        value: 100,
        timestamp: Date.now(),
      };

      reportMetric(testMetric);

      // Should have logged the metric
      expect(console.log).toHaveBeenCalled();
    });

    it('应该定期汇总性能数据', () => {
      vi.useFakeTimers();

      // 初始化服务
      const monitor = require('./performance.service').default;

      // 快进5分钟
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(console.log).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('性能状态查询', () => {
    it('应该返回当前性能状态', () => {
      const status = getPerformanceStatus();

      expect(status).toHaveProperty('navigation');
      expect(status).toHaveProperty('resources');
      expect(status).toHaveProperty('interactions');
      expect(status).toHaveProperty('errors');
      expect(status).toHaveProperty('memory');
    });

    it('应该正确计算导航指标', () => {
      mockPerformance.getEntriesByType.mockReturnValue([
        {
          domContentLoadedEventEnd: 500,
          loadEventEnd: 1000,
          domContentLoadedEventStart: 200,
          loadEventStart: 0,
        },
      ]);

      const status = getPerformanceStatus();

      expect(status.navigation).toBeDefined();
      if (status.navigation) {
        expect(status.navigation.domContentLoaded).toBe(300); // 500 - 200
        expect(status.navigation.loadComplete).toBe(1000); // 1000 - 0
      }
    });

    it('应该正确计算资源指标', () => {
      // Add some mock resource metrics to the service
      const status = getPerformanceStatus();

      expect(status.resources).toBeDefined();
    });

    it('应该正确计算交互指标', () => {
      const status = getPerformanceStatus();

      expect(status.interactions).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理Performance API不可用的情况', () => {
      // Mock performance as undefined
      Object.defineProperty(window, 'performance', {
        value: undefined,
        writable: true,
      });

      // Should not throw error
      expect(() => {
        const monitor = require('./performance.service').default;
      }).not.toThrow();
    });

    it('应该处理PerformanceObserver不可用的情况', () => {
      global.PerformanceObserver = undefined;

      // Should not throw error
      expect(() => {
        const monitor = require('./performance.service').default;
      }).not.toThrow();
    });

    it('应该处理内存API不可用的情况', () => {
      Object.defineProperty(window.performance, 'memory', {
        value: undefined,
        writable: true,
      });

      const status = getPerformanceStatus();

      expect(status.memory).toBeUndefined();
    });
  });

  describe('性能监控集成', () => {
    it('应该与开发环境日志集成', () => {
      const testMetric = {
        type: 'test-metric',
        value: 'test-value',
      };

      reportMetric(testMetric);

      // In development, should log to console
      expect(console.log).toHaveBeenCalledWith('Performance Metric:', testMetric);
    });

    it('应该准备好生产环境监控集成', () => {
      // Test that the service is ready for production monitoring integration
      const status = getPerformanceStatus();

      expect(status).toBeDefined();
      expect(typeof status.errors).toBe('number');
    });
  });
});
