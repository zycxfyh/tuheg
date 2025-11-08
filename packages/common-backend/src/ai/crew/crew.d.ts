import type { Agent } from './agent'
import type { Task } from './task'
import type { TaskResult } from './task.types'
export interface CrewConfig {
  description?: string
  executionMode?: 'sequential' | 'parallel'
  continueOnError?: boolean
  maxConcurrency?: number
  metadata?: Record<string, unknown>
}
export interface CrewExecutionResult {
  success: boolean
  results: TaskResult[]
  totalExecutionTime: number
  error?: string
  metadata?: Record<string, unknown>
}
export declare class Crew {
  private readonly name
  private readonly config
  private readonly logger
  private readonly agents
  private readonly tasks
  constructor(name: string, config?: CrewConfig)
  addAgent(name: string, agent: Agent): void
  addTask(name: string, task: Task): void
  getAgent(name: string): Agent | undefined
  getTask(name: string): Task | undefined
  execute(context?: Record<string, unknown>): Promise<CrewExecutionResult>
  private sortTasksByDependencies
  private selectAgentForTask
  private getDependencyResults
}
//# sourceMappingURL=crew.d.ts.map
