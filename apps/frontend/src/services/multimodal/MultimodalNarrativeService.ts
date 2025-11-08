// 多模态叙事服务核心类
// 负责管理多模态叙事内容的创建、编辑、播放和分析

import {
  MultimodalNarrative,
  NarrativeSegment,
  PlaybackState,
  UserProgress,
  GenerationOptions,
  RenderOptions,
  MultimodalType,
  MultimodalContent,
  NarrativeAnalytics,
} from './types'
import { MultimodalProcessor } from './processors'
import { MultimodalGenerator } from './generators'
import { MultimodalRenderer } from './renderers'
import { apiService } from '../api.service'

export class MultimodalNarrativeService {
  private narratives: Map<string, MultimodalNarrative> = new Map()
  private processors: Map<MultimodalType, MultimodalProcessor> = new Map()
  private generators: Map<MultimodalType, MultimodalGenerator> = new Map()
  private renderers: Map<MultimodalType, MultimodalRenderer> = new Map()
  private playbackStates: Map<string, PlaybackState> = new Map()
  private userProgress: Map<string, UserProgress> = new Map()

  // 注册处理器
  registerProcessor(type: MultimodalType, processor: MultimodalProcessor): void {
    this.processors.set(type, processor)
  }

  // 注册生成器
  registerGenerator(type: MultimodalType, generator: MultimodalGenerator): void {
    this.generators.set(type, generator)
  }

  // 注册渲染器
  registerRenderer(type: MultimodalType, renderer: MultimodalRenderer): void {
    this.renderers.set(type, renderer)
  }

