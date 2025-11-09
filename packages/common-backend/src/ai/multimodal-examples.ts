// 文件路径: packages/common-backend/src/ai/multimodal-examples.ts
// 职责: VCPToolBox 多模态数据链的使用示例
// 展示Base64直通车、全局文件API、跨模态智能转译

import { MultimodalDataType, type MultimodalService } from './multimodal.service'

/**
 * VCPToolBox 多模态数据链使用示例
 */
export class MultimodalExamples {
  constructor(private readonly multimodalService: MultimodalService) {}

  /**
   * 示例1: Base64直通车
   * 场景: AI直接在tool字段中传递Base64编码的多模态数据
   */
  async exampleBase64Pipeline() {
    console.log('🚗 Base64直通车示例')
    console.log('')

    // 模拟AI在tool调用中传递的Base64图像数据
    const imageBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg=='
    const mimeType = 'image/png'

    console.log('📥 接收到AI传递的Base64数据...')
    console.log(`类型: ${mimeType}`)
    console.log(`数据长度: ${imageBase64.length} 字符`)
    console.log('')

    // 处理Base64数据
    const multimodalData = this.multimodalService.processBase64Data(
      imageBase64.split(',')[1], // 移除data URL前缀
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

    // 在后续处理中使用
    const processedResult = await this.processMultimodalData(multimodalData)
    console.log('🎯 后续处理结果:', processedResult)
    console.log('')

    return { multimodalData, processedResult }
  }

  /**
   * 示例2: 全局文件API v4.0
   * 场景: 分布式节点间的文件共享和访问
   */
  async exampleGlobalFileApi() {
    console.log('🌐 全局文件API v4.0 示例')
    console.log('')

    // 创建一些测试文件
    console.log('📝 创建测试文件...')
    await this.multimodalService.executeFileApi({
      action: 'write',
      path: 'documents/research_paper.pdf',
      data: {
        type: MultimodalDataType.FILE,
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
        type: MultimodalDataType.IMAGE,
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

    // 列出目录内容
    console.log('📂 列出目录内容...')
    const listResult = await this.multimodalService.executeFileApi({
      action: 'list',
      path: 'documents/',
    })

    if (listResult.success && listResult.data) {
      const fileList = JSON.parse(listResult.data.content as string)
      console.log('文档目录文件:')
      fileList.files.forEach((file: any) => {
        console.log(`  - ${file.name} (${file.type})`)
      })
    }
    console.log('')

    // 读取文件（模拟分布式访问）
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

    // 演示VCP路径语法
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

  /**
   * 示例3: 跨模态智能转译
   * 场景: 高阶模型能力赋能低阶模型，自动进行模态转换
   */
  async exampleCrossModalConversion() {
    console.log('🔄 跨模态智能转译示例')
    console.log('')

    // 准备测试数据
    const testCases = [
      {
        name: '语音转文字',
        sourceData: {
          type: MultimodalDataType.AUDIO,
          content: Buffer.from('mock audio data'),
          metadata: { mimeType: 'audio/wav' },
        } as any,
        targetType: MultimodalDataType.TEXT,
      },
      {
        name: '图像转描述',
        sourceData: {
          type: MultimodalDataType.IMAGE,
          content:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==',
          metadata: { mimeType: 'image/png' },
        } as any,
        targetType: MultimodalDataType.TEXT,
      },
      {
        name: '文字转语音',
        sourceData: {
          type: MultimodalDataType.TEXT,
          content: '你好，世界！',
          metadata: { language: 'zh-CN' },
        } as any,
        targetType: MultimodalDataType.AUDIO,
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

  /**
   * 示例4: 在AI工具调用中的集成使用
   * 场景: AI调用工具时传递多模态数据
   */
  async exampleAiToolIntegration() {
    console.log('🤖 AI工具调用多模态集成示例')
    console.log('')

    // 模拟AI生成的内容，包含多模态数据
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

    // 处理每个模态的数据
    const processedData = []

    // 处理图像
    const imageData = this.multimodalService.processBase64Data(
      aiGeneratedContent.image.split(',')[1],
      'image/png',
      { source: 'ai_generation' }
    )
    processedData.push(imageData)

    // 处理音频
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

    // 保存到分布式文件系统
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

    // 演示跨模态转换
    console.log('🔄 执行跨模态转换...')
    const conversionTasks = [
      {
        source: processedData[0], // 图像
        target: MultimodalDataType.TEXT,
        description: '图像转文字描述',
      },
      {
        source: processedData[1], // 音频
        target: MultimodalDataType.TEXT,
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

  /**
   * 示例5: 流式多模态数据处理
   * 场景: 处理大型多模态数据流
   */
  async exampleStreamingMultimodal() {
    console.log('🌊 流式多模态数据处理示例')
    console.log('')

    // 创建模拟数据流
    async function* createMockDataStream(): AsyncIterable<Buffer> {
      const chunks = [
        Buffer.from('Chunk 1: Header data...'),
        Buffer.from('Chunk 2: Main content...'),
        Buffer.from('Chunk 3: Metadata...'),
        Buffer.from('Chunk 4: Footer...'),
      ]

      for (const chunk of chunks) {
        yield chunk
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log('📡 创建多模态数据流...')
    const dataStream = this.multimodalService.createMultimodalStream(
      createMockDataStream(),
      MultimodalDataType.FILE
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

  /**
   * 示例6: 获取支持的转换类型
   */
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

  // ===== 辅助方法 =====

  private async processMultimodalData(data: any): Promise<string> {
    // 模拟数据处理逻辑
    return `处理了 ${data.type} 类型的数据，大小 ${data.metadata?.size} 字节`
  }

  private previewData(data: any): string {
    if (data.type === MultimodalDataType.TEXT) {
      return `${(data.content as string).substring(0, 50)}...`
    } else if (typeof data.content === 'string' && data.content.length > 50) {
      return `${data.content.substring(0, 50)}...`
    } else {
      return `数据类型: ${data.type}, 大小: ${data.metadata?.size || '未知'} 字节`
    }
  }

  private getExtension(type: MultimodalDataType): string {
    switch (type) {
      case MultimodalDataType.IMAGE:
        return 'png'
      case MultimodalDataType.AUDIO:
        return 'wav'
      case MultimodalDataType.VIDEO:
        return 'mp4'
      case MultimodalDataType.FILE:
        return 'bin'
      default:
        return 'dat'
    }
  }
}

/**
 * 使用指南
 *
 * 1. 导入服务:
 * import { MultimodalService, MultimodalDataType } from './multimodal.service';
 *
 * 2. Base64直通车:
 * const data = multimodalService.processBase64Data(base64String, mimeType, options);
 *
 * 3. 全局文件API:
 * const result = await multimodalService.executeFileApi({
 *   action: 'read',
 *   path: 'nodeId:/path/to/file',
 * });
 *
 * 4. 跨模态转换:
 * const result = await multimodalService.performCrossModalConversion({
 *   sourceData: source,
 *   targetType: MultimodalDataType.TEXT,
 * });
 *
 * 5. VCP路径解析:
 * const { nodeId, filePath } = multimodalService.parseVcpPath('H:\\MCP\\123.txt');
 *
 * 6. 流式处理:
 * const stream = multimodalService.createMultimodalStream(dataIterator, type);
 * for await (const chunk of stream) { ... }
 *
 * 优势:
 * - 🚗 Base64直通: AI可直接传递多模态数据，无需额外编码
 * - 🌐 分布式文件: 节点间无缝文件共享
 * - 🔄 智能转换: 自动模态转换，打破数据壁垒
 * - 📡 流式处理: 支持大型数据的高效处理
 */
