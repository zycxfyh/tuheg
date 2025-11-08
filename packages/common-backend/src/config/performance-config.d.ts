export interface SLATargets {
  responseTime: {
    p50: number
    p95: number
    p99: number
  }
  availability: number
  errorRate: number
  throughput: number
}
export interface PerformanceThresholds {
  warning: number
  critical: number
  emergency: number
}
export interface ServiceSLAs {
  api: SLATargets
  ai: SLATargets
  database: SLATargets
  cache: SLATargets
  queue: SLATargets
  websocket: SLATargets
}
export declare const PERFORMANCE_CONFIG: {
  slas: ServiceSLAs
  thresholds: Record<string, PerformanceThresholds>
  monitoring: {
    sampleRate: number
    collectionInterval: number
    alertCheckInterval: number
    reportInterval: number
    retentionDays: number
  }
  capacity: {
    maxConcurrentUsers: number
    dbConnectionPool: number
    redisConnectionPool: number
    maxWebSocketConnections: number
    queueConcurrency: number
  }
}
export declare function getSLATarget(service: keyof ServiceSLAs): SLATargets
export declare function getPerformanceThreshold(
  metric: string,
  level: keyof PerformanceThresholds
): number
export declare function isPerformanceHealthy(
  service: keyof ServiceSLAs,
  metric: 'responseTime' | 'errorRate' | 'availability',
  value: number
): {
  healthy: boolean
  level: 'healthy' | 'warning' | 'critical' | 'emergency'
}
//# sourceMappingURL=performance-config.d.ts.map
