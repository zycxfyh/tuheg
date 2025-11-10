/**
 * 基础事件接口
 */
export interface IEvent {
  /** 事件ID */
  readonly eventId: string;

  /** 事件类型 */
  readonly eventType: string;

  /** 事件时间戳 */
  readonly timestamp: Date;

  /** 事件版本 */
  readonly version?: string;

  /** 事件源 */
  readonly source?: string;

  /** 相关实体ID */
  readonly correlationId?: string;

  /** 因果链ID */
  readonly causationId?: string;

  /** 事件数据 */
  readonly data: any;

  /** 事件元数据 */
  readonly metadata?: Record<string, any>;
}

/**
 * 事件处理器接口
 */
export interface IEventHandler<T = any> {
  /** 处理事件 */
  handle(event: T): void | Promise<void>;

  /** 处理器优先级 */
  priority?: number;

  /** 处理器名称 */
  name?: string;
}

/**
 * 事件发布器接口
 */
export interface IEventPublisher {
  /** 发布事件 */
  publish(event: any): Promise<void>;

  /** 异步发布事件 */
  publishAsync(event: any): void;
}

/**
 * 事件订阅器接口
 */
export interface IEventSubscriber {
  /** 订阅事件 */
  subscribe<T>(eventType: string, handler: (event: T) => void | Promise<void>): () => void;

  /** 订阅事件流 */
  subscribeStream<T>(eventType: string): import('rxjs').Observable<T>;

  /** 取消订阅 */
  unsubscribe<T>(eventType: string, handler: (event: T) => void | Promise<void>): void;
}

/**
 * 事件中间件接口
 */
export interface IEventMiddleware {
  /** 执行中间件 */
  execute(event: any, next: () => Promise<void>): Promise<void>;
}

/**
 * 事件过滤器接口
 */
export interface IEventFilter {
  /** 过滤事件 */
  filter(event: any): boolean;

  /** 过滤器名称 */
  name?: string;
}

/**
 * 事件存储接口
 */
export interface IEventStore {
  /** 保存事件 */
  save(event: IEvent): Promise<void>;

  /** 获取事件 */
  get(eventId: string): Promise<IEvent | null>;

  /** 获取事件流 */
  getStream(aggregateId: string, fromVersion?: number): Promise<IEvent[]>;

  /** 获取所有事件 */
  getAll(fromId?: string, limit?: number): Promise<IEvent[]>;
}

/**
 * 聚合根接口
 */
export interface IAggregateRoot {
  /** 聚合ID */
  id: string;

  /** 当前版本 */
  version: number;

  /** 未提交的事件 */
  uncommittedEvents: IEvent[];

  /** 应用事件 */
  apply(event: IEvent): void;

  /** 标记变更 */
  markChangesAsCommitted(): void;

  /** 加载从历史 */
  loadFromHistory(events: IEvent[]): void;
}

/**
 * 领域事件接口
 */
export interface IDomainEvent extends IEvent {
  /** 聚合ID */
  aggregateId: string;

  /** 聚合类型 */
  aggregateType: string;

  /** 事件版本 */
  aggregateVersion: number;
}

/**
 * 集成事件接口
 */
export interface IIntegrationEvent extends IEvent {
  /** 目标服务 */
  targetService?: string;

  /** 事件路由键 */
  routingKey?: string;

  /** 重试次数 */
  retryCount?: number;

  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 事件总线配置
 */
export interface EventBusConfig {
  /** 是否启用事件存储 */
  enableEventStore?: boolean;

  /** 是否启用事件重播 */
  enableEventReplay?: boolean;

  /** 中间件列表 */
  middlewares?: IEventMiddleware[];

  /** 过滤器列表 */
  filters?: IEventFilter[];

  /** 事件处理超时时间(毫秒) */
  handlerTimeout?: number;

  /** 是否启用死信队列 */
  enableDeadLetterQueue?: boolean;

  /** 死信队列配置 */
  deadLetterQueue?: {
    maxRetries: number;
    retryDelay: number;
    queueName: string;
  };
}
