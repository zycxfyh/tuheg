import { OnModuleInit } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
export declare class EventBusService implements OnModuleInit {
  private readonly client
  private readonly logger
  constructor(client: ClientProxy)
  onModuleInit(): Promise<void>
  publish(eventName: string, data: any): void
}
//# sourceMappingURL=event-bus.service.d.ts.map
