import { IEvent } from './event.interface';

/**
 * 事件发布器接口
 */
export interface IEventPublisher {
  /** 发布单个事件 */
  publish(event: IEvent): Promise<void>;

  /** 发布多个事件 */
  publishMany(events: IEvent[]): Promise<void>;

  /** 异步发布事件 */
  publishAsync(event: IEvent): void;

  /** 批量异步发布事件 */
  publishManyAsync(events: IEvent[]): void;
}

/**
 * 聚合事件发布器接口
 */
export interface IAggregateEventPublisher {
  /** 发布聚合事件 */
  publishAggregateEvents(aggregateId: string, events: IEvent[]): Promise<void>;

  /** 合并发布事件 */
  mergePublish(events: IEvent[]): Promise<void>;
}

/**
 * 延迟事件发布器接口
 */
export interface IDelayedEventPublisher {
  /** 延迟发布事件 */
  publishDelayed(event: IEvent, delay: number): Promise<void>;

  /** 取消延迟发布 */
  cancelDelayed(eventId: string): Promise<void>;
}

/**
 * 条件事件发布器接口
 */
export interface IConditionalEventPublisher {
  /** 条件发布事件 */
  publishIf(condition: () => boolean | Promise<boolean>, event: IEvent): Promise<void>;

  /** 条件发布多个事件 */
  publishManyIf(condition: () => boolean | Promise<boolean>, events: IEvent[]): Promise<void>;
}

/**
 * 事务事件发布器接口
 */
export interface ITransactionalEventPublisher {
  /** 开始事务 */
  beginTransaction(): Promise<void>;

  /** 发布事件到事务 */
  publishInTransaction(event: IEvent): Promise<void>;

  /** 提交事务 */
  commitTransaction(): Promise<void>;

  /** 回滚事务 */
  rollbackTransaction(): Promise<void>;
}

/**
 * 事件发布策略接口
 */
export interface IEventPublishingStrategy {
  /** 发布策略名称 */
  name: string;

  /** 执行发布策略 */
  publish(event: IEvent, publisher: IEventPublisher): Promise<void>;

  /** 是否支持事件类型 */
  supports(event: IEvent): boolean;
}

/**
 * 事件发布中间件接口
 */
export interface IEventPublishingMiddleware {
  /** 执行发布中间件 */
  execute(event: IEvent, next: () => Promise<void>): Promise<void>;

  /** 中间件名称 */
  name?: string;

  /** 中间件优先级 */
  priority?: number;
}

/**
 * 事件发布管道接口
 */
export interface IEventPublishingPipeline {
  /** 执行发布管道 */
  execute(event: IEvent): Promise<void>;

  /** 添加中间件 */
  use(middleware: IEventPublishingMiddleware): void;

  /** 移除中间件 */
  remove(middleware: IEventPublishingMiddleware): void;

  /** 设置发布策略 */
  setStrategy(strategy: IEventPublishingStrategy): void;
}
