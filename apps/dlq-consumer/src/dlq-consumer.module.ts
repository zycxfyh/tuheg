import { Module } from '@nestjs/common'
import { ConfigModule, EventBusModule, PrismaModule } from '@tuheg/infrastructure'
import { DlqConsumerService } from './dlq-consumer.service'

@Module({
  imports: [
    ConfigModule, // 使用共享的类型安全配置模块
    PrismaModule, // 需要数据库访问来存储死信消息
    EventBusModule,
  ],
  providers: [DlqConsumerService],
})
export class DlqConsumerModule {}
