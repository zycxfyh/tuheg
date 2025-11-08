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
var __param =
  (this && this.__param) ||
  ((paramIndex, decorator) => (target, key) => {
    decorator(target, key, paramIndex)
  })
var EventBusService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.EventBusService = void 0
const common_1 = require('@nestjs/common')
const microservices_1 = require('@nestjs/microservices')
const event_bus_module_1 = require('./event-bus.module')
let EventBusService = (EventBusService_1 = class EventBusService {
  client
  logger = new common_1.Logger(EventBusService_1.name)
  constructor(client) {
    this.client = client
  }
  async onModuleInit() {
    try {
      await this.client.connect()
      this.logger.log('Successfully connected to the RabbitMQ event bus.')
    } catch (error) {
      this.logger.error('Failed to connect to the RabbitMQ event bus.', error)
    }
  }
  publish(eventName, data) {
    this.logger.log(`Publishing event "${eventName}" to the event bus.`)
    this.client.emit(eventName, data)
  }
})
exports.EventBusService = EventBusService
exports.EventBusService =
  EventBusService =
  EventBusService_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __param(0, (0, common_1.Inject)(event_bus_module_1.NEXUS_EVENT_BUS)),
        __metadata('design:paramtypes', [microservices_1.ClientProxy]),
      ],
      EventBusService
    )
//# sourceMappingURL=event-bus.service.js.map
