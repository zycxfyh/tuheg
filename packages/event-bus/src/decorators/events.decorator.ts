import 'reflect-metadata'

/**
 * 事件元数据键
 */
export const EVENT_TYPE_METADATA = Symbol('EVENT_TYPE')
export const EVENT_VERSION_METADATA = Symbol('EVENT_VERSION')
export const EVENT_SOURCE_METADATA = Symbol('EVENT_SOURCE')

/**
 * 事件装饰器
 * 用于标记类为事件
 */
export function Event(eventType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_TYPE_METADATA, eventType, target)
  }
}

/**
 * 事件版本装饰器
 */
export function EventVersion(version: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_VERSION_METADATA, version, target)
  }
}

/**
 * 事件源装饰器
 */
export function EventSource(source: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_SOURCE_METADATA, source, target)
  }
}

/**
 * 领域事件装饰器
 */
export function DomainEvent(eventType: string, aggregateType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_TYPE_METADATA, `DomainEvent:${eventType}`, target)
    Reflect.defineMetadata('AGGREGATE_TYPE', aggregateType, target)
  }
}

/**
 * 集成事件装饰器
 */
export function IntegrationEvent(eventType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_TYPE_METADATA, `IntegrationEvent:${eventType}`, target)
  }
}

/**
 * 命令事件装饰器
 */
export function Command(commandType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_TYPE_METADATA, `Command:${commandType}`, target)
  }
}

/**
 * 查询事件装饰器
 */
export function Query(queryType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_TYPE_METADATA, `Query:${queryType}`, target)
  }
}

/**
 * 获取事件元数据
 */
export function getEventMetadata(target: any): {
  eventType?: string
  version?: string
  source?: string
  aggregateType?: string
} {
  const eventType = Reflect.getMetadata(EVENT_TYPE_METADATA, target)
  const version = Reflect.getMetadata(EVENT_VERSION_METADATA, target)
  const source = Reflect.getMetadata(EVENT_SOURCE_METADATA, target)
  const aggregateType = Reflect.getMetadata('AGGREGATE_TYPE', target)

  return {
    eventType,
    version,
    source,
    aggregateType,
  }
}

/**
 * 创建事件实例的辅助函数
 */
export function createEventInstance<T extends new (...args: any[]) => any>(
  EventClass: T,
  data: ConstructorParameters<T>[0],
  metadata?: {
    correlationId?: string
    causationId?: string
    source?: string
  }
): InstanceType<T> {
  const eventMetadata = getEventMetadata(EventClass)

  const event = new EventClass(data)

  // 设置事件基本属性
  if (!event.eventId) {
    event.eventId = generateEventId()
  }

  if (!event.timestamp) {
    event.timestamp = new Date()
  }

  if (eventMetadata.eventType && !event.eventType) {
    event.eventType = eventMetadata.eventType
  }

  if (eventMetadata.version && !event.version) {
    event.version = eventMetadata.version
  }

  if ((eventMetadata.source || metadata?.source) && !event.source) {
    event.source = eventMetadata.source || metadata.source
  }

  // 设置相关ID
  if (metadata?.correlationId) {
    event.correlationId = metadata.correlationId
  }

  if (metadata?.causationId) {
    event.causationId = metadata.causationId
  }

  return event
}

/**
 * 生成事件ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 事件工厂类
 */
export class EventFactory {
  /**
   * 创建领域事件
   */
  static createDomainEvent<T extends new (...args: any[]) => any>(
    EventClass: T,
    aggregateId: string,
    data: ConstructorParameters<T>[0],
    metadata?: {
      correlationId?: string
      causationId?: string
      source?: string
      aggregateVersion?: number
    }
  ): InstanceType<T> & { aggregateId: string; aggregateVersion?: number } {
    const event = createEventInstance(EventClass, data, metadata)

    // 设置聚合相关属性
    ;(event as any).aggregateId = aggregateId
    if (metadata?.aggregateVersion) {
      ;(event as any).aggregateVersion = metadata.aggregateVersion
    }

    return event as InstanceType<T> & { aggregateId: string; aggregateVersion?: number }
  }

  /**
   * 创建集成事件
   */
  static createIntegrationEvent<T extends new (...args: any[]) => any>(
    EventClass: T,
    data: ConstructorParameters<T>[0],
    metadata?: {
      correlationId?: string
      causationId?: string
      source?: string
      targetService?: string
      routingKey?: string
    }
  ): InstanceType<T> & { targetService?: string; routingKey?: string } {
    const event = createEventInstance(EventClass, data, metadata)

    // 设置集成事件相关属性
    if (metadata?.targetService) {
      ;(event as any).targetService = metadata.targetService
    }

    if (metadata?.routingKey) {
      ;(event as any).routingKey = metadata.routingKey
    }

    return event as InstanceType<T> & { targetService?: string; routingKey?: string }
  }
}
