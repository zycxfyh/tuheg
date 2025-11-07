// 文件路径: packages/common-backend/src/plugins/vcp-plugin-system.module.ts
// 职责: VCPToolBox 插件协议系统的 NestJS 模块

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { VcpPluginSystemService } from './vcp-plugin-system.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [VcpPluginSystemService],
  exports: [VcpPluginSystemService],
})
export class VcpPluginSystemModule {}
