import { Injectable } from '@nestjs/common';
import { IIntegrationEvent } from '../interfaces';
import { BaseEventHandler } from './base-event-handler';

/**
 * 集成事件处理器基类
 * 处理来自其他服务的集成事件
 */
@Injectable()
export abstract class IntegrationEventHandler<TEvent extends IIntegrationEvent = IIntegrationEvent>
  extends BaseEventHandler<TEvent> {

  protected async process(event: TEvent): Promise<void> {
    // 验证事件来源
    if (!this.isValidSource(event)) {
      throw new Error(`Invalid event source: ${event.source}`);
    }

    // 检查事件版本兼容性
    if (!this.isVersionCompatible(event)) {
      this.logger.warn(`Event version not compatible: ${event.version}`);
      // 可以选择跳过处理或执行降级逻辑
      return;
    }

    // 幂等性检查
    if (await this.isEventProcessed(event)) {
      this.logger.debug(`Event already processed: ${event.eventId}`);
      return;
    }

    // 执行具体处理逻辑
    await this.handleIntegrationEvent(event);

    // 标记事件为已处理
    await this.markEventProcessed(event);
  }

  /**
   * 处理集成事件的业务逻辑
   * 子类需要实现具体的业务逻辑
   */
  protected abstract handleIntegrationEvent(event: TEvent): Promise<void>;

  /**
   * 验证事件来源是否有效
   */
  protected isValidSource(event: TEvent): boolean {
    const allowedSources = this.getAllowedSources();
    return allowedSources.length === 0 || allowedSources.includes(event.source || '');
  }

  /**
   * 获取允许的事件来源列表
   */
  protected getAllowedSources(): string[] {
    return []; // 默认允许所有来源，子类可以重写
  }

  /**
   * 检查事件版本是否兼容
   */
  protected isVersionCompatible(event: TEvent): boolean {
    const currentVersion = this.getSupportedVersion();
    if (!currentVersion) return true;

    // 简单的版本比较逻辑
    return event.version === currentVersion;
  }

  /**
   * 获取支持的事件版本
   */
  protected getSupportedVersion(): string | null {
    return null; // 默认支持所有版本，子类可以重写
  }

  /**
   * 检查事件是否已经处理过
   */
  protected async isEventProcessed(event: TEvent): Promise<boolean> {
    // 默认实现简单的内存检查，实际应该使用持久化存储
    const processedEvents = this.getProcessedEvents();
    return processedEvents.has(event.eventId);
  }

  /**
   * 标记事件为已处理
   */
  protected async markEventProcessed(event: TEvent): Promise<void> {
    const processedEvents = this.getProcessedEvents();
    processedEvents.add(event.eventId);

    // 限制内存中的事件数量
    if (processedEvents.size > 10000) {
      // 清理最旧的事件
      const eventsArray = Array.from(processedEvents);
      processedEvents.clear();
      processedEvents.add(eventsArray[eventsArray.length - 1]); // 保留最新的
    }
  }

  /**
   * 获取已处理事件集合
   * 这里使用简单的内存存储，实际应该使用Redis或其他持久化存储
   */
  private getProcessedEvents(): Set<string> {
    const key = `processed_events_${this.constructor.name}`;
    if (!global[key]) {
      global[key] = new Set<string>();
    }
    return global[key] as Set<string>;
  }

  protected getHandledEventTypes(): string[] {
    return [this.getEventType()];
  }

  /**
   * 获取处理的事件类型
   */
  protected abstract getEventType(): string;
}

/**
 * 外部服务集成处理器
 * 处理来自外部服务的集成事件
 */
@Injectable()
export abstract class ExternalServiceHandler<TEvent extends IIntegrationEvent = IIntegrationEvent>
  extends IntegrationEventHandler<TEvent> {

  /**
   * 获取外部服务名称
   */
  protected abstract getExternalServiceName(): string;

  /**
   * 验证外部服务签名或认证
   */
  protected async validateExternalAuth(event: TEvent): Promise<boolean> {
    // 默认实现，子类可以重写以实现具体的认证逻辑
    return true;
  }

  protected async process(event: TEvent): Promise<void> {
    // 先验证外部服务认证
    if (!(await this.validateExternalAuth(event))) {
      throw new Error(`Authentication failed for external service: ${this.getExternalServiceName()}`);
    }

    // 调用父类处理逻辑
    await super.process(event);
  }

  protected getAllowedSources(): string[] {
    return [this.getExternalServiceName()];
  }
}

/**
 * 死信队列处理器
 * 处理失败的集成事件
 */
@Injectable()
export abstract class DeadLetterHandler<TEvent extends IIntegrationEvent = IIntegrationEvent>
  extends IntegrationEventHandler<TEvent> {

  protected async handleIntegrationEvent(event: TEvent): Promise<void> {
    this.logger.warn(`Processing dead letter event: ${event.eventType}`, {
      eventId: event.eventId,
      originalSource: event.source,
      retryCount: event.retryCount,
      error: event.metadata?.error,
    });

    // 记录失败事件
    await this.recordFailedEvent(event);

    // 执行补偿逻辑
    await this.compensate(event);

    // 可选：发送告警通知
    await this.sendFailureNotification(event);
  }

  /**
   * 记录失败事件
   */
  protected abstract recordFailedEvent(event: TEvent): Promise<void>;

  /**
   * 执行补偿逻辑
   */
  protected async compensate(event: TEvent): Promise<void> {
    // 默认空实现，子类可以重写
    this.logger.debug(`No compensation logic for dead letter event: ${event.eventType}`);
  }

  /**
   * 发送失败通知
   */
  protected async sendFailureNotification(event: TEvent): Promise<void> {
    // 默认空实现，子类可以重写
    this.logger.warn(`Dead letter event notification: ${event.eventType}`);
  }

  protected getEventType(): string {
    return 'DeadLetter';
  }
}
