// 文本渲染器
// 将文本内容渲染到DOM中

import type { MultimodalContent, MultimodalRenderer, MultimodalType, RenderOptions } from '../types'

export class TextRenderer implements MultimodalRenderer {
  canRender(type: MultimodalType): boolean {
    return type === 'text'
  }

  async render(
    content: MultimodalContent,
    container: HTMLElement,
    options: RenderOptions = {
      format: 'html',
      includeAssets: true,
      compressAssets: false,
      optimizeFor: 'web',
      quality: 'medium',
    }
  ): Promise<void> {
    if (!content.text) {
      throw new Error('No text content to render')
    }

    // 清空容器
    container.innerHTML = ''

    // 创建文本容器
    const textContainer = document.createElement('div')
    textContainer.className = 'multimodal-text-content'

    // 应用样式
    this.applyTextStyles(textContainer, content, options)

    // 渲染文本内容
    const textElement = document.createElement('div')
    textElement.className = 'text-body'
    textElement.textContent = content.text

    // 处理文本格式化
    if (options.format === 'html') {
      textElement.innerHTML = this.formatText(content.text, content)
    }

    textContainer.appendChild(textElement)

    // 添加元数据（如果需要）
    if (this.shouldShowMetadata(options)) {
      const metadataElement = this.createMetadataElement(content)
      textContainer.appendChild(metadataElement)
    }

    container.appendChild(textContainer)

    // 应用动画效果
    this.applyTextAnimations(textContainer, content)
  }

  cleanup(container: HTMLElement): void {
    // 清理事件监听器和资源
    const textContainer = container.querySelector('.multimodal-text-content')
    if (textContainer) {
      // 移除所有事件监听器
      const elements = textContainer.querySelectorAll('*')
      elements.forEach((element) => {
        const clone = element.cloneNode(true) as HTMLElement
        element.parentNode?.replaceChild(clone, element)
      })
    }
  }

  private applyTextStyles(
    container: HTMLElement,
    content: MultimodalContent,
    options: RenderOptions
  ): void {
    const styles = {
      fontFamily: this.getFontFamily(content),
      fontSize: this.getFontSize(options),
      lineHeight: '1.6',
      color: this.getTextColor(options),
      textAlign: 'left' as const,
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: this.getBackgroundColor(options),
      boxShadow: options.optimizeFor === 'web' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      maxWidth: '800px',
      margin: '0 auto',
    }

    Object.assign(container.style, styles)

    // 添加响应式样式
    if (options.optimizeFor === 'mobile') {
      Object.assign(container.style, {
        fontSize: '16px',
        padding: '15px',
        maxWidth: '100%',
      })
    }
  }

  private formatText(text: string, _content: MultimodalContent): string {
    let formattedText = text

    // 处理换行
    formattedText = formattedText.replace(/\n/g, '<br>')

    // 处理段落
    formattedText = formattedText.replace(/\n\n/g, '</p><p>')

    // 如果没有段落标签，添加默认段落
    if (!formattedText.includes('<p>')) {
      formattedText = `<p>${formattedText}</p>`
    }

    // 处理强调文本（简单的markdown支持）
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')

    // 处理链接（如果有的话）
    formattedText = formattedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )

    return formattedText
  }

  private shouldShowMetadata(options: RenderOptions): boolean {
    // 在开发模式或高质量模式下显示元数据
    return options.quality === 'high' || options.optimizeFor === 'web'
  }

  private createMetadataElement(content: MultimodalContent): HTMLElement {
    const metadataContainer = document.createElement('div')
    metadataContainer.className = 'text-metadata'
    metadataContainer.style.cssText = `
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #eee;
      font-size: 0.9em;
      color: #666;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    `

    // 添加生成信息
    if (content.metadata?.generated) {
      const generatedBadge = document.createElement('span')
      generatedBadge.className = 'metadata-badge'
      generatedBadge.textContent = '🤖 AI生成'
      generatedBadge.style.cssText = `
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
      `
      metadataContainer.appendChild(generatedBadge)
    }

    // 添加情感信息
    if (content.sentiment) {
      const sentimentBadge = document.createElement('span')
      sentimentBadge.className = 'metadata-badge'
      sentimentBadge.textContent = `😊 ${content.sentiment.label}`
      sentimentBadge.style.cssText = `
        background: ${this.getSentimentColor(content.sentiment.label)};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
      `
      metadataContainer.appendChild(sentimentBadge)
    }

    // 添加关键词
    if (content.keywords && content.keywords.length > 0) {
      const keywordsContainer = document.createElement('div')
      keywordsContainer.className = 'keywords'
      keywordsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 10px;
      `

      content.keywords.slice(0, 5).forEach((keyword) => {
        const keywordBadge = document.createElement('span')
        keywordBadge.className = 'keyword-badge'
        keywordBadge.textContent = `#${keyword}`
        keywordBadge.style.cssText = `
          background: #f5f5f5;
          color: #666;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 0.8em;
        `
        keywordsContainer.appendChild(keywordBadge)
      })

      metadataContainer.appendChild(keywordsContainer)
    }

    return metadataContainer
  }

  private applyTextAnimations(container: HTMLElement, content: MultimodalContent): void {
    // 添加淡入动画
    container.style.opacity = '0'
    container.style.transform = 'translateY(20px)'
    container.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'

    // 使用requestAnimationFrame确保DOM更新后再应用动画
    requestAnimationFrame(() => {
      container.style.opacity = '1'
      container.style.transform = 'translateY(0)'
    })

    // 为文本添加打字机效果（如果启用）
    if (content.metadata?.typingEffect) {
      this.applyTypingEffect(container)
    }
  }

  private applyTypingEffect(container: HTMLElement): void {
    const textElement = container.querySelector('.text-body') as HTMLElement
    if (!textElement) return

    const originalText = textElement.textContent || ''
    textElement.textContent = ''

    let index = 0
    const typeInterval = setInterval(() => {
      if (index < originalText.length) {
        textElement.textContent += originalText[index]
        index++
      } else {
        clearInterval(typeInterval)
      }
    }, 50)
  }

  private getFontFamily(content: MultimodalContent): string {
    // 根据内容类型选择字体
    if (content.metadata?.style === 'poetry') {
      return '"Times New Roman", serif'
    }
    if (content.metadata?.style === 'technical') {
      return '"Consolas", "Monaco", monospace'
    }
    return '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
  }

  private getFontSize(options: RenderOptions): string {
    const baseSize = options.optimizeFor === 'mobile' ? 16 : 18
    return `${baseSize}px`
  }

  private getTextColor(options: RenderOptions): string {
    return options.optimizeFor === 'print' ? '#000' : '#333'
  }

  private getBackgroundColor(options: RenderOptions): string {
    return options.optimizeFor === 'print' ? '#fff' : '#fff'
  }

  private getSentimentColor(sentiment: string): string {
    const colors = {
      positive: '#4caf50',
      negative: '#f44336',
      neutral: '#9e9e9e',
    }
    return colors[sentiment as keyof typeof colors] || colors.neutral
  }
}
