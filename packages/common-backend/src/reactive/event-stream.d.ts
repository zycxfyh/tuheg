import { Observable } from 'rxjs'
export interface EventStreamConfig {
  eventName: string
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}
export declare class EventStream {
  private readonly logger
  private readonly streams
  createStream<T = unknown>(eventName: string): Observable<T>
  emit<T = unknown>(eventName: string, data: T): void
  subscribe<T = unknown>(
    eventName: string,
    handler: (data: T) => void | Promise<void>,
    config?: EventStreamConfig
  ): () => void
  pipe<T, R>(eventName: string, transform: (data: T) => R | Promise<R>): Observable<R>
  private retryHandler
  close(eventName: string): void
  closeAll(): void
}
//# sourceMappingURL=event-stream.d.ts.map
