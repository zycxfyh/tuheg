import { Module } from '@nestjs/common'
import { PluginProtocolManager } from './plugin-protocol-manager.service'
// 导入其他服务实现（这些将在后续实现中创建）
import { PluginLifecycleManagerImpl } from './implementations/plugin-lifecycle-manager.impl'
import { PluginValidatorImpl } from './implementations/plugin-validator.impl'
import { PluginCommunicationImpl } from './implementations/plugin-communication.impl'
import { PluginRPCImpl } from './implementations/plugin-rpc.impl'
import { PluginEventSystemImpl } from './implementations/plugin-event-system.impl'
import { PluginDataSharingImpl } from './implementations/plugin-data-sharing.impl'
import { PluginStorageImpl } from './implementations/plugin-storage.impl'
import { PluginMetadataManagerImpl } from './implementations/plugin-metadata-manager.impl'
import { PluginDependencyManagerImpl } from './implementations/plugin-dependency-manager.impl'

/**
 * 插件标准协议模块
 *
 * 提供完整的插件标准化协议实现，包括：
 * - 插件生命周期管理
 * - 插件验证和沙箱
 * - 插件通信协议
 * - 类型安全的元数据系统
 * - 插件依赖管理
 */
@Module({
  providers: [
    // 协议管理器
    {
      provide: PluginProtocolManager,
      useFactory: (
        lifecycleManager: PluginLifecycleManagerImpl,
        validator: PluginValidatorImpl,
        communication: PluginCommunicationImpl,
        rpc: PluginRPCImpl,
        events: PluginEventSystemImpl,
        dataSharing: PluginDataSharingImpl,
        storage: PluginStorageImpl,
        metadataManager: PluginMetadataManagerImpl,
        dependencyManager: PluginDependencyManagerImpl
      ) => {
        return new PluginProtocolManager({
          lifecycleManager,
          validator,
          communication,
          rpc,
          events,
          dataSharing,
          storage,
          metadataManager,
          dependencyManager
        })
      },
      inject: [
        PluginLifecycleManagerImpl,
        PluginValidatorImpl,
        PluginCommunicationImpl,
        PluginRPCImpl,
        PluginEventSystemImpl,
        PluginDataSharingImpl,
        PluginStorageImpl,
        PluginMetadataManagerImpl,
        PluginDependencyManagerImpl
      ]
    },

    // 核心服务实现
    PluginLifecycleManagerImpl,
    PluginValidatorImpl,
    PluginCommunicationImpl,
    PluginRPCImpl,
    PluginEventSystemImpl,
    PluginDataSharingImpl,
    PluginStorageImpl,
    PluginMetadataManagerImpl,
    PluginDependencyManagerImpl
  ],
  exports: [
    PluginProtocolManager,
    PluginLifecycleManagerImpl,
    PluginValidatorImpl,
    PluginCommunicationImpl,
    PluginRPCImpl,
    PluginEventSystemImpl,
    PluginDataSharingImpl,
    PluginStorageImpl,
    PluginMetadataManagerImpl,
    PluginDependencyManagerImpl
  ]
})
export class PluginProtocolModule {}
