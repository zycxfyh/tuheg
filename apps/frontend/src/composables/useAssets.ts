import { ref } from 'vue'

export interface CharacterCardData {
  name: string
  title?: string
  description: string
  attributes: Record<string, number>
  skills: string[]
  background: string
  image?: string
}

export interface AssetExportOptions {
  format: 'png' | 'jpg' | 'svg'
  quality?: number
  width?: number
  height?: number
}

export const useAssets = () => {
  const isExporting = ref(false)

  // 导出角色卡片
  const exportCharacterCard = async (
    characterData: CharacterCardData,
    options: AssetExportOptions = { format: 'png' }
  ): Promise<string> => {
    try {
      isExporting.value = true

      // 创建一个临时的canvas元素来渲染角色卡片
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      // 设置canvas尺寸
      const width = options.width || 800
      const height = options.height || 600
      canvas.width = width
      canvas.height = height

      // 设置背景
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, width, height)

      // 设置文字样式
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'

      // 绘制角色名称
      ctx.fillText(characterData.name, width / 2, 50)

      if (characterData.title) {
        ctx.font = '18px Arial'
        ctx.fillStyle = '#cccccc'
        ctx.fillText(characterData.title, width / 2, 80)
      }

      // 绘制描述
      ctx.font = '16px Arial'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      const descriptionLines = wrapText(ctx, characterData.description, width - 40, 16)
      descriptionLines.forEach((line, index) => {
        ctx.fillText(line, 20, 120 + index * 20)
      })

      // 绘制属性
      ctx.font = '14px Arial'
      ctx.fillStyle = '#4CAF50'
      let yOffset = 200
      Object.entries(characterData.attributes).forEach(([key, value]) => {
        ctx.fillText(`${key}: ${value}`, 20, yOffset)
        yOffset += 20
      })

      // 绘制技能
      if (characterData.skills.length > 0) {
        ctx.fillStyle = '#2196F3'
        yOffset += 20
        ctx.fillText('技能:', 20, yOffset)
        yOffset += 20
        characterData.skills.forEach((skill) => {
          ctx.fillText(`• ${skill}`, 40, yOffset)
          yOffset += 18
        })
      }

      // 导出为图片
      const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality = options.quality || (options.format === 'jpg' ? 0.8 : undefined)

      return canvas.toDataURL(mimeType, quality)
    } catch (error) {
      console.error('Failed to export character card:', error)
      throw error
    } finally {
      isExporting.value = false
    }
  }

  // 导出世界地图
  const exportWorldMap = async (
    _mapData: any,
    options: AssetExportOptions = { format: 'png' }
  ): Promise<string> => {
    try {
      isExporting.value = true

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      // 简化实现 - 创建一个基本的地图预览
      const width = options.width || 1024
      const height = options.height || 768
      canvas.width = width
      canvas.height = height

      // 设置背景
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, width, height)

      // 绘制简单的地图网格
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 1

      for (let x = 0; x < width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let y = 0; y < height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // 添加标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('世界地图预览', width / 2, 40)

      const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png'
      return canvas.toDataURL(mimeType, options.quality || 0.8)
    } catch (error) {
      console.error('Failed to export world map:', error)
      throw error
    } finally {
      isExporting.value = false
    }
  }

  // 下载资源
  const downloadAsset = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 文本换行辅助函数
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    _lineHeight: number
  ): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  return {
    // 状态
    isExporting,

    // 方法
    exportCharacterCard,
    exportWorldMap,
    downloadAsset,
  }
}
