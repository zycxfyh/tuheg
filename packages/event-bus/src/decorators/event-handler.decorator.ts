import 'reflect-metadata'
import type { IEventHandler } from '../interfaces'

/**
 * 事件处理器元数据键
 */
export const EVENT_HANDLER_METADATA = Symbol('EVENT_HANDLER')
export const EVENT_HANDLER_TYPE_METADATA = Symbol('EVENT_HANDLER_TYPE')
export const EVENT_HANDLER_PRIORITY_METADATA = Symbol('EVENT_HANDLER_PRIORITY')

/**
 * 事件处理器装饰器
 * 用于标记类为事件处理器
 */
export function EventHandler(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, true, target)
  }
}

/**
 * 事件类型装饰器
 * 指定处理器处理的事件类型
 */
export function HandlesEvent(eventType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_TYPE_METADATA, eventType, target)
  }
}

/**
 * 处理器优先级装饰器
 * 指定处理器的执行优先级
 */
export function HandlerPriority(priority: number): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_PRIORITY_METADATA, priority, target)
  }
}

/**
 * 命令处理器装饰器
 */
export function CommandHandler(commandType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, true, target)
    Reflect.defineMetadata(EVENT_HANDLER_TYPE_METADATA, `Command:${commandType}`, target)
  }
}

/**
 * 查询处理器装饰器
 */
export function QueryHandler(queryType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, true, target)
    Reflect.defineMetadata(EVENT_HANDLER_TYPE_METADATA, `Query:${queryType}`, target)
  }
}

/**
 * 领域事件处理器装饰器
 */
export function DomainEventHandler(eventType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, true, target)
    Reflect.defineMetadata(EVENT_HANDLER_TYPE_METADATA, `DomainEvent:${eventType}`, target)
  }
}

/**
 * 集成事件处理器装饰器
 */
export function IntegrationEventHandler(eventType: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, true, target)
    Reflect.defineMetadata(EVENT_HANDLER_TYPE_METADATA, `IntegrationEvent:${eventType}`, target)
  }
}

/**
 * 获取处理器元数据
 */
export function getEventHandlerMetadata(target: any): {
  isEventHandler: boolean
  eventType?: string
  priority?: number
} {
  const isEventHandler = Reflect.getMetadata(EVENT_HANDLER_METADATA, target) === true
  const eventType = Reflect.getMetadata(EVENT_HANDLER_TYPE_METADATA, target)
  const priority = Reflect.getMetadata(EVENT_HANDLER_PRIORITY_METADATA, target)

  return {
    isEventHandler,
    eventType,
    priority,
  }
}

/**
 * 自动发现事件处理器
 * 扫描模块中的所有事件处理器
 */
export function discoverEventHandlers(module: any): Array<{
  handler: new (...args: any[]) => IEventHandler
  eventType: string
  priority: number
}> {
  const handlers: Array<{
    handler: new (...args: any[]) => IEventHandler
    eventType: string
    priority: number
  }> = []

  // 获取模块中所有的提供者
  const providers = Reflect.getMetadata('providers', module) || []

  for (const provider of providers) {
    const metadata = getEventHandlerMetadata(provider)

    if (metadata.isEventHandler && metadata.eventType) {
      handlers.push({
        handler: provider,
        eventType: metadata.eventType,
        priority: metadata.priority || 0,
      })
    }
  }

  // 按优先级排序
  return handlers.sort((a, b) => b.priority - a.priority)
}
