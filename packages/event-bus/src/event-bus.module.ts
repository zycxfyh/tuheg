import { Module, DynamicModule } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import { EventBusConfig } from './interfaces';

/**
 * 事件总线模块
 * 提供事件驱动架构的核心功能
 */
@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {
  /**
   * 注册事件处理器
   */
  static registerHandlers(handlers: any[]): DynamicModule {
    return {
      module: EventBusModule,
      providers: [
        ...handlers,
        {
          provide: 'EVENT_HANDLERS',
          useValue: handlers,
        },
        {
          provide: EventBusService,
          useFactory: (eventBus: EventBusService, registeredHandlers: any[]) => {
            // 自动注册处理器
            for (const handler of registeredHandlers) {
              if (typeof handler.handle === 'function') {
                // 这里需要根据处理器类型注册到对应的事件类型
                // 这是一个简化的实现
                eventBus.registerHandler('default', handler);
              }
            }
            return eventBus;
          },
          inject: [EventBusService, 'EVENT_HANDLERS'],
        },
      ],
      exports: [EventBusService],
    };
  }

  /**
   * 使用自定义配置
   */
  static forRoot(config?: EventBusConfig): DynamicModule {
    return {
      module: EventBusModule,
      providers: [
        {
          provide: 'EVENT_BUS_CONFIG',
          useValue: config || {},
        },
        EventBusService,
      ],
      exports: [EventBusService],
    };
  }

  /**
   * 使用异步配置
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<EventBusConfig> | EventBusConfig;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    return {
      module: EventBusModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'EVENT_BUS_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        EventBusService,
      ],
      exports: [EventBusService],
    };
  }
}
