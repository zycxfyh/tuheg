import type { AiProvider } from '../../types/ai-providers.types'
import type { AgentConfig, AgentExecutionResult, AgentRole, AgentTool } from './agent.types'
export declare class Agent {
  private readonly config
  private readonly name
  private readonly logger
  constructor(config: AgentConfig, name: string)
  getRole(): AgentRole
  getName(): string
  getProvider(): AiProvider | undefined
  getTools(): AgentTool[]
  canDelegate(): boolean
  execute(taskDescription: string, context?: Record<string, unknown>): Promise<AgentExecutionResult>
  private buildSystemPrompt
  private extractToolCalls
  private executeTool
}
//# sourceMappingURL=agent.d.ts.map
