import { Injectable } from '@nestjs/common'
import { PluginDataSharing, DataScope, DataChangeHandler, Subscription, DataStats } from '../plugin-communication.interface'

@Injectable()
export class PluginDataSharingImpl implements PluginDataSharing {
  setSharedData(key: string, value: any, scope?: DataScope): Promise<void> {
    return Promise.resolve()
  }

  getSharedData(key: string, scope?: DataScope): Promise<any> {
    return Promise.resolve(null)
  }

  removeSharedData(key: string, scope?: DataScope): Promise<void> {
    return Promise.resolve()
  }

  subscribeToData(key: string, handler: DataChangeHandler, scope?: DataScope): Subscription {
    return { unsubscribe: () => {} }
  }

  getStats(): DataStats {
    return {
      totalItems: 0,
      totalSize: 0,
      scopeDistribution: {} as any,
      activeSubscriptions: 0
    }
  }
}
