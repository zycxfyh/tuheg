// 文本处理器
// 处理文本内容的分析、转换和增强

import type { MultimodalContent, MultimodalProcessor, MultimodalType } from '../types'

export class TextProcessor implements MultimodalProcessor {
  canProcess(type: MultimodalType): boolean {
    return type === 'text'
  }

  async process(content: any, options: any = {}): Promise<MultimodalContent> {
    if (typeof content === 'string') {
      return this.processText(content, options)
    }

    if (content.text) {
      return this.processText(content.text, options)
    }

    throw new Error('Invalid text content')
  }

  validate(content: any): boolean {
    return typeof content === 'string' && content.trim().length > 0
  }

  private async processText(text: string, options: any): Promise<MultimodalContent> {
    const processed: MultimodalContent = {
      text: this.cleanText(text),
    }

    // 分析文本情感
    if (options.analyzeSentiment) {
      processed.sentiment = await this.analyzeSentiment(text)
    }

    // 提取关键词
    if (options.extractKeywords) {
      processed.keywords = this.extractKeywords(text)
    }

    // 检测语言
    if (options.detectLanguage) {
      processed.language = this.detectLanguage(text)
    }

    // 生成摘要
    if (options.generateSummary && text.length > 200) {
      processed.summary = await this.generateSummary(text, options.summaryLength || 50)
    }

    // 文本到语音转换准备
    if (options.prepareForTTS) {
      processed.ttsReady = this.prepareForTTS(text)
    }

    return processed
  }

  private cleanText(text: string): string {
    return (
      text
        // 移除多余空白字符
        .replace(/\s+/g, ' ')
        // 移除控制字符
        // biome-ignore lint/suspicious/noControlCharactersInRegex: 这是有意移除控制字符的正则表达式
        .replace(/[\x00-\x1F\x7F]/g, '')
        // 标准化引号
        .replace(/["""]/g, '"')
        .replace(/[''']/g, "'")
        // 移除首尾空白
        .trim()
    )
  }

  private async analyzeSentiment(text: string): Promise<{
    score: number
    label: 'positive' | 'negative' | 'neutral'
    confidence: number
  }> {
    // 简化的情感分析实现
    // 在实际应用中，应该调用AI服务进行情感分析

    const positiveWords = ['好', '棒', '优秀', '喜欢', '快乐', '成功', '胜利', '美好', '精彩']
    const negativeWords = ['坏', '差', '讨厌', '痛苦', '失败', '糟糕', '可怕', '悲伤', '失望']

    const words = text.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0

    words.forEach((word) => {
      if (positiveWords.some((pw) => word.includes(pw))) positiveCount++
      if (negativeWords.some((nw) => word.includes(nw))) negativeCount++
    })

    const total = positiveCount + negativeCount
    if (total === 0) {
      return { score: 0, label: 'neutral', confidence: 0.5 }
    }

    const score = (positiveCount - negativeCount) / total
    const confidence = Math.min(total / words.length, 1)

    let label: 'positive' | 'negative' | 'neutral'
    if (score > 0.1) label = 'positive'
    else if (score < -0.1) label = 'negative'
    else label = 'neutral'

    return { score, label, confidence }
  }

  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const words = text.toLowerCase().split(/\s+/)
    const stopWords = [
      '的',
      '了',
      '和',
      '是',
      '在',
      '有',
      '为',
      '这',
      '那',
      '一个',
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ]

    const filteredWords = words.filter((word) => word.length > 1 && !stopWords.includes(word))

    // 计算词频
    const wordCount: Record<string, number> = {}
    filteredWords.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    // 返回出现频率最高的5个词
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  private detectLanguage(text: string): string {
    // 简化的语言检测
    const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0
    const totalChars = text.replace(/\s/g, '').length

    if (chineseChars / totalChars > 0.3) {
      return 'zh-CN'
    }

    const englishChars = text.match(/[a-zA-Z]/g)?.length || 0
    if (englishChars / totalChars > 0.5) {
      return 'en-US'
    }

    return 'unknown'
  }

  private async generateSummary(text: string, maxLength: number): Promise<string> {
    // 简化的摘要生成
    // 在实际应用中，应该调用AI服务生成摘要

    const sentences = text.split(/[.!?。！？]/).filter((s) => s.trim().length > 0)
    const importantSentences = sentences.slice(0, Math.min(3, sentences.length))

    let summary = importantSentences.join('. ').substring(0, maxLength)

    if (summary.length < text.length) {
      summary += '...'
    }

    return summary
  }

  private prepareForTTS(text: string): {
    cleanText: string
    estimatedDuration: number
    ssml?: string
  } {
    const cleanText = text
      // 移除不适合语音合成的字符
      .replace(/[^\w\s\u4e00-\u9fff.,!?:;""''()-]/g, '')
      // 处理常见的缩写和数字
      .replace(/\b\d+\b/g, (match) => this.numberToWords(parseInt(match, 10)))
      // 添加适当的停顿
      .replace(/([.!?。！？])/g, '$1 ')

    // 估算时长（每分钟150个字）
    const charCount = cleanText.replace(/\s/g, '').length
    const estimatedDuration = (charCount / 150) * 60 * 1000 // 毫秒

    return {
      cleanText,
      estimatedDuration,
      ssml: this.generateSSML(cleanText),
    }
  }

  private numberToWords(num: number): string {
    // 简化的数字转文字
    if (num < 10) {
      const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
      return digits[num]
    }
    if (num < 100) {
      const tens = Math.floor(num / 10)
      const ones = num % 10
      const tenWords = ['十', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十']
      return tenWords[tens - 1] + (ones > 0 ? this.numberToWords(ones) : '')
    }
    return num.toString() // 对于更大的数字，直接返回字符串
  }

  private generateSSML(text: string): string {
    // 生成基本的SSML标记
    return `<speak>
  <prosody rate="medium" pitch="medium">
    ${text.replace(/([.!?。！？])/g, '$1</prosody><break time="500ms"/><prosody rate="medium" pitch="medium">')}
  </prosody>
</speak>`
  }
}
