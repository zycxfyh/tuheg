import { Observable } from 'rxjs'

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 请求消息 */
  REQUEST = 'request',
  /** 响应消息 */
  RESPONSE = 'response',
  /** 通知消息 */
  NOTIFICATION = 'notification',
  /** 错误消息 */
  ERROR = 'error',
  /** 事件消息 */
  EVENT = 'event'
}

/**
 * 消息优先级
 */
export enum MessagePriority {
  /** 低优先级 */
  LOW = 0,
  /** 普通优先级 */
  NORMAL = 1,
  /** 高优先级 */
  HIGH = 2,
  /** 紧急优先级 */
  URGENT = 3
}

/**
 * 插件消息
 */
export interface PluginMessage {
  /** 消息ID */
  id: string
  /** 消息类型 */
  type: MessageType
  /** 发送者插件ID */
  from: string
  /** 接收者插件ID（为空表示广播） */
  to?: string
  /** 消息主题 */
  topic: string
  /** 消息负载 */
  payload: any
  /** 消息优先级 */
  priority?: MessagePriority
  /** 时间戳 */
  timestamp: Date
  /** 相关ID（用于请求-响应配对） */
  correlationId?: string
  /** 消息头 */
  headers?: Record<string, any>
}

/**
 * 插件通信接口
 */
export interface PluginCommunication {
  /** 发送消息 */
  send(message: Omit<PluginMessage, 'id' | 'timestamp' | 'from'>): Promise<void>

  /** 发送请求并等待响应 */
  request(message: Omit<PluginMessage, 'id' | 'timestamp' | 'from' | 'type'>, timeout?: number): Promise<any>

  /** 广播消息 */
  broadcast(topic: string, payload: any, priority?: MessagePriority): Promise<void>

  /** 订阅消息 */
  subscribe(topic: string, handler: MessageHandler): Subscription

  /** 订阅特定插件的消息 */
  subscribeFrom(from: string, topic: string, handler: MessageHandler): Subscription

  /** 取消订阅 */
  unsubscribe(subscription: Subscription): void

  /** 获取通信统计 */
  getStats(): CommunicationStats
}

/**
 * 消息处理器
 */
export type MessageHandler = (message: PluginMessage) => Promise<void> | void

/**
 * 订阅对象
 */
export interface Subscription {
  /** 订阅ID */
  id: string
  /** 取消订阅 */
  unsubscribe(): void
}

/**
 * 通信统计
 */
export interface CommunicationStats {
  /** 总消息数 */
  totalMessages: number
  /** 消息类型分布 */
  messageTypes: Record<MessageType, number>
  /** 活跃订阅数 */
  activeSubscriptions: number
  /** 等待响应的请求数 */
  pendingRequests: number
  /** 平均响应时间（毫秒） */
  averageResponseTime: number
  /** 错误消息数 */
  errorMessages: number
}

/**
 * 插件RPC接口
 */
export interface PluginRPC {
  /** 注册RPC方法 */
  registerMethod(name: string, handler: RPCHandler): void

  /** 注销RPC方法 */
  unregisterMethod(name: string): void

  /** 调用远程方法 */
  call(method: string, params: any[], target?: string, timeout?: number): Promise<any>

  /** 获取注册的方法列表 */
  getRegisteredMethods(): string[]

  /** 获取RPC统计 */
  getStats(): RPCStats
}

/**
 * RPC处理器
 */
export type RPCHandler = (params: any[]) => Promise<any> | any

/**
 * RPC统计
 */
export interface RPCStats {
  /** 注册的方法数 */
  registeredMethods: number
  /** 总调用数 */
  totalCalls: number
  /** 成功调用数 */
  successfulCalls: number
  /** 失败调用数 */
  failedCalls: number
  /** 平均执行时间 */
  averageExecutionTime: number
  /** 超时调用数 */
  timeoutCalls: number
}

/**
 * 插件事件系统
 */
export interface PluginEventSystem {
  /** 发布事件 */
  emit(event: string, data?: any, target?: string): Promise<void>

  /** 订阅事件 */
  on(event: string, handler: EventHandler): Subscription

  /** 订阅一次性事件 */
  once(event: string, handler: EventHandler): Subscription

  /** 取消事件订阅 */
  off(subscription: Subscription): void

  /** 获取事件统计 */
  getStats(): EventStats
}

/**
 * 事件处理器
 */
export type EventHandler = (data: any, event: string) => Promise<void> | void

/**
 * 事件统计
 */
export interface EventStats {
  /** 总事件数 */
  totalEvents: number
  /** 事件类型分布 */
  eventTypes: Record<string, number>
  /** 活跃监听器数 */
  activeListeners: number
  /** 平均事件处理时间 */
  averageProcessingTime: number
}

/**
 * 插件数据共享接口
 */
export interface PluginDataSharing {
  /** 设置共享数据 */
  setSharedData(key: string, value: any, scope?: DataScope): Promise<void>

  /** 获取共享数据 */
  getSharedData(key: string, scope?: DataScope): Promise<any>

  /** 删除共享数据 */
  removeSharedData(key: string, scope?: DataScope): Promise<void>

  /** 订阅数据变化 */
  subscribeToData(key: string, handler: DataChangeHandler, scope?: DataScope): Subscription

  /** 获取数据统计 */
  getStats(): DataStats
}

/**
 * 数据作用域
 */
export enum DataScope {
  /** 全局作用域 */
  GLOBAL = 'global',
  /** 插件作用域 */
  PLUGIN = 'plugin',
  /** 用户作用域 */
  USER = 'user',
  /** 会话作用域 */
  SESSION = 'session'
}

/**
 * 数据变化处理器
 */
export type DataChangeHandler = (newValue: any, oldValue: any, key: string) => Promise<void> | void

/**
 * 数据统计
 */
export interface DataStats {
  /** 总数据项数 */
  totalItems: number
  /** 数据大小（字节） */
  totalSize: number
  /** 作用域分布 */
  scopeDistribution: Record<DataScope, number>
  /** 活跃订阅数 */
  activeSubscriptions: number
}

/**
 * 插件存储接口
 */
export interface PluginStorage {
  /** 存储数据 */
  set(key: string, value: any): Promise<void>

  /** 获取数据 */
  get<T = any>(key: string): Promise<T | null>

  /** 删除数据 */
  remove(key: string): Promise<void>

  /** 检查键是否存在 */
  has(key: string): Promise<boolean>

  /** 获取所有键 */
  keys(): Promise<string[]>

  /** 清空存储 */
  clear(): Promise<void>

  /** 获取存储统计 */
  getStats(): StorageStats
}

/**
 * 存储统计
 */
export interface StorageStats {
  /** 总项目数 */
  totalItems: number
  /** 总大小（字节） */
  totalSize: number
  /** 上次修改时间 */
  lastModified: Date
}

/**
 * 插件API接口
 */
export interface PluginAPI {
  /** 通信接口 */
  communication: PluginCommunication

  /** RPC接口 */
  rpc: PluginRPC

  /** 事件系统 */
  events: PluginEventSystem

  /** 数据共享 */
  dataSharing: PluginDataSharing

  /** 存储接口 */
  storage: PluginStorage

  /** 获取API信息 */
  getInfo(): {
    version: string
    supportedFeatures: string[]
    limits: Record<string, any>
  }
}
