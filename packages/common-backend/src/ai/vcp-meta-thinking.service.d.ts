import { ConfigService } from '@nestjs/config'
export interface ThinkingNode {
  id: string
  type: 'semantic' | 'logic' | 'recursive' | 'fusion'
  content: string
  confidence: number
  depth: number
  parentId?: string
  children: string[]
  metadata: {
    createdAt: Date
    activatedCount: number
    lastActivated: Date
    tags: string[]
    context: Record<string, unknown>
  }
}
export interface SemanticGroup {
  id: string
  keywords: string[]
  relatedConcepts: string[]
  activationThreshold: number
  activationCount: number
  lastActivated: Date
  strength: number
}
export interface LogicModule {
  id: string
  name: string
  description: string
  logicPattern: string
  successRate: number
  usageCount: number
  lastUsed: Date
  parameters: Record<string, any>
}
export interface RecursiveThinkingChain {
  id: string
  rootNodeId: string
  currentDepth: number
  maxDepth: number
  nodes: Map<string, ThinkingNode>
  status: 'active' | 'completed' | 'failed'
  result?: any
  confidence: number
}
export interface VcpMetaThinkingConfig {
  maxRecursionDepth: number
  semanticGroupsEnabled: boolean
  logicModulesEnabled: boolean
  fusionEnabled: boolean
  confidenceThreshold: number
  adaptiveLearning: boolean
}
export declare class VcpMetaThinkingService {
  private readonly configService
  private readonly logger
  private readonly thinkingNodes
  private readonly semanticGroups
  private readonly logicModules
  private readonly activeChains
  private readonly defaultConfig
  constructor(configService: ConfigService)
  performMetaThinking(
    query: string,
    context?: Record<string, unknown>,
    config?: Partial<VcpMetaThinkingConfig>
  ): Promise<{
    result: any
    chain: RecursiveThinkingChain
    confidence: number
    reasoning: string[]
  }>
  private activateSemanticGroups
  private createInitialThinkingNode
  private recursiveThinkingExpansion
  private applyLogicModules
  private generateChildThinkingNodes
  private performRecursiveFusion
  private calculateChainConfidence
  private extractReasoningChain
  private adaptiveLearning
  private initializeDefaultComponents
  private initializeDefaultSemanticGroups
  private initializeDefaultLogicModules
  private isModuleApplicable
  private executeLogicModule
  private createChildThinkingNode
  private fuseThinkingResults
  private contentToValue
  private valueToContent
}
//# sourceMappingURL=vcp-meta-thinking.service.d.ts.map
