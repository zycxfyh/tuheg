import type { AiProvider } from '../../types/ai-providers.types'
export interface AgentRole {
  name: string
  description: string
  goal: string
  backstory?: string
}
export interface AgentTool {
  name: string
  description: string
  execute: (input: unknown) => Promise<unknown> | unknown
}
export interface AgentConfig {
  role: AgentRole
  tools?: AgentTool[]
  provider?: AiProvider
  allowDelegation?: boolean
  maxRetries?: number
  metadata?: Record<string, unknown>
}
export interface AgentExecutionResult {
  success: boolean
  output: unknown
  error?: string
  executionTime?: number
  toolsUsed?: string[]
  metadata?: Record<string, unknown>
}
//# sourceMappingURL=agent.types.d.ts.map
