import { Injectable } from '@nestjs/common'
import { PluginEventSystem, EventHandler, Subscription, EventStats } from '../plugin-communication.interface'

@Injectable()
export class PluginEventSystemImpl implements PluginEventSystem {
  emit(event: string, data?: any, target?: string): Promise<void> {
    return Promise.resolve()
  }

  on(event: string, handler: EventHandler): Subscription {
    return { unsubscribe: () => {} }
  }

  once(event: string, handler: EventHandler): Subscription {
    return { unsubscribe: () => {} }
  }

  off(subscription: Subscription): void {}

  getStats(): EventStats {
    return {
      totalEvents: 0,
      eventTypes: {},
      activeListeners: 0,
      averageProcessingTime: 0
    }
  }
}
