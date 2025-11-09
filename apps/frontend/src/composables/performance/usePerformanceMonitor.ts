import { onMounted, onUnmounted, ref } from 'vue'

// 性能指标类型
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift

  // 自定义指标
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  domContentLoaded: number
  loadComplete: number

  // 内存使用
  memoryUsage?: number

  // 网络请求
  networkRequests: NetworkRequest[]
}

// 网络请求信息
export interface NetworkRequest {
  url: string
  method: string
  duration: number
  status: number
  size: number
  timestamp: number
}

// 性能监控配置
interface PerformanceConfig {
  enableCoreWebVitals: boolean
  enableMemoryMonitoring: boolean
  enableNetworkMonitoring: boolean
  reportInterval: number
  sampleRate: number
}

// 性能监控钩子
export function usePerformanceMonitor(config: Partial<PerformanceConfig> = {}) {
  const defaultConfig: PerformanceConfig = {
    enableCoreWebVitals: true,
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true,
    reportInterval: 30000, // 30秒
    sampleRate: 1.0, // 100%采样
  }

  const finalConfig = { ...defaultConfig, ...config }

  // 响应式状态
  const metrics = ref<PerformanceMetrics>({
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0,
    domContentLoaded: 0,
    loadComplete: 0,
    memoryUsage: 0,
    networkRequests: [],
  })

  const isMonitoring = ref(false)
  const observers = ref<any[]>([])
  const reportTimer = ref<NodeJS.Timeout | null>(null)

  // 初始化性能观察者
  const initObservers = () => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    // Largest Contentful Paint (LCP)
    if (finalConfig.enableCoreWebVitals) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          metrics.value.lcp = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        observers.value.push(lcpObserver)
      } catch (_e) {
        console.warn('LCP observation not supported')
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            metrics.value.fid = entry.processingStart - entry.startTime
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        observers.value.push(fidObserver)
      } catch (_e) {
        console.warn('FID observation not supported')
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          metrics.value.cls = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        observers.value.push(clsObserver)
      } catch (_e) {
        console.warn('CLS observation not supported')
      }
    }

    // Paint Timing (FCP)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.value.fcp = entry.startTime
          }
        })
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      observers.value.push(paintObserver)
    } catch (_e) {
      console.warn('Paint timing observation not supported')
    }

    // Navigation Timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            metrics.value.ttfb = entry.responseStart - entry.requestStart
            metrics.value.domContentLoaded =
              entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
            metrics.value.loadComplete = entry.loadEventEnd - entry.loadEventStart
          }
        })
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      observers.value.push(navObserver)
    } catch (_e) {
      console.warn('Navigation timing observation not supported')
    }

    // Resource Timing (网络请求监控)
    if (finalConfig.enableNetworkMonitoring) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.initiatorType !== 'navigation') {
              const request: NetworkRequest = {
                url: entry.name,
                method: 'GET', // Performance API 不提供方法信息
                duration: entry.responseEnd - entry.requestStart,
                status: 200, // Performance API 不提供状态码
                size: entry.transferSize || 0,
                timestamp: entry.requestStart,
              }
              metrics.value.networkRequests.push(request)

              // 限制数组大小，避免内存泄漏
              if (metrics.value.networkRequests.length > 100) {
                metrics.value.networkRequests = metrics.value.networkRequests.slice(-50)
              }
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        observers.value.push(resourceObserver)
      } catch (_e) {
        console.warn('Resource timing observation not supported')
      }
    }
  }

  // 启动性能监控
  const startMonitoring = () => {
    if (isMonitoring.value) return

    initObservers()
    isMonitoring.value = true

    // 定期报告性能指标
    if (finalConfig.reportInterval > 0) {
      reportTimer.value = setInterval(() => {
        reportMetrics()
      }, finalConfig.reportInterval)
    }

    // 内存监控
    if (finalConfig.enableMemoryMonitoring && 'memory' in performance) {
      const memoryInterval = setInterval(() => {
        const memory = (performance as any).memory
        metrics.value.memoryUsage = memory.usedJSHeapSize
      }, 5000)
      observers.value.push({ disconnect: () => clearInterval(memoryInterval) })
    }

    console.log('Performance monitoring started')
  }

  // 停止性能监控
  const stopMonitoring = () => {
    if (!isMonitoring.value) return

    observers.value.forEach((observer) => {
      if (observer.disconnect) {
        observer.disconnect()
      }
    })
    observers.value = []

    if (reportTimer.value) {
      clearInterval(reportTimer.value)
      reportTimer.value = null
    }

    isMonitoring.value = false
    console.log('Performance monitoring stopped')
  }

  // 报告性能指标
  const reportMetrics = () => {
    if (Math.random() > finalConfig.sampleRate) return

    const reportData = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: { ...metrics.value },
    }

    // 发送到分析服务
    console.log('Performance report:', reportData)

    // 这里可以集成实际的分析服务
    // analyticsService.track('performance_metrics', reportData)
  }

  // 手动记录自定义指标
  const recordMetric = (name: string, value: number, category = 'custom') => {
    const customMetric = {
      name,
      value,
      category,
      timestamp: Date.now(),
    }

    // 存储自定义指标
    if (!metrics.value.customMetrics) {
      metrics.value.customMetrics = []
    }
    metrics.value.customMetrics.push(customMetric)

    console.log('Custom metric recorded:', customMetric)
  }

  // 记录用户交互延迟
  const recordInteraction = (interactionName: string, startTime: number) => {
    const duration = Date.now() - startTime
    recordMetric(`${interactionName}_duration`, duration, 'interaction')
  }

  // 获取性能评分
  const getPerformanceScore = () => {
    const { lcp, fid, cls } = metrics.value

    // Core Web Vitals 评分标准
    let score = 100

    // LCP 评分
    if (lcp > 4000) score -= 30
    else if (lcp > 2500) score -= 15

    // FID 评分
    if (fid > 300) score -= 30
    else if (fid > 100) score -= 15

    // CLS 评分
    if (cls > 0.25) score -= 30
    else if (cls > 0.1) score -= 15

    return Math.max(0, score)
  }

  // 获取性能洞察
  const getPerformanceInsights = () => {
    const insights = []
    const { lcp, fid, cls, networkRequests } = metrics.value

    if (lcp > 4000) {
      insights.push({
        type: 'warning',
        message: 'Largest Contentful Paint 过慢，影响用户体验',
        suggestion: '优化最大内容绘制时间，考虑图片懒加载和关键资源优先加载',
      })
    }

    if (fid > 300) {
      insights.push({
        type: 'warning',
        message: 'First Input Delay 过高，页面响应不流畅',
        suggestion: '减少JavaScript执行时间，优化事件处理程序',
      })
    }

    if (cls > 0.25) {
      insights.push({
        type: 'error',
        message: 'Cumulative Layout Shift 严重，页面布局不稳定',
        suggestion: '为图像和动态内容设置明确的尺寸，避免布局偏移',
      })
    }

    const slowRequests = networkRequests.filter((req) => req.duration > 1000)
    if (slowRequests.length > 0) {
      insights.push({
        type: 'info',
        message: `发现${slowRequests.length}个慢速网络请求`,
        suggestion: '考虑启用压缩、CDN加速或资源缓存优化',
      })
    }

    return insights
  }

  // Vue 生命周期
  onMounted(() => {
    // 页面加载完成后启动监控
    if (document.readyState === 'complete') {
      startMonitoring()
    } else {
      window.addEventListener('load', startMonitoring)
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // 状态
    metrics: readonly(metrics),
    isMonitoring: readonly(isMonitoring),

    // 方法
    startMonitoring,
    stopMonitoring,
    recordMetric,
    recordInteraction,
    getPerformanceScore,
    getPerformanceInsights,
    reportMetrics,
  }
}
