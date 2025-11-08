import type { TaskConfig, TaskContext, TaskResult } from './task.types'
import type { Agent } from './agent'
export declare class Task {
  private readonly name
  private readonly config
  private readonly logger
  constructor(name: string, config: TaskConfig)
  getName(): string
  getConfig(): TaskConfig
  getDependencies(): string[]
  getPriority(): number
  execute(agent: Agent, context: TaskContext): Promise<TaskResult>
  canExecute(completedTasks: Set<string>): boolean
}
//# sourceMappingURL=task.d.ts.map
