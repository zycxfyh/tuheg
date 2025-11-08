'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.PERFORMANCE_CONFIG = void 0
exports.getSLATarget = getSLATarget
exports.getPerformanceThreshold = getPerformanceThreshold
exports.isPerformanceHealthy = isPerformanceHealthy
exports.PERFORMANCE_CONFIG = {
  slas: {
    api: {
      responseTime: { p50: 200, p95: 500, p99: 1000 },
      availability: 99.9,
      errorRate: 0.1,
      throughput: 1000,
    },
    ai: {
      responseTime: { p50: 2000, p95: 3000, p99: 5000 },
      availability: 99.5,
      errorRate: 1.0,
      throughput: 100,
    },
    database: {
      responseTime: { p50: 50, p95: 200, p99: 500 },
      availability: 99.9,
      errorRate: 0.01,
      throughput: 5000,
    },
    cache: {
      responseTime: { p50: 5, p95: 20, p99: 50 },
      availability: 99.99,
      errorRate: 0.001,
      throughput: 10000,
    },
    queue: {
      responseTime: { p50: 100, p95: 500, p99: 2000 },
      availability: 99.9,
      errorRate: 0.1,
      throughput: 2000,
    },
    websocket: {
      responseTime: { p50: 50, p95: 100, p99: 200 },
      availability: 99.9,
      errorRate: 0.1,
      throughput: 5000,
    },
  },
  thresholds: {
    responseTime: {
      warning: 1000,
      critical: 3000,
      emergency: 10000,
    },
    errorRate: {
      warning: 1.0,
      critical: 5.0,
      emergency: 10.0,
    },
    cpuUsage: {
      warning: 70,
      critical: 85,
      emergency: 95,
    },
    memoryUsage: {
      warning: 80,
      critical: 90,
      emergency: 95,
    },
    connectionCount: {
      warning: 1000,
      critical: 2000,
      emergency: 5000,
    },
  },
  monitoring: {
    sampleRate: 0.1,
    collectionInterval: 60000,
    alertCheckInterval: 300000,
    reportInterval: 3600000,
    retentionDays: 30,
  },
  capacity: {
    maxConcurrentUsers: 10000,
    dbConnectionPool: 50,
    redisConnectionPool: 100,
    maxWebSocketConnections: 50000,
    queueConcurrency: 20,
  },
}
function getSLATarget(service) {
  return exports.PERFORMANCE_CONFIG.slas[service]
}
function getPerformanceThreshold(metric, level) {
  return exports.PERFORMANCE_CONFIG.thresholds[metric]?.[level] || 0
}
function isPerformanceHealthy(service, metric, value) {
  const sla = getSLATarget(service)
  switch (metric) {
    case 'responseTime':
      if (value <= sla.responseTime.p95) return { healthy: true, level: 'healthy' }
      if (value <= getPerformanceThreshold('responseTime', 'warning'))
        return { healthy: false, level: 'warning' }
      if (value <= getPerformanceThreshold('responseTime', 'critical'))
        return { healthy: false, level: 'critical' }
      return { healthy: false, level: 'emergency' }
    case 'errorRate':
      if (value <= sla.errorRate) return { healthy: true, level: 'healthy' }
      if (value <= getPerformanceThreshold('errorRate', 'warning'))
        return { healthy: false, level: 'warning' }
      if (value <= getPerformanceThreshold('errorRate', 'critical'))
        return { healthy: false, level: 'critical' }
      return { healthy: false, level: 'emergency' }
    case 'availability':
      if (value >= sla.availability) return { healthy: true, level: 'healthy' }
      if (value >= sla.availability - 0.1) return { healthy: false, level: 'warning' }
      if (value >= sla.availability - 0.5) return { healthy: false, level: 'critical' }
      return { healthy: false, level: 'emergency' }
    default:
      return { healthy: true, level: 'healthy' }
  }
}
//# sourceMappingURL=performance-config.js.map
