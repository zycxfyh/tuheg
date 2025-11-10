import { Module } from '@nestjs/common'
import { DatabaseService } from './database.service'

/**
 * 数据库模块
 * 提供数据库连接和查询功能
 */
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
