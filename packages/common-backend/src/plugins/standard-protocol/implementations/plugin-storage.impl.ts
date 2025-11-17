import { Injectable } from '@nestjs/common'
import { PluginStorage, StorageStats } from '../plugin-communication.interface'

@Injectable()
export class PluginStorageImpl implements PluginStorage {
  set(key: string, value: any): Promise<void> {
    return Promise.resolve()
  }

  get<T = any>(key: string): Promise<T | null> {
    return Promise.resolve(null)
  }

  remove(key: string): Promise<void> {
    return Promise.resolve()
  }

  has(key: string): Promise<boolean> {
    return Promise.resolve(false)
  }

  keys(): Promise<string[]> {
    return Promise.resolve([])
  }

  clear(): Promise<void> {
    return Promise.resolve()
  }

  getStats(): Promise<StorageStats> {
    return Promise.resolve({
      totalItems: 0,
      totalSize: 0,
      lastModified: new Date()
    })
  }
}
