// 文件路径: apps/backend-gateway/src/games/games.module.ts

import { Module } from '@nestjs/common'
// [核心修正] 从 @tuheg/common-backend 导入共享模块
import { EventBusModule, PrismaModule } from '@tuheg/common-backend'
import { GamesController } from './games.controller'
import { GamesService } from './games.service'

@Module({
  imports: [
    PrismaModule, // 依赖共享的数据库模块
    EventBusModule, // [核心修正] 依赖共享的事件总线模块，用于发布任务
  ],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
