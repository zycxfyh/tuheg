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
exports.EventBusModule = exports.NEXUS_EVENT_BUS = void 0
const common_1 = require('@nestjs/common')
const microservices_1 = require('@nestjs/microservices')
const config_1 = require('@nestjs/config')
const event_bus_service_1 = require('./event-bus.service')
exports.NEXUS_EVENT_BUS = 'NEXUS_EVENT_BUS'
let EventBusModule = class EventBusModule {}
exports.EventBusModule = EventBusModule
exports.EventBusModule = EventBusModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        microservices_1.ClientsModule.registerAsync([
          {
            name: exports.NEXUS_EVENT_BUS,
            imports: [config_1.ConfigModule],
            useFactory: (configService) => ({
              transport: microservices_1.Transport.RMQ,
              options: {
                urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672')],
                queue: 'nexus_gateway_queue',
              },
            }),
            inject: [config_1.ConfigService],
          },
        ]),
      ],
      providers: [event_bus_service_1.EventBusService],
      exports: [event_bus_service_1.EventBusService],
    }),
  ],
  EventBusModule
)
//# sourceMappingURL=event-bus.module.js.map
