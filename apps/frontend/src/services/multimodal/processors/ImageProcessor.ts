// 图像处理器
// 处理图像内容的分析、转换和增强

import { MultimodalProcessor, MultimodalContent, MultimodalType, ImageContent } from '../types'

export class ImageProcessor implements MultimodalProcessor {
  canProcess(type: MultimodalType): boolean {
    return type === 'image'
  }

  async process(content: any, options: any = {}): Promise<MultimodalContent> {
    if (content instanceof File) {
      return this.processFile(content, options)
    }

    if (content.url) {
      return this.processUrl(content.url, options)
    }

    if (typeof content === 'string') {
      return this.processUrl(content, options)
    }

    throw new Error('Invalid image content')
  }

  validate(content: any): boolean {
    if (content instanceof File) {
      return content.type.startsWith('image/')
    }

    if (typeof content === 'string') {
      return this.isValidImageUrl(content)
    }

    if (content.url) {
      return this.isValidImageUrl(content.url)
    }

    return false
  }

  private async processFile(file: File, options: any): Promise<MultimodalContent> {
    const imageContent: ImageContent = {
      url: URL.createObjectURL(file),
      alt: file.name,
      generated: false,
    }

    // 获取图像信息
    const imageInfo = await this.getImageInfo(file)
    imageContent.width = imageInfo.width
    imageContent.height = imageInfo.height

    // 分析图像内容
    if (options.analyzeContent) {
      imageContent.description = await this.analyzeImage(file)
    }

    // 生成缩略图
    if (options.generateThumbnail) {
      imageContent.thumbnail = await this.generateThumbnail(file, 200, 200)
    }

    // 提取颜色主题
    if (options.extractColors) {
      imageContent.colors = await this.extractColors(file)
    }

    // 检测文本
    if (options.detectText) {
      imageContent.text = await this.detectText(file)
    }

    return { image: imageContent }
  }

