'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.MultimodalExamples = void 0
const multimodal_service_1 = require('./multimodal.service')
class MultimodalExamples {
  multimodalService
  constructor(multimodalService) {
    this.multimodalService = multimodalService
  }
  async exampleBase64Pipeline() {
    console.log('🚗 Base64直通车示例')
    console.log('')
    const imageBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg=='
    const mimeType = 'image/png'
    console.log('📥 接收到AI传递的Base64数据...')
    console.log(`类型: ${mimeType}`)
    console.log(`数据长度: ${imageBase64.length} 字符`)
    console.log('')
    const multimodalData = this.multimodalService.processBase64Data(
      imageBase64.split(',')[1],
      mimeType,
      {
        filename: 'ai_generated_image.png',
        source: 'dall_e_ai',
        autoDetectType: true,
      }
    )
    console.log('🔄 处理结果:')
    console.log(`检测类型: ${multimodalData.type}`)
    console.log(`文件大小: ${multimodalData.metadata?.size} 字节`)
    console.log(`来源: ${multimodalData.source}`)
    console.log('')
    const processedResult = await this.processMultimodalData(multimodalData)
    console.log('🎯 后续处理结果:', processedResult)
    console.log('')
    return { multimodalData, processedResult }
  }
  async exampleGlobalFileApi() {
    console.log('🌐 全局文件API v4.0 示例')
    console.log('')
    console.log('📝 创建测试文件...')
    await this.multimodalService.executeFileApi({
      action: 'write',
      path: 'documents/research_paper.pdf',
      data: {
        type: multimodal_service_1.MultimodalDataType.FILE,
        content: Buffer.from('PDF content...'),
        metadata: {
          mimeType: 'application/pdf',
          filename: 'research_paper.pdf',
          size: 1024,
        },
      },
    })
    await this.multimodalService.executeFileApi({
      action: 'write',
      path: 'images/screenshot.png',
      data: {
        type: multimodal_service_1.MultimodalDataType.IMAGE,
        content:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==',
        metadata: {
          mimeType: 'image/png',
          filename: 'screenshot.png',
        },
      },
    })
    console.log('✅ 测试文件创建完成')
    console.log('')
    console.log('📂 列出目录内容...')
    const listResult = await this.multimodalService.executeFileApi({
      action: 'list',
      path: 'documents/',
    })
    if (listResult.success && listResult.data) {
      const fileList = JSON.parse(listResult.data.content)
      console.log('文档目录文件:')
      fileList.files.forEach((file) => {
        console.log(`  - ${file.name} (${file.type})`)
      })
    }
    console.log('')
    console.log('📖 读取文件...')
    const readResult = await this.multimodalService.executeFileApi({
      action: 'read',
      path: 'documents/research_paper.pdf',
    })
    if (readResult.success && readResult.data) {
      console.log(`成功读取文件: ${readResult.data.metadata?.filename}`)
      console.log(`文件大小: ${readResult.data.metadata?.size} 字节`)
    }
    console.log('')
    console.log('🔗 VCP路径语法示例...')
    try {
      const vcpPath = 'H:\\MCP\\123.txt'
      const parsed = this.multimodalService.parseVcpPath(vcpPath)
      console.log(`VCP路径: ${vcpPath}`)
      console.log(`解析结果: 节点=${parsed.nodeId}, 路径=${parsed.filePath}`)
    } catch (error) {
      console.log(`路径解析错误:`, error instanceof Error ? error.message : String(error))
    }
    console.log('')
    return { listResult, readResult }
  }
  async exampleCrossModalConversion() {
    console.log('🔄 跨模态智能转译示例')
    console.log('')
    const testCases = [
      {
        name: '语音转文字',
        sourceData: {
          type: multimodal_service_1.MultimodalDataType.AUDIO,
          content: Buffer.from('mock audio data'),
          metadata: { mimeType: 'audio/wav' },
        },
        targetType: multimodal_service_1.MultimodalDataType.TEXT,
      },
      {
        name: '图像转描述',
        sourceData: {
          type: multimodal_service_1.MultimodalDataType.IMAGE,
          content:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==',
          metadata: { mimeType: 'image/png' },
        },
        targetType: multimodal_service_1.MultimodalDataType.TEXT,
      },
      {
        name: '文字转语音',
        sourceData: {
          type: multimodal_service_1.MultimodalDataType.TEXT,
          content: '你好，世界！',
          metadata: { language: 'zh-CN' },
        },
        targetType: multimodal_service_1.MultimodalDataType.AUDIO,
      },
    ]
    const results = []
    for (const testCase of testCases) {
      console.log(`🎯 测试: ${testCase.name}`)
      console.log(`   源类型: ${testCase.sourceData.type}`)
      console.log(`   目标类型: ${testCase.targetType}`)
      try {
        const result = await this.multimodalService.performCrossModalConversion({
          sourceData: testCase.sourceData,
          targetType: testCase.targetType,
          options: {
            language: 'zh-CN',
            quality: 0.9,
          },
        })
        if (result.success) {
          console.log(`   ✅ 转换成功`)
          console.log(`   转换路径: ${result.conversionPath.join(' → ')}`)
          console.log(`   处理时间: ${result.processingTime}ms`)
          console.log(`   置信度: ${result.confidence}`)
          console.log(`   结果预览: ${this.previewData(result.convertedData)}`)
        } else {
          console.log(`   ❌ 转换失败: ${result.error}`)
        }
      } catch (error) {
        console.log(`   ❌ 转换异常:`, error instanceof Error ? error.message : String(error))
      }
      console.log('')
    }
    return results
  }
  async exampleAiToolIntegration() {
    console.log('🤖 AI工具调用多模态集成示例')
    console.log('')
    const aiGeneratedContent = {
      text: '我分析了这张图片，发现...',
      image:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==',
      audio:
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
    }
    console.log('📥 AI生成的内容:')
    console.log(`文本: ${aiGeneratedContent.text}`)
    console.log(`图像: ${aiGeneratedContent.image.substring(0, 50)}...`)
    console.log(`音频: ${aiGeneratedContent.audio.substring(0, 50)}...`)
    console.log('')
    const processedData = []
    const imageData = this.multimodalService.processBase64Data(
      aiGeneratedContent.image.split(',')[1],
      'image/png',
      { source: 'ai_generation' }
    )
    processedData.push(imageData)
    const audioData = this.multimodalService.processBase64Data(
      aiGeneratedContent.audio.split(',')[1],
      'audio/wav',
      { source: 'ai_generation' }
    )
    processedData.push(audioData)
    console.log('🔄 处理结果:')
    processedData.forEach((data, index) => {
      console.log(`  ${index + 1}. 类型: ${data.type}, 大小: ${data.metadata?.size} 字节`)
    })
    console.log('')
    console.log('💾 保存到分布式文件系统...')
    for (let i = 0; i < processedData.length; i++) {
      const data = processedData[i]
      const filePath = `ai_generated/${data.type}_${i + 1}.${this.getExtension(data.type)}`
      await this.multimodalService.executeFileApi({
        action: 'write',
        path: filePath,
        data,
      })
      console.log(`   保存: ${filePath}`)
    }
    console.log('')
    console.log('🔄 执行跨模态转换...')
    const conversionTasks = [
      {
        source: processedData[0],
        target: multimodal_service_1.MultimodalDataType.TEXT,
        description: '图像转文字描述',
      },
      {
        source: processedData[1],
        target: multimodal_service_1.MultimodalDataType.TEXT,
        description: '音频转文字转写',
      },
    ]
    for (const task of conversionTasks) {
      const result = await this.multimodalService.performCrossModalConversion({
        sourceData: task.source,
        targetType: task.target,
      })
      console.log(`${task.description}:`)
      if (result.success) {
        console.log(`   ✅ ${this.previewData(result.convertedData)}`)
      } else {
        console.log(`   ❌ 失败: ${result.error}`)
      }
    }
    console.log('')
    return { aiGeneratedContent, processedData }
  }
  async exampleStreamingMultimodal() {
    console.log('🌊 流式多模态数据处理示例')
    console.log('')
    async function* createMockDataStream() {
      const chunks = [
        Buffer.from('Chunk 1: Header data...'),
        Buffer.from('Chunk 2: Main content...'),
        Buffer.from('Chunk 3: Metadata...'),
        Buffer.from('Chunk 4: Footer...'),
      ]
      for (const chunk of chunks) {
        yield chunk
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
    console.log('📡 创建多模态数据流...')
    const dataStream = this.multimodalService.createMultimodalStream(
      createMockDataStream(),
      multimodal_service_1.MultimodalDataType.FILE
    )
    console.log('🔄 处理数据流...')
    let chunkCount = 0
    for await (const chunk of dataStream) {
      chunkCount++
      console.log(
        `   接收到块 ${chunkCount}: ${chunk.metadata?.chunkIndex}, 大小: ${chunk.content.length} 字节`
      )
    }
    console.log(`✅ 流处理完成，共处理 ${chunkCount} 个数据块`)
    console.log('')
    return { chunkCount }
  }
  async exampleSupportedConversions() {
    console.log('📋 支持的模态转换类型')
    console.log('')
    const conversions = this.multimodalService.getSupportedConversions()
    conversions.forEach((conv) => {
      console.log(`${conv.from} → 支持转换到:`)
      conv.to.forEach((target) => {
        console.log(`  - ${target}: ${conv.description}`)
      })
      console.log('')
    })
    return conversions
  }
  async processMultimodalData(data) {
    return `处理了 ${data.type} 类型的数据，大小 ${data.metadata?.size} 字节`
  }
  previewData(data) {
    if (data.type === multimodal_service_1.MultimodalDataType.TEXT) {
      return data.content.substring(0, 50) + '...'
    } else if (typeof data.content === 'string' && data.content.length > 50) {
      return data.content.substring(0, 50) + '...'
    } else {
      return `数据类型: ${data.type}, 大小: ${data.metadata?.size || '未知'} 字节`
    }
  }
  getExtension(type) {
    switch (type) {
      case multimodal_service_1.MultimodalDataType.IMAGE:
        return 'png'
      case multimodal_service_1.MultimodalDataType.AUDIO:
        return 'wav'
      case multimodal_service_1.MultimodalDataType.VIDEO:
        return 'mp4'
      case multimodal_service_1.MultimodalDataType.FILE:
        return 'bin'
      default:
        return 'dat'
    }
  }
}
exports.MultimodalExamples = MultimodalExamples
//# sourceMappingURL=multimodal-examples.js.map
