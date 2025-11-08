export declare enum MultimodalDataType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
  BASE64 = 'base64',
}
export interface MultimodalData {
  type: MultimodalDataType
  content: string | Buffer
  metadata?: {
    mimeType?: string
    filename?: string
    size?: number
    encoding?: string
    originalType?: string
  }
  source?: string
  timestamp?: Date
}
export interface CrossModalConversionRequest {
  sourceData: MultimodalData
  targetType: MultimodalDataType
  options?: {
    quality?: number
    format?: string
    language?: string
    preserveMetadata?: boolean
  }
}
export interface CrossModalConversionResult {
  success: boolean
  originalData: MultimodalData
  convertedData: MultimodalData
  conversionPath: string[]
  confidence?: number
  processingTime?: number
  error?: string
}
export interface FileApiRequest {
  action: 'read' | 'write' | 'list' | 'delete' | 'copy' | 'move'
  path: string
  nodeId?: string
  data?: MultimodalData
  options?: {
    encoding?: string
    createDirs?: boolean
    overwrite?: boolean
  }
}
export interface FileApiResponse {
  success: boolean
  action: string
  path: string
  data?: MultimodalData
  metadata?: {
    size?: number
    modified?: Date
    permissions?: string
  }
  error?: string
}
export declare class MultimodalService {
  private readonly logger
  private readonly base64Cache
  private readonly nodeFileMap
  constructor()
  processBase64Data(
    base64Data: string,
    mimeType: string,
    options?: {
      filename?: string
      source?: string
      autoDetectType?: boolean
    }
  ): MultimodalData
  executeFileApi(request: FileApiRequest): Promise<FileApiResponse>
  performCrossModalConversion(
    request: CrossModalConversionRequest
  ): Promise<CrossModalConversionResult>
  parseVcpPath(vcpPath: string): {
    nodeId: string
    filePath: string
  }
  createMultimodalStream(
    dataIterator: AsyncIterable<Buffer>,
    type: MultimodalDataType
  ): AsyncIterable<MultimodalData>
  getSupportedConversions(): Array<{
    from: MultimodalDataType
    to: MultimodalDataType[]
    description: string
  }>
  private generateDataHash
  private handleFileRead
  private handleFileWrite
  private handleFileList
  private handleFileDelete
  private handleFileCopy
  private handleFileMove
  private inferFileType
  private convertAudioToTarget
  private convertImageToTarget
  private convertVideoToTarget
  private convertTextToTarget
}
//# sourceMappingURL=multimodal.service.d.ts.map