  private async processUrl(url: string, options: any): Promise<MultimodalContent> {
    if (!this.isValidImageUrl(url)) {
      throw new Error('Invalid image URL')
    }

    const imageContent: ImageContent = {
      url,
      alt: this.extractFilename(url),
      generated: false,
    }

    // 获取图像信息
    try {
      const imageInfo = await this.getImageInfoFromUrl(url)
      imageContent.width = imageInfo.width
      imageContent.height = imageInfo.height
    } catch (error) {
      console.warn('Failed to get image info from URL:', error)
    }

    // 分析图像内容
    if (options.analyzeContent) {
      imageContent.description = await this.analyzeImageFromUrl(url)
    }

    return { image: imageContent }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff?)(\?.*)?$/i.test(parsedUrl.pathname)
    } catch {
      return false
    }
  }

  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname
      const filename = pathname.split('/').pop() || 'image'
      return filename.split('.')[0] // 移除扩展名
    } catch {
      return 'image'
    }
  }

  private async getImageInfo(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  private async getImageInfoFromUrl(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      }
      img.onerror = reject
      img.src = url
    })
  }

  private async analyzeImage(file: File): Promise<string> {
    // 简化的图像分析实现
    // 在实际应用中，应该调用AI图像识别服务

    const canvas = await this.fileToCanvas(file)
    const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)

    if (!imageData) return '无法分析图像'

    // 简化的颜色分析
    const colors = this.analyzeColors(imageData.data)
    const brightness = this.calculateBrightness(imageData.data)

    let description = ''

    if (brightness > 200) {
      description += '明亮的'
    } else if (brightness < 50) {
      description += '昏暗的'
    } else {
      description += '正常亮度的'
    }

    const dominantColor = this.getDominantColor(colors)
    description += `、以${dominantColor}为主色调的图像`

    return description
  }

  private async analyzeImageFromUrl(url: string): Promise<string> {
    // 从URL分析图像的简化实现
    return `从 ${url} 加载的图像`
  }

  private async generateThumbnail(
    file: File,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    const canvas = await this.fileToCanvas(file)
    const thumbnailCanvas = this.resizeCanvas(canvas, maxWidth, maxHeight)

    return thumbnailCanvas.toDataURL('image/jpeg', 0.8)
  }

  private async extractColors(file: File): Promise<string[]> {
    const canvas = await this.fileToCanvas(file)
    const ctx = canvas.getContext('2d')
    if (!ctx) return []

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const colors = this.analyzeColors(imageData.data)

    // 返回最主要的几种颜色
    return colors.slice(0, 5).map((color) => color.name)
  }

  private async detectText(file: File): Promise<string> {
    // 简化的OCR实现
    // 在实际应用中，应该调用OCR服务
    return '图像中可能包含文本，但需要OCR服务进行识别'
  }

  private async fileToCanvas(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)

        resolve(canvas)
        URL.revokeObjectURL(img.src)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  private resizeCanvas(
    canvas: HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number
  ): HTMLCanvasElement {
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
    const newWidth = canvas.width * ratio
    const newHeight = canvas.height * ratio

    const newCanvas = document.createElement('canvas')
    const newCtx = newCanvas.getContext('2d')
    if (!newCtx) throw new Error('Failed to get canvas context')

    newCanvas.width = newWidth
    newCanvas.height = newHeight
    newCtx.drawImage(canvas, 0, 0, newWidth, newHeight)

    return newCanvas
  }

  private analyzeColors(
    data: Uint8ClampedArray
  ): Array<{ r: number; g: number; b: number; count: number; name: string }> {
    const colorMap: Map<string, { r: number; g: number; b: number; count: number }> = new Map()

    // 采样图像中的像素
    const step = 10 // 每10个像素采样一次
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // 量化颜色（减少颜色数量）
      const quantizedR = Math.round(r / 32) * 32
      const quantizedG = Math.round(g / 32) * 32
      const quantizedB = Math.round(b / 32) * 32

      const key = `${quantizedR}-${quantizedG}-${quantizedB}`
      const existing = colorMap.get(key)
      if (existing) {
        existing.count++
      } else {
        colorMap.set(key, { r: quantizedR, g: quantizedG, b: quantizedB, count: 1 })
      }
    }

    // 转换为数组并排序
    return Array.from(colorMap.entries())
      .map(([key, color]) => ({
        ...color,
        name: this.colorToName(color.r, color.g, color.b),
      }))
      .sort((a, b) => b.count - a.count)
  }

  private colorToName(r: number, g: number, b: number): string {
    // 简化的颜色命名
    const colors = [
      { name: '红色', r: 255, g: 0, b: 0 },
      { name: '绿色', r: 0, g: 255, b: 0 },
      { name: '蓝色', r: 0, g: 0, b: 255 },
      { name: '黄色', r: 255, g: 255, b: 0 },
      { name: '紫色', r: 255, g: 0, b: 255 },
      { name: '青色', r: 0, g: 255, b: 255 },
      { name: '白色', r: 255, g: 255, b: 255 },
      { name: '黑色', r: 0, g: 0, b: 0 },
      { name: '灰色', r: 128, g: 128, b: 128 },
    ]

    let closestColor = colors[0]
    let minDistance = Infinity

    for (const color of colors) {
      const distance = Math.sqrt(
        Math.pow(r - color.r, 2) + Math.pow(g - color.g, 2) + Math.pow(b - color.b, 2)
      )

      if (distance < minDistance) {
        minDistance = distance
        closestColor = color
      }
    }

    return closestColor.name
  }

  private calculateBrightness(data: Uint8ClampedArray): number {
    let totalBrightness = 0
    const pixelCount = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // 使用相对亮度公式
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b
      totalBrightness += brightness
    }

    return totalBrightness / pixelCount
  }

  private getDominantColor(
    colors: Array<{ r: number; g: number; b: number; count: number; name: string }>
  ): string {
    return colors[0]?.name || '未知'
  }
}
