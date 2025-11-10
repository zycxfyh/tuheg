import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EventBusModule } from '@tuheg/infrastructure'
import { GatewayController } from './gateway.controller'
import { GatewayEventsController } from './gateway.events.controller'
import { UpdatesGateway } from './updates.gateway'

@Module({
  imports: [EventBusModule],
  controllers: [GatewayController, GatewayEventsController],
  providers: [
    UpdatesGateway,
    {
      provide: 'ConfigService',
      useExisting: ConfigService,
    },
  ],
  exports: [UpdatesGateway],
})
export class GatewayModule {}
