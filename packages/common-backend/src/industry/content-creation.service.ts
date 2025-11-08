import { Injectable } from '@nestjs/common';
import { AiProviderService } from '../plugins/ai-provider.service';
import { ModelRouterService } from '../plugins/model-router.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ContentCreationRequest {
  type: 'marketing' | 'social' | 'brand' | 'video' | 'multilingual';
  topic: string;
  audience?: string;
  tone?: 'professional' | 'casual' | 'creative' | 'formal';
  length?: 'short' | 'medium' | 'long';
  platform?: string;
  brandGuidelines?: {
    voice: string;
    values: string[];
    restrictions: string[];
  };
  requirements?: Record<string, any>;
}

export interface ContentCreationResult {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    tone: string;
    seoScore?: number;
    brandAlignment?: number;
  };
  suggestions: string[];
  alternatives: string[];
}

@Injectable()
export class ContentCreationService {
  constructor(
    private aiProviderService: AiProviderService,
    private modelRouterService: ModelRouterService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== 营销内容生成 ====================

  /**
   * 生成营销文案
   */
  async generateMarketingCopy(request: ContentCreationRequest): Promise<ContentCreationResult> {
    const {
      topic,
      audience = 'general',
      tone = 'professional',
      length = 'medium',
      brandGuidelines
    } = request;

    // 构建提示词
    const prompt = this.buildMarketingPrompt({
      topic,
      audience,
      tone,
      length,
      brandGuidelines
    });

    // 选择合适的AI模型
    const routingRequest = {
      capabilities: ['text-generation', 'creative-writing'],
      priority: 'performance' as const,
      context: { contentType: 'marketing', tone, length }
    };

    const routingResult = await this.modelRouterService.routeRequest(routingRequest);

    // 生成内容
    const content = await this.generateContent(prompt, routingResult.model.id);

    // 分析内容质量
    const analysis = await this.analyzeContent(content, request);

    const result: ContentCreationResult = {
      content,
      metadata: {
        wordCount: this.countWords(content),
        readingTime: this.calculateReadingTime(content),
        tone,
        seoScore: analysis.seoScore,
        brandAlignment: analysis.brandAlignment
      },
      suggestions: analysis.suggestions,
      alternatives: []
    };

    this.eventEmitter.emit('industry.contentCreated', {
      type: 'marketing',
      request,
      result
    });

    return result;
  }

  /**
   * 生成社交媒体内容
   */
  async generateSocialMediaContent(request: ContentCreationRequest): Promise<ContentCreationResult> {
    const {
      topic,
      platform = 'twitter',
      tone = 'casual',
      audience,
      brandGuidelines
    } = request;

    // 平台特定的内容长度限制
    const lengthLimits = {
      twitter: 280,
      instagram: 2200,
      linkedin: 3000,
      facebook: 63206
    };

    const maxLength = lengthLimits[platform as keyof typeof lengthLimits] || 500;

    const prompt = this.buildSocialMediaPrompt({
      topic,
      platform,
      tone,
      audience,
      maxLength,
      brandGuidelines
    });

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['text-generation', 'social-media'],
      priority: 'performance',
      context: { platform, maxLength }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const analysis = await this.analyzeContent(content, request);

    return {
      content: this.truncateContent(content, maxLength),
      metadata: {
        wordCount: this.countWords(content),
        readingTime: this.calculateReadingTime(content),
        tone,
        seoScore: analysis.seoScore,
        brandAlignment: analysis.brandAlignment
      },
      suggestions: analysis.suggestions,
      alternatives: []
    };
  }

  // ==================== 品牌内容生成 ====================

  /**
   * 生成品牌故事
   */
  async generateBrandStory(request: {
    brandName: string;
    mission: string;
    values: string[];
    targetAudience: string;
    storyType: 'origin' | 'mission' | 'customer' | 'future';
    length: 'short' | 'medium' | 'long';
  }): Promise<ContentCreationResult> {
    const prompt = `Create a compelling brand story for ${request.brandName}.

Mission: ${request.mission}
Values: ${request.values.join(', ')}
Target Audience: ${request.targetAudience}
Story Type: ${request.storyType}
Length: ${request.length}

Make it authentic, emotional, and aligned with brand values.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['creative-writing', 'narrative'],
      priority: 'performance',
      context: { contentType: 'brand-story', storyType: request.storyType }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const analysis = await this.analyzeBrandAlignment(content, request.values);

    return {
      content,
      metadata: {
        wordCount: this.countWords(content),
        readingTime: this.calculateReadingTime(content),
        tone: 'inspirational',
        brandAlignment: analysis.score
      },
      suggestions: analysis.suggestions,
      alternatives: []
    };
  }

  // ==================== 视频内容生成 ====================

  /**
   * 生成视频脚本
   */
  async generateVideoScript(request: {
    topic: string;
    duration: number; // 秒
    style: 'educational' | 'promotional' | 'storytelling';
    targetAudience: string;
    callToAction?: string;
  }): Promise<{
    script: string;
    scenes: Array<{
      sceneNumber: number;
      duration: number;
      description: string;
      dialogue: string;
      visualNotes: string;
    }>;
    metadata: {
      totalDuration: number;
      sceneCount: number;
      estimatedWordCount: number;
    };
  }> {
    const prompt = `Create a video script for:

Topic: ${request.topic}
Duration: ${request.duration} seconds
Style: ${request.style}
Target Audience: ${request.targetAudience}
${request.callToAction ? `Call to Action: ${request.callToAction}` : ''}

Include scene descriptions, dialogue, and visual notes.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['script-writing', 'creative-writing'],
      priority: 'performance',
      context: { contentType: 'video-script', duration: request.duration }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const parsedScript = this.parseVideoScript(content);

    return {
      script: content,
      scenes: parsedScript.scenes,
      metadata: {
        totalDuration: request.duration,
        sceneCount: parsedScript.scenes.length,
        estimatedWordCount: this.countWords(content)
      }
    };
  }

  // ==================== 多语言内容生成 ====================

  /**
   * 生成多语言内容
   */
  async generateMultilingualContent(request: {
    content: string;
    sourceLanguage: string;
    targetLanguages: string[];
    context: 'marketing' | 'technical' | 'creative';
    preserveTone: boolean;
    culturalAdaptation: boolean;
  }): Promise<Record<string, ContentCreationResult>> {
    const results: Record<string, ContentCreationResult> = {};

    for (const targetLanguage of request.targetLanguages) {
      const prompt = `Translate and adapt the following content:

Source Language: ${request.sourceLanguage}
Target Language: ${targetLanguage}
Context: ${request.context}
Preserve Tone: ${request.preserveTone ? 'Yes' : 'No'}
Cultural Adaptation: ${request.culturalAdaptation ? 'Yes' : 'No'}

Content:
${request.content}

Ensure the translation is natural and culturally appropriate.`;

      const routingResult = await this.modelRouterService.routeRequest({
        capabilities: ['translation', 'cultural-adaptation'],
        priority: 'performance',
        context: {
          sourceLanguage: request.sourceLanguage,
          targetLanguage,
          context: request.context
        }
      });

      const translatedContent = await this.generateContent(prompt, routingResult.model.id);

      results[targetLanguage] = {
        content: translatedContent,
        metadata: {
          wordCount: this.countWords(translatedContent),
          readingTime: this.calculateReadingTime(translatedContent),
          tone: request.preserveTone ? 'preserved' : 'adapted'
        },
        suggestions: [],
        alternatives: []
      };
    }

    return results;
  }

  // ==================== 内容分析和优化 ====================

  /**
   * 分析内容质量
   */
  async analyzeContent(content: string, request: ContentCreationRequest): Promise<{
    seoScore: number;
    readabilityScore: number;
    engagementScore: number;
    brandAlignment: number;
    suggestions: string[];
  }> {
    // SEO分析
    const seoScore = this.calculateSEOScore(content, request.topic);

    // 可读性分析
    const readabilityScore = this.calculateReadabilityScore(content);

    // 参与度分析
    const engagementScore = this.calculateEngagementScore(content, request.tone);

    // 品牌一致性分析
    const brandAlignment = request.brandGuidelines
      ? await this.analyzeBrandAlignment(content, request.brandGuidelines.values)
      : 0.8;

    // 生成建议
    const suggestions = this.generateContentSuggestions({
      seoScore,
      readabilityScore,
      engagementScore,
      brandAlignment,
      content,
      request
    });

    return {
      seoScore,
      readabilityScore,
      engagementScore,
      brandAlignment: brandAlignment.score || brandAlignment,
      suggestions
    };
  }

  /**
   * 生成内容变体
   */
  async generateContentVariants(
    content: string,
    count: number = 3,
    variations: ('tone' | 'length' | 'style')[] = ['tone']
  ): Promise<string[]> {
    const variants: string[] = [];

    for (let i = 0; i < count; i++) {
      const variationType = variations[i % variations.length];
      const prompt = `Rewrite the following content with a ${variationType} variation:

Original content:
${content}

Create a ${variationType} variation while maintaining the core message.`;

      const routingResult = await this.modelRouterService.routeRequest({
        capabilities: ['content-rewriting'],
        priority: 'balanced'
      });

      const variant = await this.generateContent(prompt, routingResult.model.id);
      variants.push(variant);
    }

    return variants;
  }

  // ==================== 私有方法 ====================

  /**
   * 构建营销文案提示词
   */
  private buildMarketingPrompt(params: any): string {
    return `Create compelling marketing copy for:

Topic: ${params.topic}
Audience: ${params.audience}
Tone: ${params.tone}
Length: ${params.length}
${params.brandGuidelines ? `Brand Guidelines: ${JSON.stringify(params.brandGuidelines)}` : ''}

Make it persuasive, engaging, and conversion-focused.`;
  }

  /**
   * 构建社交媒体提示词
   */
  private buildSocialMediaPrompt(params: any): string {
    return `Create engaging social media content for ${params.platform}:

Topic: ${params.topic}
Tone: ${params.tone}
${params.audience ? `Audience: ${params.audience}` : ''}
Character limit: ${params.maxLength}
${params.brandGuidelines ? `Brand Guidelines: ${JSON.stringify(params.brandGuidelines)}` : ''}

Make it shareable and platform-optimized.`;
  }

  /**
   * 生成内容
   */
  private async generateContent(prompt: string, modelId: string): Promise<string> {
    // 这里应该调用实际的AI模型API
    // 暂时返回模拟内容
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `Generated content based on prompt: ${prompt.substring(0, 100)}...`;
  }

  /**
   * 计算词数
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * 计算阅读时间
   */
  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    return Math.ceil(this.countWords(text) / wordsPerMinute);
  }

  /**
   * 截断内容
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;

    // 智能截断，尽量在句号或空格处截断
    let truncated = content.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf(' ')
    );

    if (lastSentenceEnd > maxLength * 0.8) {
      truncated = truncated.substring(0, lastSentenceEnd + 1);
    }

    return truncated.trim() + '...';
  }

  /**
   * 解析视频脚本
   */
  private parseVideoScript(script: string): { scenes: any[] } {
    // 简化的脚本解析逻辑
    const scenes = script.split('\n\n').map((scene, index) => ({
      sceneNumber: index + 1,
      duration: 10, // 默认10秒
      description: scene,
      dialogue: '',
      visualNotes: ''
    }));

    return { scenes };
  }

  // 其他分析方法的实现...
}
