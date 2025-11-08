import { MultimodalService, MultimodalDataType } from './multimodal.service'
export declare class MultimodalExamples {
  private readonly multimodalService
  constructor(multimodalService: MultimodalService)
  exampleBase64Pipeline(): Promise<{
    multimodalData: import('./multimodal.service').MultimodalData
    processedResult: string
  }>
  exampleGlobalFileApi(): Promise<{
    listResult: import('./multimodal.service').FileApiResponse
    readResult: import('./multimodal.service').FileApiResponse
  }>
  exampleCrossModalConversion(): Promise<any[]>
  exampleAiToolIntegration(): Promise<{
    aiGeneratedContent: {
      text: string
      image: string
      audio: string
    }
    processedData: import('./multimodal.service').MultimodalData[]
  }>
  exampleStreamingMultimodal(): Promise<{
    chunkCount: number
  }>
  exampleSupportedConversions(): Promise<
    {
      from: MultimodalDataType
      to: MultimodalDataType[]
      description: string
    }[]
  >
  private processMultimodalData
  private previewData
  private getExtension
}
//# sourceMappingURL=multimodal-examples.d.ts.map
