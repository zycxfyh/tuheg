export interface TaskConfig {
  description: string
  expectedOutput?: string
  agent?: string
  dependencies?: string[]
  priority?: number
  timeout?: number
  metadata?: Record<string, unknown>
}
export interface TaskResult {
  taskName: string
  success: boolean
  output: unknown
  agent?: string
  executionTime?: number
  error?: string
  metadata?: Record<string, unknown>
}
export interface TaskContext {
  input: unknown
  dependencies?: Record<string, TaskResult>
  globalContext?: Record<string, unknown>
}
//# sourceMappingURL=task.types.d.ts.map
