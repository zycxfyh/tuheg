import {
  TimeAwareVectorSearchService,
  TimeAwareSearchConfig,
} from './time-aware-vector-search.service'
export declare class TimeAwareSearchExamples {
  private readonly timeAwareSearch
  constructor(timeAwareSearch: TimeAwareVectorSearchService)
  exampleBasicTimeAwareSearch(
    gameId: string,
    query: string,
    user: any
  ): Promise<import('./time-aware-vector-search.service').TimeAwareSearchResult[]>
  exampleDecayFunctionsComparison(
    gameId: string,
    query: string,
    user: any
  ): Promise<Record<string, any[]>>
  exampleDynamicKAdjustment(
    gameId: string,
    query: string,
    user: any
  ): Promise<Record<string, any[]>>
  exampleTimeDistributionAnalysis(gameId: string): Promise<{
    totalMemories: number
    timeBuckets: Array<{
      hoursRange: string
      count: number
      avgSimilarity?: number
    }>
    recommendations: string[]
  }>
  exampleAutoOptimization(
    gameId: string,
    query: string,
    user: any
  ): Promise<{
    optimizedConfig: Partial<TimeAwareSearchConfig>
    results: import('./time-aware-vector-search.service').TimeAwareSearchResult[]
  }>
  exampleInNarrativeAI(
    gameId: string,
    playerAction: string,
    user: any
  ): Promise<{
    relevantMemories: import('./time-aware-vector-search.service').TimeAwareSearchResult[]
    timeAwareContext: string
    aiPrompt: string
  }>
  examplePerformanceComparison(
    gameId: string,
    queries: string[],
    user: any
  ): Promise<{
    timeAware: any[]
    regular: any[]
  }>
}
//# sourceMappingURL=time-aware-vector-search-examples.d.ts.map
