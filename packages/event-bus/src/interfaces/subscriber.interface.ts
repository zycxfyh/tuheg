import { Observable } from 'rxjs';
import { IEvent, IEventHandler } from './event.interface';

/**
 * 事件订阅器接口
 */
export interface IEventSubscriber {
  /** 订阅事件 */
  subscribe<T extends IEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void;

  /** 订阅事件流 */
  subscribeStream<T extends IEvent>(eventType: string): Observable<T>;

  /** 取消订阅 */
  unsubscribe<T extends IEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): void;

  /** 批量订阅 */
  subscribeMany(subscriptions: Array<{
    eventType: string;
    handler: (event: any) => void | Promise<void>;
  }>): () => void;

  /** 取消所有订阅 */
  unsubscribeAll(): void;
}

/**
 * 动态事件订阅器接口
 */
export interface IDynamicEventSubscriber extends IEventSubscriber {
  /** 动态订阅模式 */
  subscribePattern(
    pattern: string,
    handler: (event: IEvent) => void | Promise<void>
  ): () => void;

  /** 订阅条件 */
  subscribeConditional(
    condition: (event: IEvent) => boolean,
    handler: (event: IEvent) => void | Promise<void>
  ): () => void;
}

/**
 * 持久化事件订阅器接口
 */
export interface IPersistentEventSubscriber extends IEventSubscriber {
  /** 获取订阅状态 */
  getSubscriptionStatus(eventType: string): Promise<{
    isSubscribed: boolean;
    lastProcessedEventId?: string;
    lastProcessedAt?: Date;
  }>;

  /** 重置订阅位置 */
  resetSubscription(eventType: string, eventId?: string): Promise<void>;

  /** 获取订阅统计 */
  getSubscriptionStats(): Promise<Record<string, {
    eventCount: number;
    errorCount: number;
    lastProcessedAt: Date;
  }>>;
}

/**
 * 事件消费者接口
 */
export interface IEventConsumer {
  /** 启动消费者 */
  start(): Promise<void>;

  /** 停止消费者 */
  stop(): Promise<void>;

  /** 获取消费者状态 */
  getStatus(): Promise<{
    isRunning: boolean;
    activeSubscriptions: number;
    processedEvents: number;
    failedEvents: number;
  }>;

  /** 健康检查 */
  healthCheck(): Promise<boolean>;
}

/**
 * 事件订阅配置
 */
export interface EventSubscriptionConfig {
  /** 事件类型 */
  eventType: string;

  /** 处理器 */
  handler: IEventHandler;

  /** 订阅选项 */
  options?: {
    /** 重试配置 */
    retry?: {
      maxAttempts: number;
      delay: number;
      backoffMultiplier: number;
    };

    /** 并发限制 */
    concurrency?: number;

    /** 超时时间 */
    timeout?: number;

    /** 错误处理策略 */
    errorHandling?: 'ignore' | 'log' | 'throw' | 'dead-letter';

    /** 死信队列配置 */
    deadLetterQueue?: {
      enabled: boolean;
      queueName: string;
      maxRetries: number;
    };
  };
}

/**
 * 订阅管理器接口
 */
export interface ISubscriptionManager {
  /** 添加订阅 */
  addSubscription(config: EventSubscriptionConfig): Promise<void>;

  /** 移除订阅 */
  removeSubscription(eventType: string, handlerName?: string): Promise<void>;

  /** 获取订阅列表 */
  getSubscriptions(): Promise<EventSubscriptionConfig[]>;

  /** 更新订阅配置 */
  updateSubscription(eventType: string, updates: Partial<EventSubscriptionConfig>): Promise<void>;

  /** 启用订阅 */
  enableSubscription(eventType: string): Promise<void>;

  /** 禁用订阅 */
  disableSubscription(eventType: string): Promise<void>;
}

/**
 * 事件过滤订阅器接口
 */
export interface IFilteredEventSubscriber extends IEventSubscriber {
  /** 订阅过滤后的事件 */
  subscribeFiltered<T extends IEvent>(
    eventType: string,
    filter: (event: T) => boolean,
    handler: (event: T) => void | Promise<void>
  ): () => void;

  /** 订阅采样事件 */
  subscribeSampled<T extends IEvent>(
    eventType: string,
    sampleRate: number, // 0-1
    handler: (event: T) => void | Promise<void>
  ): () => void;
}

/**
 * 事件缓冲订阅器接口
 */
export interface IBufferedEventSubscriber extends IEventSubscriber {
  /** 订阅缓冲事件 */
  subscribeBuffered<T extends IEvent>(
    eventType: string,
    bufferSize: number,
    bufferTime: number, // 毫秒
    handler: (events: T[]) => void | Promise<void>
  ): () => void;

  /** 刷新缓冲区 */
  flushBuffer(eventType: string): Promise<void>;
}
