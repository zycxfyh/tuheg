import { Injectable, Logger } from '@nestjs/common';
import { IEventHandler, IEvent, IHandlerExecutionContext } from '../interfaces';

/**
 * 基础事件处理器
 * 提供事件处理的通用功能和生命周期管理
 */
@Injectable()
export abstract class BaseEventHandler<TEvent extends IEvent = IEvent> implements IEventHandler<TEvent> {
  protected readonly logger = new Logger(this.constructor.name);

  /** 处理器名称 */
  readonly name?: string;

  /** 处理器优先级 */
  readonly priority?: number;

  /**
   * 处理事件的主入口
   */
  async handle(event: TEvent): Promise<void> {
    const startTime = new Date();

    try {
      this.logger.debug(`Processing event: ${event.eventType}`, {
        eventId: event.eventId,
        correlationId: event.correlationId,
      });

      // 前置处理
      await this.beforeHandle(event);

      // 执行具体处理逻辑
      await this.process(event);

      // 后置处理
      await this.afterHandle(event);

      const duration = Date.now() - startTime.getTime();
      this.logger.debug(`Event processed successfully: ${event.eventType} (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime.getTime();
      this.logger.error(
        `Event processing failed: ${event.eventType} (${duration}ms)`,
        {
          eventId: event.eventId,
          correlationId: event.correlationId,
          error: error.message,
          stack: error.stack,
        }
      );

      // 错误处理
      await this.onError(event, error);

      // 重新抛出错误，让事件总线处理
      throw error;
    }
  }

  /**
   * 具体的处理逻辑，由子类实现
   */
  protected abstract process(event: TEvent): Promise<void>;

  /**
   * 前置处理钩子
   */
  protected async beforeHandle(event: TEvent): Promise<void> {
    // 默认空实现，子类可以重写
  }

  /**
   * 后置处理钩子
   */
  protected async afterHandle(event: TEvent): Promise<void> {
    // 默认空实现，子类可以重写
  }

  /**
   * 错误处理钩子
   */
  protected async onError(event: TEvent, error: Error): Promise<void> {
    // 默认记录错误，子类可以重写
    this.logger.error(`Error processing event ${event.eventType}:`, error);
  }

  /**
   * 检查是否可以处理该事件
   */
  canHandle(event: IEvent): boolean {
    // 默认检查事件类型，子类可以重写
    return this.getHandledEventTypes().includes(event.eventType);
  }

  /**
   * 获取该处理器能处理的事件类型
   */
  protected abstract getHandledEventTypes(): string[];

  /**
   * 获取处理器统计信息
   */
  getStats(): {
    name: string;
    handledEventTypes: string[];
    priority: number;
    totalProcessed: number;
    totalErrors: number;
  } {
    return {
      name: this.name || this.constructor.name,
      handledEventTypes: this.getHandledEventTypes(),
      priority: this.priority || 0,
      totalProcessed: 0, // TODO: 实现计数器
      totalErrors: 0, // TODO: 实现计数器
    };
  }
}

/**
 * 简单事件处理器
 * 对于简单的处理逻辑，可以直接继承此类
 */
export abstract class SimpleEventHandler<TEvent extends IEvent = IEvent> extends BaseEventHandler<TEvent> {
  constructor(private readonly handledTypes: string[]) {
    super();
  }

  protected getHandledEventTypes(): string[] {
    return this.handledTypes;
  }
}

/**
 * 复合事件处理器
 * 可以处理多种类型的事件，根据事件类型分发到不同的处理方法
 */
export abstract class CompositeEventHandler extends BaseEventHandler {
  private readonly eventTypeMap: Map<string, (event: IEvent) => Promise<void>> = new Map();

  constructor() {
    super();
    this.registerEventHandlers();
  }

  /**
   * 注册事件处理器映射
   * 子类需要实现此方法来注册不同事件类型的处理方法
   */
  protected abstract registerEventHandlers(): void;

  /**
   * 注册单个事件类型的处理器
   */
  protected registerHandler(eventType: string, handler: (event: IEvent) => Promise<void>): void {
    this.eventTypeMap.set(eventType, handler);
  }

  protected async process(event: IEvent): Promise<void> {
    const handler = this.eventTypeMap.get(event.eventType);
    if (!handler) {
      throw new Error(`No handler registered for event type: ${event.eventType}`);
    }

    await handler(event);
  }

  protected getHandledEventTypes(): string[] {
    return Array.from(this.eventTypeMap.keys());
  }
}
