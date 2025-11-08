var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (o, m, k, k2) => {
        if (k2 === undefined) k2 = k
        var desc = Object.getOwnPropertyDescriptor(m, k)
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: () => m[k],
          }
        }
        Object.defineProperty(o, k2, desc)
      }
    : (o, m, k, k2) => {
        if (k2 === undefined) k2 = k
        o[k2] = m[k]
      })
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (o, v) => {
        Object.defineProperty(o, 'default', { enumerable: true, value: v })
      }
    : (o, v) => {
        o['default'] = v
      })
var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var __importStar =
  (this && this.__importStar) ||
  (() => {
    var ownKeys = (o) => {
      ownKeys =
        Object.getOwnPropertyNames ||
        ((o) => {
          var ar = []
          for (var k in o) if (Object.hasOwn(o, k)) ar[ar.length] = k
          return ar
        })
      return ownKeys(o)
    }
    return (mod) => {
      if (mod && mod.__esModule) return mod
      var result = {}
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i])
      __setModuleDefault(result, mod)
      return result
    }
  })()
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var PerformanceMonitorService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.PerformanceMonitorService = void 0
const common_1 = require('@nestjs/common')
const schedule_1 = require('@nestjs/schedule')
const os = __importStar(require('os'))
const performance_config_1 = require('../config/performance-config')
let PerformanceMonitorService = (PerformanceMonitorService_1 = class PerformanceMonitorService {
  logger = new common_1.Logger(PerformanceMonitorService_1.name)
  metrics = []
  alerts = []
  requestCount = 0
  errorCount = 0
  responseTimes = []
  constructor() {
    this.logger.log('PerformanceMonitorService initialized with SLA targets')
  }
  recordRequest(_service, responseTime, isError = false) {
    this.requestCount++
    this.responseTimes.push(responseTime)
    if (isError) {
      this.errorCount++
    }
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift()
    }
  }
  async collectMetrics() {
    try {
      const metrics = await this.gatherCurrentMetrics()
      this.metrics.push(metrics)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      this.metrics.splice(
        0,
        this.metrics.findIndex((m) => m.timestamp < oneDayAgo)
      )
      await this.checkSLAViolations(metrics)
      this.logger.debug(`Performance metrics collected: ${JSON.stringify(metrics)}`)
    } catch (error) {
      this.logger.error('Failed to collect performance metrics:', error)
    }
  }
  async checkSLAViolations(metrics) {
    const sla = (0, performance_config_1.getSLATarget)(metrics.service)
    const rtHealth = (0, performance_config_1.isPerformanceHealthy)(
      metrics.service,
      'responseTime',
      metrics.responseTime.p95
    )
    if (!rtHealth.healthy) {
      await this.createAlert({
        service: metrics.service,
        metric: 'responseTime',
        threshold: sla.responseTime.p95,
        currentValue: metrics.responseTime.p95,
        level: rtHealth.level,
        timestamp: Date.now(),
      })
    }
    const erHealth = (0, performance_config_1.isPerformanceHealthy)(
      metrics.service,
      'errorRate',
      metrics.errorRate
    )
    if (!erHealth.healthy) {
      await this.createAlert({
        service: metrics.service,
        metric: 'errorRate',
        threshold: sla.errorRate,
        currentValue: metrics.errorRate,
        level: erHealth.level,
        timestamp: Date.now(),
      })
    }
    const avHealth = (0, performance_config_1.isPerformanceHealthy)(
      metrics.service,
      'availability',
      metrics.availability
    )
    if (!avHealth.healthy) {
      await this.createAlert({
        service: metrics.service,
        metric: 'availability',
        threshold: sla.availability,
        currentValue: metrics.availability,
        level: avHealth.level,
        timestamp: Date.now(),
      })
    }
  }
  async createAlert(alert) {
    this.alerts.push(alert)
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }
    this.logger.warn(
      `🚨 Performance Alert: ${alert.service} ${alert.metric} ${alert.level} - ${alert.currentValue} > ${alert.threshold}`
    )
  }
  async gatherCurrentMetrics() {
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b)
    const p50 = this.calculatePercentile(sortedTimes, 50)
    const p95 = this.calculatePercentile(sortedTimes, 95)
    const p99 = this.calculatePercentile(sortedTimes, 99)
    const avg = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
    const cpuUsage = (os.loadavg()[0] / os.cpus().length) * 100
    const memoryUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
    const activeConnections = 0
    return {
      timestamp: Date.now(),
      service: 'api',
      responseTime: { p50, p95, p99, avg },
      errorRate,
      availability: 99.9,
      throughput: this.requestCount,
      system: {
        cpuUsage,
        memoryUsage,
        activeConnections,
      },
    }
  }
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0
    const index = (percentile / 100) * (sortedArray.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    if (lower === upper) {
      return sortedArray[lower]
    }
    return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower)
  }
  getMetrics(hours = 1) {
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return this.metrics.filter((m) => m.timestamp >= cutoff)
  }
  getAlerts(hours = 24) {
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return this.alerts.filter((a) => a.timestamp >= cutoff)
  }
  getSLASummary() {
    const summary = {}
    const services = Object.keys(performance_config_1.PERFORMANCE_CONFIG.slas)
    for (const service of services) {
      const recentMetrics = this.getMetrics(1).filter((m) => m.service === service)
      const latest = recentMetrics[recentMetrics.length - 1]
      if (latest) {
        const sla = (0, performance_config_1.getSLATarget)(service)
        const rtHealth = (0, performance_config_1.isPerformanceHealthy)(
          service,
          'responseTime',
          latest.responseTime.p95
        )
        const erHealth = (0, performance_config_1.isPerformanceHealthy)(
          service,
          'errorRate',
          latest.errorRate
        )
        summary[service] = {
          target: sla,
          current: {
            responseTime: latest.responseTime,
            errorRate: latest.errorRate,
            availability: latest.availability,
          },
          status: rtHealth.healthy && erHealth.healthy ? 'healthy' : rtHealth.level,
        }
      } else {
        summary[service] = {
          target: (0, performance_config_1.getSLATarget)(service),
          current: null,
          status: 'healthy',
        }
      }
    }
    return summary
  }
  resetCounters() {
    this.requestCount = 0
    this.errorCount = 0
    this.responseTimes = []
  }
})
exports.PerformanceMonitorService = PerformanceMonitorService
__decorate(
  [
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  PerformanceMonitorService.prototype,
  'collectMetrics',
  null
)
__decorate(
  [
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object]),
    __metadata('design:returntype', Promise),
  ],
  PerformanceMonitorService.prototype,
  'checkSLAViolations',
  null
)
exports.PerformanceMonitorService =
  PerformanceMonitorService =
  PerformanceMonitorService_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [])],
      PerformanceMonitorService
    )
//# sourceMappingURL=performance-monitor.service.js.map
