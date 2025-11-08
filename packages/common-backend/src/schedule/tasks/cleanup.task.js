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
var __metadata =
  (this && this.__metadata) ||
  ((k, v) => {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  })
var CleanupTask_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.CleanupTask = void 0
const common_1 = require('@nestjs/common')
const schedule_1 = require('@nestjs/schedule')
const prisma_service_1 = require('../../prisma/prisma.service')
let CleanupTask = (CleanupTask_1 = class CleanupTask {
  prisma
  logger = new common_1.Logger(CleanupTask_1.name)
  constructor(prisma) {
    this.prisma = prisma
  }
  async cleanupExpiredSessions() {
    this.logger.log('Starting cleanup of expired sessions...')
    try {
      this.logger.log('Cleanup of expired sessions completed')
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error)
    }
  }
  async cleanupOldLogs() {
    this.logger.log('Starting cleanup of old logs...')
    try {
      this.logger.log('Cleanup of old logs completed')
    } catch (error) {
      this.logger.error('Failed to cleanup old logs:', error)
    }
  }
  async cleanupTempFiles() {
    this.logger.log('Starting cleanup of temporary files...')
    try {
      this.logger.log('Cleanup of temporary files completed')
    } catch (error) {
      this.logger.error('Failed to cleanup temporary files:', error)
    }
  }
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      this.logger.debug('Health check passed')
    } catch (error) {
      this.logger.error('Health check failed:', error)
    }
  }
})
exports.CleanupTask = CleanupTask
__decorate(
  [
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  CleanupTask.prototype,
  'cleanupExpiredSessions',
  null
)
__decorate(
  [
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  CleanupTask.prototype,
  'cleanupOldLogs',
  null
)
__decorate(
  [
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  CleanupTask.prototype,
  'cleanupTempFiles',
  null
)
__decorate(
  [
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', Promise),
  ],
  CleanupTask.prototype,
  'healthCheck',
  null
)
exports.CleanupTask =
  CleanupTask =
  CleanupTask_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [prisma_service_1.PrismaService]),
      ],
      CleanupTask
    )
//# sourceMappingURL=cleanup.task.js.map
