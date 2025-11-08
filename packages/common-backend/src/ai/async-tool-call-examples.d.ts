import { AsyncToolCallService } from './async-tool-call.service'
export declare class AsyncToolCallExamples {
  private readonly asyncToolService
  constructor(asyncToolService: AsyncToolCallService)
  exampleBasicAsyncCall(): Promise<{
    taskId: string
    aiResponse: string
  }>
  exampleWaitForCompletion(
    taskId: string
  ): Promise<import('./async-tool-call.service').AsyncToolCallTask | null>
  exampleParseAsyncResults(aiResponse: string): Promise<{
    processedResponse: string
    replacements: {
      placeholder: string
      result: string
    }[]
  }>
  exampleMultipleAsyncCalls(): Promise<{
    tasks: [string, string, string]
    aiResponse: string
    correlationId: string
  }>
  exampleWebSocketIntegration(): Promise<{
    eventHandlers: {
      'async-tool-call.started': (data: any) => void
      'async-tool-call.completed': (data: any) => void
      'async-tool-call.failed': (data: any) => void
    }
    taskId: string
  }>
  exampleCompleteWorkflow(userQuery: string): Promise<{
    userQuery: string
    requiredTools: string[]
    taskIds: string[]
    initialResponse: string
    completedTasks: import('./async-tool-call.service').AsyncToolCallTask[]
    finalResponse: string
  }>
  private analyzeQueryForTools
  private generateToolInput
  private generateResponseWithPlaceholders
  private integrateResultsIntoResponse
  private formatToolResult
}
//# sourceMappingURL=async-tool-call-examples.d.ts.map
