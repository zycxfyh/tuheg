// 多模态叙事类型定义

// 多模态内容类型
export type MultimodalType = 'text' | 'image' | 'audio' | 'video' | 'interactive'

// 叙事片段类型
export interface NarrativeSegment {
  id: string
  type: MultimodalType
  content: string | MultimodalContent
  metadata: SegmentMetadata
  timing?: SegmentTiming
  interactions?: SegmentInteraction[]
}

// 多模态内容
export interface MultimodalContent {
  text?: string
  image?: ImageContent
  audio?: AudioContent
  video?: VideoContent
  interactive?: InteractiveContent
}

// 图像内容
export interface ImageContent {
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
  generated?: boolean
  prompt?: string
  style?: string
}

// 音频内容
export interface AudioContent {
  url: string
  duration: number
  format: string
  transcript?: string
  generated?: boolean
  voice?: string
  language?: string
}

// 视频内容
export interface VideoContent {
  url: string
  duration: number
  thumbnail?: string
  format: string
  transcript?: string
  generated?: boolean
  scenes?: VideoScene[]
}

// 视频场景
export interface VideoScene {
  startTime: number
  endTime: number
  description: string
  image?: ImageContent
}

// 交互内容
export interface InteractiveContent {
  type: 'choice' | 'input' | 'gesture' | 'timer'
  options?: ChoiceOption[]
  inputType?: 'text' | 'number' | 'select'
  placeholder?: string
  validation?: InputValidation
  timeout?: number
}

// 选择选项
export interface ChoiceOption {
  id: string
  text: string
  image?: ImageContent
  audio?: AudioContent
  consequence?: string
}

// 输入验证
export interface InputValidation {
  required: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  customValidator?: (value: string) => boolean
}

// 片段元数据
export interface SegmentMetadata {
  author: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  mood?: string
  setting?: string
  characters?: string[]
  themes?: string[]
  aiGenerated?: boolean
  aiModel?: string
  generationParams?: Record<string, any>
}

// 片段时序
export interface SegmentTiming {
  duration: number // 毫秒
  delay?: number // 播放前延迟
  transition?: TransitionEffect
  autoAdvance?: boolean
  pauseOnInteraction?: boolean
}

// 过渡效果
export interface TransitionEffect {
  type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve'
  duration: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

// 片段交互
export interface SegmentInteraction {
  id: string
  type: 'click' | 'hover' | 'gesture' | 'voice' | 'timer'
  target: string // 目标元素ID或选择器
  action: InteractionAction
  conditions?: InteractionCondition[]
}

// 交互动作
export interface InteractionAction {
  type: 'navigate' | 'play' | 'pause' | 'show' | 'hide' | 'modify' | 'generate'
  target?: string
  value?: any
  delay?: number
}

// 交互条件
export interface InteractionCondition {
  type: 'time' | 'variable' | 'choice' | 'input'
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists'
  value: any
  variable?: string
}

// 多模态叙事
export interface MultimodalNarrative {
  id: string
  title: string
  description: string
  author: string
  version: string
  segments: NarrativeSegment[]
  metadata: NarrativeMetadata
  settings: NarrativeSettings
  variables: Record<string, any>
  assets: NarrativeAsset[]
}

// 叙事元数据
export interface NarrativeMetadata {
  genre: string[]
  themes: string[]
  targetAudience: string
  language: string
  estimatedDuration: number
  difficulty: 'easy' | 'medium' | 'hard'
  interactiveElements: boolean
  aiGenerated: boolean
  createdAt: Date
  updatedAt: Date
}

// 叙事设置
export interface NarrativeSettings {
  autoplay: boolean
  showCaptions: boolean
  enableVoice: boolean
  voiceSettings?: VoiceSettings
  visualStyle: 'realistic' | 'cartoon' | 'abstract' | 'minimalist'
  colorScheme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  accessibility: AccessibilitySettings
}

// 语音设置
export interface VoiceSettings {
  voice: string
  speed: number
  pitch: number
  volume: number
  language: string
}

// 无障碍设置
export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  screenReader: boolean
  captions: boolean
}

// 叙事资源
export interface NarrativeAsset {
  id: string
  type: 'image' | 'audio' | 'video' | 'font' | 'style'
  url: string
  name: string
  size: number
  metadata?: Record<string, any>
}

// 生成选项
export interface GenerationOptions {
  style?: string
  mood?: string
  length?: 'short' | 'medium' | 'long'
  complexity?: 'simple' | 'moderate' | 'complex'
  includeImages?: boolean
  includeAudio?: boolean
  interactive?: boolean
  targetAudience?: string
  customPrompts?: Record<string, string>
}

// 渲染选项
export interface RenderOptions {
  format: 'html' | 'json' | 'markdown' | 'pdf'
  includeAssets: boolean
  compressAssets: boolean
  optimizeFor: 'web' | 'mobile' | 'print'
  quality: 'low' | 'medium' | 'high'
}

// 播放状态
export interface PlaybackState {
  currentSegment: number
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  fullscreen: boolean
  captions: boolean
}

// 用户进度
export interface UserProgress {
  narrativeId: string
  userId: string
  currentSegment: number
  completedSegments: number[]
  choices: Record<string, string>
  variables: Record<string, any>
  bookmarks: number[]
  notes: ProgressNote[]
  startedAt: Date
  lastPlayedAt: Date
  totalPlayTime: number
}

// 进度笔记
export interface ProgressNote {
  segmentId: string
  timestamp: Date
  content: string
  type: 'note' | 'highlight' | 'question'
}

// 分析数据
export interface NarrativeAnalytics {
  views: number
  completions: number
  averagePlayTime: number
  dropOffPoints: number[]
  popularChoices: Record<string, number>
  userRatings: number[]
  engagementMetrics: EngagementMetrics
}

// 参与度指标
export interface EngagementMetrics {
  averageAttention: number
  interactionRate: number
  completionRate: number
  replayRate: number
  shareRate: number
}

// AI生成配置
export interface AIGenerationConfig {
  textModel: string
  imageModel: string
  audioModel: string
  videoModel: string
  temperature: number
  maxTokens: number
  stylePrompts: Record<string, string>
  qualitySettings: Record<string, any>
}

// 多模态处理器
export interface MultimodalProcessor {
  canProcess(type: MultimodalType): boolean
  process(content: any, options?: any): Promise<MultimodalContent>
  validate(content: any): boolean
}

// 多模态生成器
export interface MultimodalGenerator {
  canGenerate(type: MultimodalType): boolean
  generate(prompt: string, options?: GenerationOptions): Promise<MultimodalContent>
  getSupportedStyles(): string[]
}

// 多模态渲染器
export interface MultimodalRenderer {
  canRender(type: MultimodalType): boolean
  render(content: MultimodalContent, container: HTMLElement, options?: RenderOptions): Promise<void>
  cleanup(container: HTMLElement): void
}
