import { type ServiceSLAs } from '../config/performance-config'
export interface PerformanceMetrics {
  timestamp: number
  service: keyof ServiceSLAs
  responseTime: {
    p50: number
    p95: number
    p99: number
    avg: number
  }
  errorRate: number
  availability: number
  throughput: number
  system: {
    cpuUsage: number
    memoryUsage: number
    activeConnections: number
  }
}
export interface AlertCondition {
  service: keyof ServiceSLAs
  metric: string
  threshold: number
  currentValue: number
  level: 'warning' | 'critical' | 'emergency' | 'healthy'
  timestamp: number
}
export declare class PerformanceMonitorService {
  private readonly logger
  private readonly metrics
  private readonly alerts
  private requestCount
  private errorCount
  private responseTimes
  constructor()
  recordRequest(_service: keyof ServiceSLAs, responseTime: number, isError?: boolean): void
  collectMetrics(): Promise<void>
  checkSLAViolations(metrics: PerformanceMetrics): Promise<void>
  private createAlert
  private gatherCurrentMetrics
  private calculatePercentile
  getMetrics(hours?: number): PerformanceMetrics[]
  getAlerts(hours?: number): AlertCondition[]
  getSLASummary(): Record<
    keyof ServiceSLAs,
    {
      target: any
      current: any
      status: 'healthy' | 'warning' | 'critical' | 'emergency'
    }
  >
  resetCounters(): void
}
//# sourceMappingURL=performance-monitor.service.d.ts.map
