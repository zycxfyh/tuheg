import { VcpMetaThinkingService } from './vcp-meta-thinking.service'
export declare class VcpMetaThinkingExamples {
  private readonly metaThinking
  constructor(metaThinking: VcpMetaThinkingService)
  exampleBasicMetaThinking(query: string): Promise<{
    result: any
    chain: import('./vcp-meta-thinking.service').RecursiveThinkingChain
    confidence: number
    reasoning: string[]
  }>
  exampleSemanticGroupsActivation(query: string): Promise<{
    result: {
      result: any
      chain: import('./vcp-meta-thinking.service').RecursiveThinkingChain
      confidence: number
      reasoning: string[]
    }
    semanticNodes: import('./vcp-meta-thinking.service').ThinkingNode[]
  }>
  exampleLogicModulesApplication(query: string): Promise<{
    result: {
      result: any
      chain: import('./vcp-meta-thinking.service').RecursiveThinkingChain
      confidence: number
      reasoning: string[]
    }
    logicNodes: import('./vcp-meta-thinking.service').ThinkingNode[]
  }>
  exampleRecursiveFusion(query: string): Promise<{
    result: any
    chain: import('./vcp-meta-thinking.service').RecursiveThinkingChain
    confidence: number
    reasoning: string[]
  }>
  exampleConfigurationComparison(query: string): Promise<Record<string, any>>
  exampleInConversationalAI(
    userQuery: string,
    conversationHistory: string[]
  ): Promise<{
    result: {
      result: any
      chain: import('./vcp-meta-thinking.service').RecursiveThinkingChain
      confidence: number
      reasoning: string[]
    }
    context: {
      conversationHistory: string[]
      userIntent: string
      domain: string
      complexity: string
    }
  }>
  exampleLearningAndAdaptation(): Promise<
    {
      query: string
      confidence: number
      reasoningSteps: number
      duration: number
    }[]
  >
  private displayThinkingTree
  private analyzeUserIntent
  private detectDomain
  private assessComplexity
}
//# sourceMappingURL=vcp-meta-thinking-examples.d.ts.map
