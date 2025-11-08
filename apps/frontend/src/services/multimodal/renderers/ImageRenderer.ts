// 图像渲染器
// 将图像内容渲染到DOM中

import {
  MultimodalRenderer,
  MultimodalContent,
  MultimodalType,
  RenderOptions,
  ImageContent,
} from '../types'

export class ImageRenderer implements MultimodalRenderer {
  canRender(type: MultimodalType): boolean {
    return type === 'image'
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
    if (!content.image) {
      throw new Error('No image content to render')
    }

    // 清空容器
    container.innerHTML = ''

    // 创建图像容器
    const imageContainer = document.createElement('div')
    imageContainer.className = 'multimodal-image-content'

    // 应用样式
    this.applyImageStyles(imageContainer, content.image, options)

    // 创建图像元素
    const imageElement = await this.createImageElement(content.image, options)
    imageContainer.appendChild(imageElement)

    // 添加说明文字
    if (content.image.caption || content.image.alt) {
      const captionElement = this.createCaptionElement(content.image)
      imageContainer.appendChild(captionElement)
    }

    // 添加元数据
    if (this.shouldShowMetadata(options)) {
      const metadataElement = this.createMetadataElement(content.image)
      imageContainer.appendChild(metadataElement)
    }

    container.appendChild(imageContainer)

    // 应用动画效果
    this.applyImageAnimations(imageContainer, content.image)
  }

  cleanup(container: HTMLElement): void {
    // 清理事件监听器和资源
    const imageContainer = container.querySelector('.multimodal-image-content')
    if (imageContainer) {
      const img = imageContainer.querySelector('img') as HTMLImageElement
      if (img) {
        // 清理对象URL
        if (img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src)
        }
      }
    }
  }

  private applyImageStyles(
    container: HTMLElement,
    image: ImageContent,
    options: RenderOptions
  ): void {
    const styles = {
      textAlign: 'center' as const,
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: this.getBackgroundColor(options),
      boxShadow: options.optimizeFor === 'web' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      maxWidth: '800px',
      margin: '0 auto',
    }

    Object.assign(container.style, styles)
  }

  private async createImageElement(
    image: ImageContent,
    options: RenderOptions
  ): Promise<HTMLImageElement> {
    const img = document.createElement('img')
    img.src = image.url
    img.alt = image.alt || 'Generated image'
    img.className = 'multimodal-image'

    // 设置图像样式
    const imgStyles = {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '4px',
      display: 'block',
      margin: '0 auto',
      cursor: options.optimizeFor === 'web' ? 'zoom-in' : 'default',
    }

    Object.assign(img.style, imgStyles)

    // 添加加载状态
    img.style.opacity = '0'
    img.style.transition = 'opacity 0.3s ease-in'

    return new Promise((resolve, reject) => {
      img.onload = () => {
        img.style.opacity = '1'
        this.addImageInteractions(img, image, options)
        resolve(img)
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${image.url}`))
      }
    })
  }

  private createCaptionElement(image: ImageContent): HTMLElement {
    const caption = document.createElement('div')
    caption.className = 'image-caption'
    caption.textContent = image.caption || image.alt || ''
    caption.style.cssText = `
      margin-top: 12px;
      font-size: 14px;
      color: #666;
      text-align: center;
      font-style: italic;
    `

    return caption
  }

  private createMetadataElement(image: ImageContent): HTMLElement {
    const metadata = document.createElement('div')
    metadata.className = 'image-metadata'
    metadata.style.cssText = `
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    `

    const metadataItems = []

    // 生成状态
    if (image.generated) {
      metadataItems.push(this.createMetadataBadge('🤖 AI生成', '#e3f2fd', '#1976d2'))
    }

    // 风格信息
    if (image.style) {
      metadataItems.push(this.createMetadataBadge(image.style, '#f3e5f5', '#7b1fa2'))
    }

    // 尺寸信息
    if (image.width && image.height) {
      metadataItems.push(
        this.createMetadataBadge(`${image.width}×${image.height}`, '#e8f5e8', '#388e3c')
      )
    }

    // 提示词（如果有）
    if (image.prompt) {
      const promptPreview =
        image.prompt.length > 30 ? image.prompt.substring(0, 27) + '...' : image.prompt
      metadataItems.push(this.createMetadataBadge(`"${promptPreview}"`, '#fff3e0', '#f57c00'))
    }

    metadataItems.forEach((item) => metadata.appendChild(item))

    return metadata
  }

  private createMetadataBadge(text: string, bgColor: string, textColor: string): HTMLElement {
    const badge = document.createElement('span')
    badge.className = 'metadata-badge'
    badge.textContent = text
    badge.style.cssText = `
      background-color: ${bgColor};
      color: ${textColor};
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 11px;
      white-space: nowrap;
    `

    return badge
  }

  private addImageInteractions(
    img: HTMLImageElement,
    image: ImageContent,
    options: RenderOptions
  ): void {
    if (options.optimizeFor !== 'web') return

    // 点击放大功能
    img.addEventListener('click', () => {
      this.showImageModal(image)
    })

    // 鼠标悬停效果
    img.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.02)'
      img.style.transition = 'transform 0.2s ease'
    })

    img.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)'
    })

    // 加载失败处理
    img.addEventListener('error', () => {
      img.style.display = 'none'
      const errorMsg = document.createElement('div')
      errorMsg.textContent = '图片加载失败'
      errorMsg.style.cssText = `
        padding: 40px;
        background: #f5f5f5;
        color: #666;
        text-align: center;
        border-radius: 4px;
      `
      img.parentNode?.replaceChild(errorMsg, img)
    })
  }

  private showImageModal(image: ImageContent): void {
    // 创建模态框
    const modal = document.createElement('div')
    modal.className = 'image-modal-overlay'
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
    `

    const modalImg = document.createElement('img')
    modalImg.src = image.url
    modalImg.alt = image.alt || 'Enlarged image'
    modalImg.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `

    modal.appendChild(modalImg)

    // 点击关闭
    modal.addEventListener('click', () => {
      document.body.removeChild(modal)
    })

    // ESC键关闭
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(modal)
        document.removeEventListener('keydown', handleKeydown)
      }
    }
    document.addEventListener('keydown', handleKeydown)

    document.body.appendChild(modal)
  }

  private applyImageAnimations(container: HTMLElement, image: ImageContent): void {
    // 添加淡入动画
    container.style.opacity = '0'
    container.style.transform = 'translateY(20px)'
    container.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'

    requestAnimationFrame(() => {
      container.style.opacity = '1'
      container.style.transform = 'translateY(0)'
    })
  }

  private shouldShowMetadata(options: RenderOptions): boolean {
    return options.quality === 'high' || options.includeAssets
  }

  private getBackgroundColor(options: RenderOptions): string {
    return options.optimizeFor === 'print' ? '#fff' : '#fafafa'
  }
}
