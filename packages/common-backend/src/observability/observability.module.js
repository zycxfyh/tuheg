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
Object.defineProperty(exports, '__esModule', { value: true })
exports.ObservabilityModule = void 0
const common_1 = require('@nestjs/common')
const schedule_module_1 = require('../schedule/schedule.module')
const sentry_module_1 = require('./sentry.module')
const performance_monitor_service_1 = require('./performance-monitor.service')
let ObservabilityModule = class ObservabilityModule {}
exports.ObservabilityModule = ObservabilityModule
exports.ObservabilityModule = ObservabilityModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [schedule_module_1.ScheduleModule, sentry_module_1.SentryModule],
      providers: [performance_monitor_service_1.PerformanceMonitorService],
      exports: [
        sentry_module_1.SentryModule,
        performance_monitor_service_1.PerformanceMonitorService,
      ],
    }),
  ],
  ObservabilityModule
)
//# sourceMappingURL=observability.module.js.map
