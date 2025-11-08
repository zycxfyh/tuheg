import { MemoryHierarchyService } from './memory-hierarchy.service'
export declare class MemoryRecallExamples {
  private readonly memoryService
  constructor(memoryService: MemoryHierarchyService)
  exampleFullTextRecall(
    gameId: string
  ): Promise<import('./memory-hierarchy.service').MemoryRecallResult>
  exampleRAGRecall(
    gameId: string,
    currentContext: string
  ): Promise<import('./memory-hierarchy.service').MemoryRecallResult>
  exampleThresholdFullRecall(
    gameId: string,
    currentContext: string
  ): Promise<import('./memory-hierarchy.service').MemoryRecallResult>
  exampleThresholdRAGRecall(
    gameId: string,
    currentContext: string
  ): Promise<import('./memory-hierarchy.service').MemoryRecallResult>
  exampleSmartInjection(
    gameId: string,
    currentContext: string
  ): Promise<{
    content: string
    strategy: string
    stats: any
  }>
  exampleMemorySyntaxParsing(gameId: string, currentContext: string): Promise<string>
  narrativeAIExample(
    gameId: string,
    playerAction: string
  ): Promise<{
    contextAnalysis: {
      content: string
      strategy: string
      stats: any
    }
    enhancedPrompt: string
  }>
}
//# sourceMappingURL=memory-hierarchy-examples.d.ts.map
