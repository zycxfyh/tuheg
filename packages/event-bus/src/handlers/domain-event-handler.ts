import { Injectable } from '@nestjs/common'
import type { IAggregateRoot, IDomainEvent } from '../interfaces'
import { BaseEventHandler } from './base-event-handler'

/**
 * 领域事件处理器基类
 * 处理领域事件并更新聚合状态
 */
@Injectable()
export abstract class DomainEventHandler<
  TEvent extends IDomainEvent = IDomainEvent,
> extends BaseEventHandler<TEvent> {
  /**
   * 获取聚合类型
   */
  protected abstract getAggregateType(): string

  /**
   * 加载聚合根
   */
  protected abstract loadAggregate(aggregateId: string): Promise<IAggregateRoot>

  /**
   * 保存聚合根
   */
  protected abstract saveAggregate(aggregate: IAggregateRoot): Promise<void>

  protected async process(event: TEvent): Promise<void> {
    // 验证事件属于正确的聚合类型
    if (event.aggregateType !== this.getAggregateType()) {
      throw new Error(
        `Event aggregate type mismatch: expected ${this.getAggregateType()}, got ${event.aggregateType}`
      )
    }

    // 加载聚合根
    const aggregate = await this.loadAggregate(event.aggregateId)

    // 应用事件到聚合
    aggregate.apply(event)

    // 保存聚合状态
    await this.saveAggregate(aggregate)

    // 执行额外的业务逻辑
    await this.handleDomainEvent(event, aggregate)
  }

  /**
   * 处理领域事件的业务逻辑
   * 子类需要实现具体的业务逻辑
   */
  protected abstract handleDomainEvent(event: TEvent, aggregate: IAggregateRoot): Promise<void>
}

/**
 * 投影事件处理器
 * 将领域事件投影到读模型
 */
@Injectable()
export abstract class ProjectionEventHandler<
  TEvent extends IDomainEvent = IDomainEvent,
> extends BaseEventHandler<TEvent> {
  /**
   * 处理投影逻辑
   */
  protected abstract project(event: TEvent): Promise<void>

  protected async process(event: TEvent): Promise<void> {
    await this.project(event)
  }

  protected getHandledEventTypes(): string[] {
    // 从类名或其他元数据推断处理的事件类型
    return [this.getProjectionName()]
  }

  /**
   * 获取投影名称
   */
  protected abstract getProjectionName(): string
}

/**
 * 集成事件发布器
 * 将领域事件转换为集成事件并发布
 */
@Injectable()
export abstract class IntegrationEventPublisher<
  TEvent extends IDomainEvent = IDomainEvent,
> extends BaseEventHandler<TEvent> {
  /**
   * 发布集成事件
   */
  protected abstract publishIntegrationEvent(event: TEvent): Promise<void>

  protected async process(event: TEvent): Promise<void> {
    await this.publishIntegrationEvent(event)
  }

  protected getHandledEventTypes(): string[] {
    return [this.getIntegrationEventType()]
  }

  /**
   * 获取对应的集成事件类型
   */
  protected abstract getIntegrationEventType(): string
}
