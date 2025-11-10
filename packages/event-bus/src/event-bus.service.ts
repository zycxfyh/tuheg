// ============================================================================
// 事件总线服务 - 响应式事件驱动架构实现
// Event Bus Service - Reactive Event-Driven Architecture Implementation
// ============================================================================

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Subject, Observable, from, mergeMap, catchError, of } from 'rxjs'
import {
  IEventBus,
  EventHandler,
  EventSubscriptionOptions,
  EventPublishOptions,
  BaseEvent
} from '@tuheg/abstractions'

/**
 * 事件总线服务实现
 * Event Bus Service Implementation
 */
@Injectable()
export class EventBusService implements IEventBus, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name)
  private readonly eventSubjects = new Map<string, Subject<unknown>>()
  private readonly eventHandlers = new Map<string, Array<{ handler: EventHandler<unknown>; options?: EventSubscriptionOptions }>>()
  private readonly eventStreams = new Map<string, Observable<unknown>>()
  private readonly publishStats = new Map<string, number>()

  onModuleDestroy() {
    this.clear()
  }

  /**
   * 发布事件
   */
  async publish<T extends BaseEvent>(event: T, options?: EventPublishOptions): Promise<void> {
    const eventType = this.getEventType(event)
    this.logger.debug(`Publishing event: ${eventType}`, { event, options })

    // 更新发布统计
    const currentCount = this.publishStats.get(eventType) || 0
    this.publishStats.set(eventType, currentCount + 1)

    // 处理延迟发布
    if (options?.delay && options.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, options.delay))
    }

    // 获取或创建事件主题
    const subject = this.getOrCreateSubject(eventType)

    // 发布事件到主题
    subject.next(event)

    // 执行同步事件处理器
    await this.executeHandlers(eventType, event)
  }

  /**
   * 异步发布事件
   */
  publishAsync<T extends BaseEvent>(event: T, options?: EventPublishOptions): void {
    const eventType = this.getEventType(event)
    this.logger.debug(`Publishing event async: ${eventType}`, { event, options })

    // 异步发布，不等待结果
    setImmediate(() => {
      this.publish(event, options).catch(error => {
        this.logger.error(`Failed to publish event ${eventType}`, error)
      })
    })
  }

  /**
   * 订阅事件
   */
  subscribe<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    options?: EventSubscriptionOptions
  ): () => void {
    this.logger.debug(`Subscribing to event: ${eventType}`, { options })

    // 获取或创建事件处理器列表
    const handlers = this.eventHandlers.get(eventType) || []
    const handlerEntry = { handler: handler as EventHandler<unknown>, options }
    handlers.push(handlerEntry)
    this.eventHandlers.set(eventType, handlers)

    // 返回取消订阅函数
    return () => {
      const currentHandlers = this.eventHandlers.get(eventType) || []
      const index = currentHandlers.findIndex(entry => entry.handler === handler)
      if (index > -1) {
        currentHandlers.splice(index, 1)
        if (currentHandlers.length === 0) {
          this.eventHandlers.delete(eventType)
        } else {
          this.eventHandlers.set(eventType, currentHandlers)
        }
        this.logger.debug(`Unsubscribed handler from event: ${eventType}`)
      }
    }
  }

  /**
   * 订阅事件流
   */
  subscribeStream<T = unknown>(
    eventType: string,
    options?: EventSubscriptionOptions
  ): Observable<T> {
    this.logger.debug(`Creating event stream for: ${eventType}`, { options })

    // 检查是否已有缓存的流
    if (this.eventStreams.has(eventType)) {
      return this.eventStreams.get(eventType)! as Observable<T>
    }

    // 创建新的流
    const subject = this.getOrCreateSubject(eventType)
    let stream = subject.asObservable()

    // 应用过滤器
    if (options?.filter) {
      stream = stream.pipe(
        mergeMap(event => {
          if (options.filter!(event)) {
            return of(event)
          }
          return of()
        })
      )
    }

    // 缓存流
    this.eventStreams.set(eventType, stream)

    return stream as Observable<T>
  }

  /**
   * 取消订阅
   */
  unsubscribe<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType) || []
    const index = handlers.findIndex(entry => entry.handler === handler)
    if (index > -1) {
      handlers.splice(index, 1)
      this.logger.debug(`Unsubscribed handler from event: ${eventType}`)
    }
  }

  /**
   * 获取事件统计信息
   */
  getStats(): Promise<{
    totalPublished: number
    totalProcessed: number
    activeSubscriptions: number
    eventTypes: string[]
  }> {
    const totalPublished = Array.from(this.publishStats.values()).reduce((sum, count) => sum + count, 0)
    const activeSubscriptions = Array.from(this.eventSubjects.values())
      .reduce((sum, subject) => sum + subject.observers.length, 0)
    const eventTypes = Array.from(this.eventSubjects.keys())

    return Promise.resolve({
      totalPublished,
      totalProcessed: totalPublished, // 简化为与发布数量相同
      activeSubscriptions,
      eventTypes
    })
  }

  /**
   * 获取事件类型
   */
  private getEventType(event: unknown): string {
    // 如果事件有eventType属性，使用它
    if (event && typeof event === 'object' && 'eventType' in event) {
      return (event as any).eventType
    }

    // 否则使用构造函数名称
    return (event as any)?.constructor?.name || 'UnknownEvent'
  }

  /**
   * 获取或创建事件主题
   */
  private getOrCreateSubject(eventType: string): Subject<unknown> {
    if (!this.eventSubjects.has(eventType)) {
      this.eventSubjects.set(eventType, new Subject<unknown>())
    }
    return this.eventSubjects.get(eventType)!
  }

  /**
   * 执行事件处理器
   */
  private async executeHandlers(eventType: string, event: unknown): Promise<void> {
    const handlers = this.eventHandlers.get(eventType) || []

    if (handlers.length === 0) {
      return
    }

    // 过滤处理器（根据优先级排序）
    const activeHandlers = handlers
      .filter(entry => {
        // 检查过滤条件
        if (entry.options?.filter && !entry.options.filter(event)) {
          return false
        }
        return true
      })
      .sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0))

    // 并行执行所有处理器
    const handlerPromises = activeHandlers.map(entry =>
      from(Promise.resolve(entry.handler(event))).pipe(
        catchError(error => {
          // 处理错误
          if (entry.options?.onError) {
            entry.options.onError(error)
          } else {
            this.logger.error(`Event handler failed for ${eventType}`, error)
          }
          return of(null) // 继续执行其他处理器
        })
      )
    )

    await from(handlerPromises).pipe(
      mergeMap(obs => obs)
    ).toPromise()
  }

  /**
   * 清理所有订阅和处理器
   */
  clear(): void {
    this.eventSubjects.clear()
    this.eventHandlers.clear()
    this.eventStreams.clear()
    this.publishStats.clear()
    this.logger.debug('Event bus cleared')
  }
}
