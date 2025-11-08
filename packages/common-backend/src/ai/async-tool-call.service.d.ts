import { EventEmitter2 } from '@nestjs/event-emitter'
export declare enum AsyncToolCallStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}
export interface AsyncToolCallTask {
  id: string
  toolName: string
  input: unknown
  context: Record<string, unknown>
  status: AsyncToolCallStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  result?: unknown
  error?: string
  timeoutMs?: number
  correlationId: string
}
export interface AsyncToolCallConfig {
  timeoutMs?: number
  enableWebSocket?: boolean
  enableFilePersistence?: boolean
  retryAttempts?: number
}
export declare class AsyncToolCallService {
  private readonly eventEmitter
  private readonly logger
  private readonly activeTasks
  private readonly completedTasks
  constructor(eventEmitter: EventEmitter2)
  callToolAsync(
    toolName: string,
    input: unknown,
    context?: Record<string, unknown>,
    config?: AsyncToolCallConfig
  ): Promise<string>
  private executeToolAsync
  private executeToolByName
  getTaskStatus(taskId: string): AsyncToolCallTask | null
  getActiveTasks(): AsyncToolCallTask[]
  getTasksByCorrelationId(correlationId: string): AsyncToolCallTask[]
  waitForTaskCompletion(taskId: string, timeoutMs?: number): Promise<AsyncToolCallTask>
  cleanupCompletedTasks(maxAgeMs?: number): number
  private updateTaskStatus
  private mockWebSearch
  private mockFileOperation
  private mockDataAnalysis
}
//# sourceMappingURL=async-tool-call.service.d.ts.map
