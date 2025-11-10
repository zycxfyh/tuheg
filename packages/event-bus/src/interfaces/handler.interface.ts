import { IEventHandler, IEvent } from './event.interface';

/**
 * 命令处理器接口
 */
export interface ICommandHandler<TCommand = any, TResult = any> extends IEventHandler {
  /** 执行命令 */
  execute(command: TCommand): Promise<TResult>;

  /** 命令类型 */
  commandType: string;
}

/**
 * 查询处理器接口
 */
export interface IQueryHandler<TQuery = any, TResult = any> extends IEventHandler {
  /** 执行查询 */
  query(query: TQuery): Promise<TResult>;

  /** 查询类型 */
  queryType: string;
}

/**
 * 领域事件处理器接口
 */
export interface IDomainEventHandler<TEvent extends IEvent = IEvent> extends IEventHandler<TEvent> {
  /** 处理领域事件 */
  handle(event: TEvent): Promise<void>;

  /** 事件类型 */
  eventType: string;

  /** 处理器优先级 */
  priority?: number;
}

/**
 * 集成事件处理器接口
 */
export interface IIntegrationEventHandler<TEvent extends IEvent = IEvent> extends IEventHandler<TEvent> {
  /** 处理集成事件 */
  handle(event: TEvent): Promise<void>;

  /** 事件类型 */
  eventType: string;

  /** 来源服务 */
  sourceService?: string;
}

/**
 * Saga处理器接口 (用于处理长事务)
 */
export interface ISagaHandler<TEvent extends IEvent = IEvent> extends IEventHandler<TEvent> {
  /** 处理Saga事件 */
  handle(event: TEvent): Promise<void>;

  /** Saga ID */
  sagaId: string;

  /** 当前状态 */
  currentState: string;

  /** 关联ID */
  correlationId: string;
}

/**
 * 事件处理器注册表接口
 */
export interface IEventHandlerRegistry {
  /** 注册处理器 */
  register<T>(eventType: string, handler: IEventHandler<T>): void;

  /** 注销处理器 */
  unregister<T>(eventType: string, handler: IEventHandler<T>): void;

  /** 获取处理器 */
  getHandlers<T>(eventType: string): IEventHandler<T>[];

  /** 获取所有处理器 */
  getAllHandlers(): Map<string, IEventHandler<any>[]>;

  /** 清除所有处理器 */
  clear(): void;
}

/**
 * 处理器执行上下文
 */
export interface IHandlerExecutionContext {
  /** 事件 */
  event: IEvent;

  /** 处理器 */
  handler: IEventHandler;

  /** 开始时间 */
  startTime: Date;

  /** 结束时间 */
  endTime?: Date;

  /** 执行结果 */
  result?: any;

  /** 错误 */
  error?: Error;

  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 处理器执行管道接口
 */
export interface IHandlerExecutionPipeline {
  /** 执行处理器管道 */
  execute(context: IHandlerExecutionContext): Promise<void>;

  /** 添加中间件 */
  use(middleware: IHandlerExecutionMiddleware): void;

  /** 移除中间件 */
  remove(middleware: IHandlerExecutionMiddleware): void;
}

/**
 * 处理器执行中间件接口
 */
export interface IHandlerExecutionMiddleware {
  /** 执行中间件 */
  execute(context: IHandlerExecutionContext, next: () => Promise<void>): Promise<void>;

  /** 中间件名称 */
  name?: string;

  /** 中间件优先级 */
  priority?: number;
}