  // 创建多模态叙事
  async createNarrative(title: string, description: string): Promise<MultimodalNarrative> {
    const narrative: MultimodalNarrative = {
      id: `narrative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      author: 'current-user', // TODO: 获取当前用户信息
      version: '1.0.0',
      segments: [],
      metadata: {
        genre: [],
        themes: [],
        targetAudience: 'general',
        language: 'zh-CN',
        estimatedDuration: 0,
        difficulty: 'medium',
        interactiveElements: false,
        aiGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      settings: {
        autoplay: false,
        showCaptions: true,
        enableVoice: false,
        visualStyle: 'realistic',
        colorScheme: 'auto',
        fontSize: 'medium',
        accessibility: {
          highContrast: false,
          largeText: false,
          reducedMotion: false,
          screenReader: false,
          captions: true,
        },
      },
      variables: {},
      assets: [],
    }

    this.narratives.set(narrative.id, narrative)

    // 保存到后端
    await this.saveNarrative(narrative)

    return narrative
  }

  // 加载叙事
  async loadNarrative(id: string): Promise<MultimodalNarrative | null> {
    // 首先检查本地缓存
    if (this.narratives.has(id)) {
      return this.narratives.get(id)!
    }

    // 从后端加载
    try {
      const response = await apiService.get(`/narratives/${id}`)
      const narrative = response.data as MultimodalNarrative

      // 缓存到本地
      this.narratives.set(id, narrative)

      return narrative
    } catch (error) {
      console.error(`Failed to load narrative ${id}:`, error)
      return null
    }
  }

  // 保存叙事
  async saveNarrative(narrative: MultimodalNarrative): Promise<void> {
    try {
      narrative.metadata.updatedAt = new Date()

      if (narrative.id.startsWith('narrative-')) {
        // 新建叙事
        const response = await apiService.post('/narratives', narrative)
        const savedNarrative = response.data as MultimodalNarrative
        this.narratives.set(savedNarrative.id, savedNarrative)
      } else {
        // 更新现有叙事
        await apiService.put(`/narratives/${narrative.id}`, narrative)
        this.narratives.set(narrative.id, narrative)
      }
    } catch (error) {
      console.error(`Failed to save narrative ${narrative.id}:`, error)
      throw error
    }
  }

  // 删除叙事
  async deleteNarrative(id: string): Promise<void> {
    try {
      await apiService.delete(`/narratives/${id}`)
      this.narratives.delete(id)
    } catch (error) {
      console.error(`Failed to delete narrative ${id}:`, error)
      throw error
    }
  }

  // 添加叙事片段
  async addSegment(
    narrativeId: string,
    segment: Omit<NarrativeSegment, 'id'>
  ): Promise<NarrativeSegment> {
    const narrative = await this.loadNarrative(narrativeId)
    if (!narrative) {
      throw new Error(`Narrative ${narrativeId} not found`)
    }

    const newSegment: NarrativeSegment = {
      ...segment,
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    narrative.segments.push(newSegment)
    await this.saveNarrative(narrative)

    return newSegment
  }

  // 更新叙事片段
  async updateSegment(
    narrativeId: string,
    segmentId: string,
    updates: Partial<NarrativeSegment>
  ): Promise<void> {
    const narrative = await this.loadNarrative(narrativeId)
    if (!narrative) {
      throw new Error(`Narrative ${narrativeId} not found`)
    }

    const segmentIndex = narrative.segments.findIndex((s) => s.id === segmentId)
    if (segmentIndex === -1) {
      throw new Error(`Segment ${segmentId} not found in narrative ${narrativeId}`)
    }

    narrative.segments[segmentIndex] = {
      ...narrative.segments[segmentIndex],
      ...updates,
    }

    await this.saveNarrative(narrative)
  }

  // 删除叙事片段
  async removeSegment(narrativeId: string, segmentId: string): Promise<void> {
    const narrative = await this.loadNarrative(narrativeId)
    if (!narrative) {
      throw new Error(`Narrative ${narrativeId} not found`)
    }

    narrative.segments = narrative.segments.filter((s) => s.id !== segmentId)
    await this.saveNarrative(narrative)
  }

  // 生成多模态内容
  async generateContent(
    type: MultimodalType,
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<MultimodalContent> {
    const generator = this.generators.get(type)
    if (!generator) {
      throw new Error(`No generator available for type: ${type}`)
    }

    return await generator.generate(prompt, options)
  }

  // 处理多模态内容
  async processContent(
    type: MultimodalType,
    content: any,
    options: any = {}
  ): Promise<MultimodalContent> {
    const processor = this.processors.get(type)
    if (!processor) {
      throw new Error(`No processor available for type: ${type}`)
    }

    return await processor.process(content, options)
  }

  // 渲染多模态内容
  async renderContent(
    type: MultimodalType,
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
    const renderer = this.renderers.get(type)
    if (!renderer) {
      throw new Error(`No renderer available for type: ${type}`)
    }

    return await renderer.render(content, container, options)
  }

  // 开始播放叙事
  async playNarrative(narrativeId: string, container: HTMLElement): Promise<void> {
    const narrative = await this.loadNarrative(narrativeId)
    if (!narrative) {
      throw new Error(`Narrative ${narrativeId} not found`)
    }

    const playbackState: PlaybackState = {
      currentSegment: 0,
      isPlaying: true,
      isPaused: false,
      currentTime: 0,
      duration: this.calculateTotalDuration(narrative),
      volume: 1,
      muted: false,
      fullscreen: false,
      captions: narrative.settings.showCaptions,
    }

    this.playbackStates.set(narrativeId, playbackState)

    // 开始播放第一个片段
    await this.playSegment(narrative, 0, container)
  }

  // 暂停播放
  pauseNarrative(narrativeId: string): void {
    const playbackState = this.playbackStates.get(narrativeId)
    if (playbackState) {
      playbackState.isPlaying = false
      playbackState.isPaused = true
    }
  }

  // 继续播放
  resumeNarrative(narrativeId: string, container: HTMLElement): void {
    const playbackState = this.playbackStates.get(narrativeId)
    if (playbackState) {
      playbackState.isPlaying = true
      playbackState.isPaused = false

      // 继续播放当前片段
      const narrative = this.narratives.get(narrativeId)
      if (narrative) {
        this.playSegment(narrative, playbackState.currentSegment, container)
      }
    }
  }

  // 跳转到指定片段
  async seekToSegment(
    narrativeId: string,
    segmentIndex: number,
    container: HTMLElement
  ): Promise<void> {
    const narrative = await this.loadNarrative(narrativeId)
    if (!narrative || segmentIndex < 0 || segmentIndex >= narrative.segments.length) {
      throw new Error(`Invalid segment index: ${segmentIndex}`)
    }

    const playbackState = this.playbackStates.get(narrativeId)
    if (playbackState) {
      playbackState.currentSegment = segmentIndex
      playbackState.currentTime = this.calculateSegmentStartTime(narrative, segmentIndex)

      await this.playSegment(narrative, segmentIndex, container)
    }
  }

  // 获取播放状态
  getPlaybackState(narrativeId: string): PlaybackState | undefined {
    return this.playbackStates.get(narrativeId)
  }

  // 保存用户进度
  async saveProgress(
    narrativeId: string,
    userId: string,
    progress: Partial<UserProgress>
  ): Promise<void> {
    const key = `${userId}-${narrativeId}`
    const existingProgress = this.userProgress.get(key) || {
      narrativeId,
      userId,
      currentSegment: 0,
      completedSegments: [],
      choices: {},
      variables: {},
      bookmarks: [],
      notes: [],
      startedAt: new Date(),
      lastPlayedAt: new Date(),
      totalPlayTime: 0,
    }

    const updatedProgress: UserProgress = {
      ...existingProgress,
      ...progress,
      lastPlayedAt: new Date(),
    }

    this.userProgress.set(key, updatedProgress)

    // 保存到后端
    try {
      await apiService.post(`/progress/${narrativeId}`, updatedProgress)
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  // 加载用户进度
  async loadProgress(narrativeId: string, userId: string): Promise<UserProgress | null> {
    const key = `${userId}-${narrativeId}`

    // 首先检查本地缓存
    if (this.userProgress.has(key)) {
      return this.userProgress.get(key)!
    }

    // 从后端加载
    try {
      const response = await apiService.get(`/progress/${narrativeId}`)
      const progress = response.data as UserProgress
      this.userProgress.set(key, progress)
      return progress
    } catch (error) {
      return null
    }
  }

  // 获取叙事分析数据
  async getAnalytics(narrativeId: string): Promise<NarrativeAnalytics> {
    try {
      const response = await apiService.get(`/narratives/${narrativeId}/analytics`)
      return response.data as NarrativeAnalytics
    } catch (error) {
      console.error(`Failed to load analytics for narrative ${narrativeId}:`, error)
      // 返回默认分析数据
      return {
        views: 0,
        completions: 0,
        averagePlayTime: 0,
        dropOffPoints: [],
        popularChoices: {},
        userRatings: [],
        engagementMetrics: {
          averageAttention: 0,
          interactionRate: 0,
          completionRate: 0,
          replayRate: 0,
          shareRate: 0,
        },
      }
    }
  }

  // 导出叙事
  async exportNarrative(narrativeId: string, format: string): Promise<any> {
    const narrative = await this.loadNarrative(narrativeId)
    if (!narrative) {
      throw new Error(`Narrative ${narrativeId} not found`)
    }

    switch (format) {
      case 'json':
        return narrative
      case 'html':
        return this.exportAsHTML(narrative)
      case 'markdown':
        return this.exportAsMarkdown(narrative)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // 私有方法

  private async playSegment(
    narrative: MultimodalNarrative,
    segmentIndex: number,
    container: HTMLElement
  ): Promise<void> {
    const segment = narrative.segments[segmentIndex]
    if (!segment) return

    // 清理容器
    container.innerHTML = ''

    // 渲染片段内容
    if (typeof segment.content === 'string') {
      // 纯文本内容
      await this.renderContent('text', { text: segment.content }, container)
    } else {
      // 多模态内容
      const multimodalContent = segment.content as MultimodalContent
      for (const [type, content] of Object.entries(multimodalContent)) {
        if (content) {
          await this.renderContent(type as MultimodalType, multimodalContent, container)
        }
      }
    }

    // 处理交互元素
    if (segment.interactions) {
      this.setupInteractions(narrative.id, segment, container)
    }

    // 自动前进或等待
    if (segment.timing?.autoAdvance && !segment.timing.pauseOnInteraction) {
      setTimeout(() => {
        const nextIndex = segmentIndex + 1
        if (nextIndex < narrative.segments.length) {
          this.seekToSegment(narrative.id, nextIndex, container)
        }
      }, segment.timing.duration)
    }
  }

  private setupInteractions(
    narrativeId: string,
    segment: NarrativeSegment,
    container: HTMLElement
  ): void {
    // 设置交互事件监听器
    // 这里需要根据具体的交互类型实现
  }

  private calculateTotalDuration(narrative: MultimodalNarrative): number {
    return narrative.segments.reduce((total, segment) => {
      return total + (segment.timing?.duration || 3000) // 默认3秒
    }, 0)
  }

  private calculateSegmentStartTime(narrative: MultimodalNarrative, segmentIndex: number): number {
    let totalTime = 0
    for (let i = 0; i < segmentIndex; i++) {
      totalTime += narrative.segments[i].timing?.duration || 3000
    }
    return totalTime
  }

  private exportAsHTML(narrative: MultimodalNarrative): string {
    // 简化的HTML导出实现
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>${narrative.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .segment { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .segment img { max-width: 100%; height: auto; }
    .segment audio, .segment video { width: 100%; }
  </style>
</head>
<body>
  <h1>${narrative.title}</h1>
  <p>${narrative.description}</p>
`

    for (const segment of narrative.segments) {
      html += `<div class="segment">`

      if (typeof segment.content === 'string') {
        html += `<p>${segment.content}</p>`
      } else {
        const content = segment.content as MultimodalContent
        if (content.text) html += `<p>${content.text}</p>`
        if (content.image) html += `<img src="${content.image.url}" alt="${content.image.alt}">`
        if (content.audio) html += `<audio controls><source src="${content.audio.url}"></audio>`
        if (content.video) html += `<video controls><source src="${content.video.url}"></video>`
      }

      html += `</div>`
    }

    html += `
</body>
</html>`

    return html
  }

  private exportAsMarkdown(narrative: MultimodalNarrative): string {
    let markdown = `# ${narrative.title}\n\n`
    markdown += `${narrative.description}\n\n`

    for (let i = 0; i < narrative.segments.length; i++) {
      const segment = narrative.segments[i]
      markdown += `## Segment ${i + 1}\n\n`

      if (typeof segment.content === 'string') {
        markdown += `${segment.content}\n\n`
      } else {
        const content = segment.content as MultimodalContent
        if (content.text) markdown += `${content.text}\n\n`
        if (content.image) markdown += `![${content.image.alt}](${content.image.url})\n\n`
        if (content.audio) markdown += `[Audio](${content.audio.url})\n\n`
        if (content.video) markdown += `[Video](${content.video.url})\n\n`
      }
    }

    return markdown
  }
}
