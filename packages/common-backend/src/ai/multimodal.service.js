'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var MultimodalService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.MultimodalService = exports.MultimodalDataType = void 0
const common_1 = require('@nestjs/common')
const crypto_1 = require('crypto')
var MultimodalDataType
;(function (MultimodalDataType) {
  MultimodalDataType['TEXT'] = 'text'
  MultimodalDataType['IMAGE'] = 'image'
  MultimodalDataType['AUDIO'] = 'audio'
  MultimodalDataType['VIDEO'] = 'video'
  MultimodalDataType['FILE'] = 'file'
  MultimodalDataType['BASE64'] = 'base64'
})(MultimodalDataType || (exports.MultimodalDataType = MultimodalDataType = {}))
let MultimodalService = (MultimodalService_1 = class MultimodalService {
  logger = new common_1.Logger(MultimodalService_1.name)
  base64Cache = new Map()
  nodeFileMap = new Map()
  constructor() {
    this.nodeFileMap.set('local', new Map())
  }
  processBase64Data(base64Data, mimeType, options = {}) {
    const { filename, source, autoDetectType = true } = options
    let dataType = MultimodalDataType.BASE64
    if (autoDetectType) {
      if (mimeType.startsWith('image/')) {
        dataType = MultimodalDataType.IMAGE
      } else if (mimeType.startsWith('audio/')) {
        dataType = MultimodalDataType.AUDIO
      } else if (mimeType.startsWith('video/')) {
        dataType = MultimodalDataType.VIDEO
      } else if (mimeType.includes('pdf') || mimeType.includes('document')) {
        dataType = MultimodalDataType.FILE
      }
    }
    const multimodalData = {
      type: dataType,
      content: base64Data,
      metadata: {
        mimeType,
        filename,
        size: Buffer.from(base64Data, 'base64').length,
        encoding: 'base64',
        originalType: mimeType,
      },
      source,
      timestamp: new Date(),
    }
    const hash = this.generateDataHash(base64Data)
    this.base64Cache.set(hash, multimodalData)
    this.logger.debug(
      `Processed Base64 data: ${mimeType}, size: ${multimodalData.metadata.size} bytes`
    )
    return multimodalData
  }
  async executeFileApi(request) {
    const { action, path, nodeId = 'local', data, options = {} } = request
    try {
      const nodeFiles = this.nodeFileMap.get(nodeId)
      if (!nodeFiles) {
        throw new Error(`Node ${nodeId} not found`)
      }
      switch (action) {
        case 'read':
          return this.handleFileRead(nodeId, path, nodeFiles)
        case 'write':
          return this.handleFileWrite(nodeId, path, data, nodeFiles, options)
        case 'list':
          return this.handleFileList(nodeId, path, nodeFiles)
        case 'delete':
          return this.handleFileDelete(nodeId, path, nodeFiles)
        case 'copy':
          return this.handleFileCopy(nodeId, path, request.targetPath, nodeFiles, options)
        case 'move':
          return this.handleFileMove(nodeId, path, request.targetPath, nodeFiles, options)
        default:
          throw new Error(`Unsupported action: ${action}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`File API error (${action} ${path}):`, errorMessage)
      return {
        success: false,
        action,
        path,
        error: errorMessage,
      }
    }
  }
  async performCrossModalConversion(request) {
    const { sourceData, targetType, options = {} } = request
    const startTime = Date.now()
    try {
      this.logger.debug(`Converting ${sourceData.type} to ${targetType}`)
      let convertedData
      let conversionPath
      switch (sourceData.type) {
        case MultimodalDataType.AUDIO:
          convertedData = await this.convertAudioToTarget(sourceData, targetType, options)
          conversionPath = ['audio', targetType]
          break
        case MultimodalDataType.IMAGE:
          convertedData = await this.convertImageToTarget(sourceData, targetType, options)
          conversionPath = ['image', targetType]
          break
        case MultimodalDataType.VIDEO:
          convertedData = await this.convertVideoToTarget(sourceData, targetType, options)
          conversionPath = ['video', targetType]
          break
        case MultimodalDataType.TEXT:
          convertedData = await this.convertTextToTarget(sourceData, targetType, options)
          conversionPath = ['text', targetType]
          break
        default:
          throw new Error(`Unsupported conversion from ${sourceData.type} to ${targetType}`)
      }
      const processingTime = Date.now() - startTime
      return {
        success: true,
        originalData: sourceData,
        convertedData,
        conversionPath,
        confidence: 0.9,
        processingTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const processingTime = Date.now() - startTime
      this.logger.error(`Cross-modal conversion failed:`, errorMessage)
      return {
        success: false,
        originalData: sourceData,
        convertedData: sourceData,
        conversionPath: [sourceData.type],
        processingTime,
        error: errorMessage,
      }
    }
  }
  parseVcpPath(vcpPath) {
    const pathParts = vcpPath.split(':')
    if (pathParts.length !== 2) {
      throw new Error(`Invalid VCP path format: ${vcpPath}`)
    }
    const nodeId = pathParts[0]
    const filePath = pathParts[1].replace(/\\/g, '/')
    return { nodeId, filePath }
  }
  async *createMultimodalStream(dataIterator, type) {
    let chunkIndex = 0
    for await (const chunk of dataIterator) {
      yield {
        type,
        content: chunk,
        metadata: {
          chunkIndex,
          isChunk: true,
        },
        timestamp: new Date(),
      }
      chunkIndex++
    }
  }
  getSupportedConversions() {
    return [
      {
        from: MultimodalDataType.AUDIO,
        to: [MultimodalDataType.TEXT],
        description: '语音转文字',
      },
      {
        from: MultimodalDataType.IMAGE,
        to: [MultimodalDataType.TEXT],
        description: '图像描述生成',
      },
      {
        from: MultimodalDataType.VIDEO,
        to: [MultimodalDataType.TEXT, MultimodalDataType.IMAGE],
        description: '视频转文字/提取关键帧',
      },
      {
        from: MultimodalDataType.TEXT,
        to: [MultimodalDataType.AUDIO],
        description: '文字转语音',
      },
    ]
  }
  generateDataHash(data) {
    return (0, crypto_1.createHash)('md5').update(data).digest('hex')
  }
  handleFileRead(nodeId, path, nodeFiles) {
    const data = nodeFiles.get(path)
    if (!data) {
      throw new Error(`File not found: ${path}`)
    }
    return {
      success: true,
      action: 'read',
      path,
      data,
      metadata: {
        size: typeof data.content === 'string' ? data.content.length : data.content.length,
        modified: data.timestamp,
      },
    }
  }
  handleFileWrite(nodeId, path, data, nodeFiles, options) {
    nodeFiles.set(path, { ...data, timestamp: new Date() })
    return {
      success: true,
      action: 'write',
      path,
      metadata: {
        size: typeof data.content === 'string' ? data.content.length : data.content.length,
        modified: new Date(),
      },
    }
  }
  handleFileList(nodeId, path, nodeFiles) {
    const files = Array.from(nodeFiles.keys())
      .filter((filePath) => filePath.startsWith(path))
      .map((filePath) => ({
        name: filePath.split('/').pop() || filePath,
        path: filePath,
        type: this.inferFileType(filePath),
      }))
    return {
      success: true,
      action: 'list',
      path,
      data: {
        type: MultimodalDataType.TEXT,
        content: JSON.stringify({ files }),
      },
    }
  }
  handleFileDelete(nodeId, path, nodeFiles) {
    const deleted = nodeFiles.delete(path)
    if (!deleted) {
      throw new Error(`File not found: ${path}`)
    }
    return {
      success: true,
      action: 'delete',
      path,
    }
  }
  handleFileCopy(nodeId, sourcePath, targetPath, nodeFiles, options) {
    const sourceData = nodeFiles.get(sourcePath)
    if (!sourceData) {
      throw new Error(`Source file not found: ${sourcePath}`)
    }
    nodeFiles.set(targetPath, { ...sourceData, timestamp: new Date() })
    return {
      success: true,
      action: 'copy',
      path: targetPath,
    }
  }
  handleFileMove(nodeId, sourcePath, targetPath, nodeFiles, options) {
    const sourceData = nodeFiles.get(sourcePath)
    if (!sourceData) {
      throw new Error(`Source file not found: ${sourcePath}`)
    }
    nodeFiles.delete(sourcePath)
    nodeFiles.set(targetPath, { ...sourceData, timestamp: new Date() })
    return {
      success: true,
      action: 'move',
      path: targetPath,
    }
  }
  inferFileType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image'
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio'
      case 'mp4':
      case 'avi':
      case 'mov':
        return 'video'
      case 'pdf':
      case 'doc':
      case 'docx':
        return 'document'
      default:
        return 'file'
    }
  }
  async convertAudioToTarget(sourceData, targetType, options) {
    if (targetType !== MultimodalDataType.TEXT) {
      throw new Error(`Audio can only be converted to text, not ${targetType}`)
    }
    const mockTranscript = '这是语音内容的文字转写结果...'
    return {
      type: MultimodalDataType.TEXT,
      content: mockTranscript,
      metadata: {
        originalType: sourceData.metadata?.mimeType,
        language: options.language || 'zh-CN',
        processingMethod: 'speech_to_text',
      },
      source: sourceData.source,
      timestamp: new Date(),
    }
  }
  async convertImageToTarget(sourceData, targetType, options) {
    if (targetType !== MultimodalDataType.TEXT) {
      throw new Error(`Image can only be converted to text, not ${targetType}`)
    }
    const mockDescription = '这是一张图像，包含...'
    return {
      type: MultimodalDataType.TEXT,
      content: mockDescription,
      metadata: {
        originalType: sourceData.metadata?.mimeType,
        processingMethod: 'image_captioning',
      },
      source: sourceData.source,
      timestamp: new Date(),
    }
  }
  async convertVideoToTarget(sourceData, targetType, options) {
    if (targetType === MultimodalDataType.TEXT) {
      const mockTranscript = '这是视频内容的文字转写...'
      return {
        type: MultimodalDataType.TEXT,
        content: mockTranscript,
        metadata: {
          originalType: sourceData.metadata?.mimeType,
          processingMethod: 'video_transcription',
        },
        source: sourceData.source,
        timestamp: new Date(),
      }
    } else if (targetType === MultimodalDataType.IMAGE) {
      const mockKeyframe = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
      return {
        type: MultimodalDataType.IMAGE,
        content: mockKeyframe,
        metadata: {
          mimeType: 'image/jpeg',
          originalType: sourceData.metadata?.mimeType,
          processingMethod: 'keyframe_extraction',
        },
        source: sourceData.source,
        timestamp: new Date(),
      }
    } else {
      throw new Error(`Video cannot be converted to ${targetType}`)
    }
  }
  async convertTextToTarget(sourceData, targetType, options) {
    if (targetType !== MultimodalDataType.AUDIO) {
      throw new Error(`Text can only be converted to audio, not ${targetType}`)
    }
    const mockAudio = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10...'
    return {
      type: MultimodalDataType.AUDIO,
      content: mockAudio,
      metadata: {
        mimeType: 'audio/wav',
        originalType: sourceData.metadata?.mimeType,
        processingMethod: 'text_to_speech',
        language: options.language || 'zh-CN',
      },
      source: sourceData.source,
      timestamp: new Date(),
    }
  }
})
exports.MultimodalService = MultimodalService
exports.MultimodalService =
  MultimodalService =
  MultimodalService_1 =
    __decorate([(0, common_1.Injectable)(), __metadata('design:paramtypes', [])], MultimodalService)
//# sourceMappingURL=multimodal.service.js.map
