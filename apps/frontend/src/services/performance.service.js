/**
 * 性能监控服务 - 实时监控和分析应用性能
 */

// 性能指标收集
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: [],
      resources: [],
      interactions: [],
      errors: [],
    };

    this.init();
  }

  /**
   * 初始化性能监控
   */
  init() {
    // 监听导航性能
    this.observeNavigationTiming();

    // 监听资源加载性能
    this.observeResourceTiming();

    // 监听用户交互性能
    this.observeInteractions();

    // 监听错误
    this.observeErrors();

    // 定期上报性能数据
    this.startPeriodicReporting();
  }

  /**
   * 监听导航性能
   */
  observeNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];

        if (navigation) {
          const timing = {
            timestamp: Date.now(),
            type: 'navigation',
            domContentLoaded:
              navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            largestContentfulPaint: this.getLargestContentfulPaint(),
            cumulativeLayoutShift: this.getCumulativeLayoutShift(),
          };

          this.metrics.navigation.push(timing);
          this.reportMetric(timing);
        }
      });
    }
  }

  /**
   * 监听资源加载性能
   */
  observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // 只监控重要的资源
          if (entry.duration > 100 || entry.transferSize > 100000) {
            const metric = {
              timestamp: Date.now(),
              type: 'resource',
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType,
            };

            this.metrics.resources.push(metric);
            this.reportMetric(metric);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * 监听用户交互性能
   */
  observeInteractions() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const metric = {
            timestamp: Date.now(),
            type: 'interaction',
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
          };

          this.metrics.interactions.push(metric);
          this.reportMetric(metric);
        });
      });

      observer.observe({ entryTypes: ['event'] });
    }
  }

  /**
   * 监听错误
   */
  observeErrors() {
    window.addEventListener('error', (event) => {
      const metric = {
        timestamp: Date.now(),
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      };

      this.metrics.errors.push(metric);
      this.reportMetric(metric);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const metric = {
        timestamp: Date.now(),
        type: 'error',
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
        stack: event.reason?.stack,
      };

      this.metrics.errors.push(metric);
      this.reportMetric(metric);
    });
  }

  /**
   * 获取First Paint时间
   */
  getFirstPaint() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fp = paintEntries.find((entry) => entry.name === 'first-paint');
      return fp ? fp.startTime : 0;
    }
    return 0;
  }

  /**
   * 获取First Contentful Paint时间
   */
  getFirstContentfulPaint() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : 0;
    }
    return 0;
  }

  /**
   * 获取Largest Contentful Paint
   */
  getLargestContentfulPaint() {
    if ('PerformanceObserver' in window) {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry ? lastEntry.startTime : 0);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // 5秒超时
        setTimeout(() => resolve(0), 5000);
      });
    }
    return Promise.resolve(0);
  }

  /**
   * 获取Cumulative Layout Shift
   */
  getCumulativeLayoutShift() {
    if ('PerformanceObserver' in window) {
      return new Promise((resolve) => {
        let clsValue = 0;

        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // 页面加载完成后返回结果
        window.addEventListener('load', () => {
          setTimeout(() => resolve(clsValue), 0);
        });
      });
    }
    return Promise.resolve(0);
  }

  /**
   * 上报性能指标
   */
  reportMetric(metric) {
    // 开发环境输出到控制台
    if (import.meta.env.DEV) {
      console.log('Performance Metric:', metric);
    }

    // 生产环境可以发送到监控服务
    if (import.meta.env.PROD) {
      // TODO: 发送到性能监控服务
      // this.sendToMonitoringService(metric);
    }
  }

  /**
   * 定期上报性能数据
   */
  startPeriodicReporting() {
    // 每5分钟上报一次汇总数据
    setInterval(
      () => {
        this.reportAggregatedMetrics();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 上报汇总性能指标
   */
  reportAggregatedMetrics() {
    const aggregated = {
      timestamp: Date.now(),
      period: '5min',
      navigation: this.aggregateNavigationMetrics(),
      resources: this.aggregateResourceMetrics(),
      interactions: this.aggregateInteractionMetrics(),
      errors: this.metrics.errors.length,
    };

    this.reportMetric(aggregated);

    // 清空已上报的数据
    this.metrics.navigation = [];
    this.metrics.resources = [];
    this.metrics.interactions = [];
    this.metrics.errors = [];
  }

  /**
   * 汇总导航性能指标
   */
  aggregateNavigationMetrics() {
    if (this.metrics.navigation.length === 0) {
      return null;
    }

    const nav = this.metrics.navigation[this.metrics.navigation.length - 1];
    return {
      domContentLoaded: nav.domContentLoaded,
      loadComplete: nav.loadComplete,
      firstPaint: nav.firstPaint,
      firstContentfulPaint: nav.firstContentfulPaint,
      largestContentfulPaint: nav.largestContentfulPaint,
      cumulativeLayoutShift: nav.cumulativeLayoutShift,
    };
  }

  /**
   * 汇总资源性能指标
   */
  aggregateResourceMetrics() {
    if (this.metrics.resources.length === 0) {
      return null;
    }

    const resources = this.metrics.resources;
    return {
      count: resources.length,
      averageDuration: resources.reduce((sum, r) => sum + r.duration, 0) / resources.length,
      totalSize: resources.reduce((sum, r) => sum + (r.size || 0), 0),
      slowResources: resources.filter((r) => r.duration > 1000).length,
    };
  }

  /**
   * 汇总交互性能指标
   */
  aggregateInteractionMetrics() {
    if (this.metrics.interactions.length === 0) {
      return null;
    }

    const interactions = this.metrics.interactions;
    return {
      count: interactions.length,
      averageDuration: interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length,
      slowInteractions: interactions.filter((i) => i.duration > 100).length,
    };
  }

  /**
   * 获取当前性能状态
   */
  getPerformanceStatus() {
    return {
      navigation: this.aggregateNavigationMetrics(),
      resources: this.aggregateResourceMetrics(),
      interactions: this.aggregateInteractionMetrics(),
      errors: this.metrics.errors.length,
      memory: this.getMemoryUsage(),
    };
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      const mem = performance.memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
        usagePercent: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }
}

// 创建单例实例
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// 导出便捷方法
export const getPerformanceStatus = () => performanceMonitor.getPerformanceStatus();
export const reportMetric = (metric) => performanceMonitor.reportMetric(metric);
