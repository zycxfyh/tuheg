import { Injectable } from '@nestjs/common';
import { AiProviderService } from '../plugins/ai-provider.service';
import { ModelRouterService } from '../plugins/model-router.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // 小时
  modules: LearningModule[];
  prerequisites: string[];
  learningOutcomes: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: number; // 分钟
  content: EducationalContent;
  assessment?: Assessment;
  resources: LearningResource[];
}

export interface EducationalContent {
  overview: string;
  keyConcepts: string[];
  detailedContent: string;
  examples: string[];
  exercises: Exercise[];
}

export interface Assessment {
  type: 'quiz' | 'assignment' | 'project';
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // 分钟
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'practice' | 'application' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 分钟
  hints: string[];
  solution: string;
}

export interface LearningResource {
  type: 'video' | 'article' | 'interactive' | 'download';
  title: string;
  url: string;
  description: string;
  duration?: number;
}

export interface LearnerProfile {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  pace: 'slow' | 'moderate' | 'fast';
  priorKnowledge: Record<string, number>; // 主题: 掌握度(0-1)
  interests: string[];
  goals: string[];
  completedModules: string[];
  performanceHistory: PerformanceRecord[];
}

export interface PerformanceRecord {
  moduleId: string;
  score: number;
  timeSpent: number;
  completionDate: Date;
  strengths: string[];
  weaknesses: string[];
}

@Injectable()
export class EducationService {
  constructor(
    private aiProviderService: AiProviderService,
    private modelRouterService: ModelRouterService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== 课程内容生成 ====================

  /**
   * 生成课程大纲
   */
  async generateCourseOutline(request: {
    subject: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration: number; // 周
    learningObjectives: string[];
    targetAudience: string;
    prerequisites?: string[];
  }): Promise<{
    title: string;
    description: string;
    outline: LearningPath;
    estimatedWorkload: number;
    resources: LearningResource[];
  }> {
    const prompt = `Create a comprehensive course outline for:

Subject: ${request.subject}
Level: ${request.level}
Duration: ${request.duration} weeks
Learning Objectives: ${request.learningObjectives.join(', ')}
Target Audience: ${request.targetAudience}
Prerequisites: ${request.prerequisites?.join(', ') || 'None'}

Include detailed modules, assessments, and learning activities.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['course-design', 'educational-content'],
      priority: 'performance',
      context: { subject: request.subject, level: request.level }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const outline = this.parseCourseOutline(content, request);

    return {
      title: `${request.subject} ${request.level} Course`,
      description: `A comprehensive ${request.level} level course on ${request.subject}`,
      outline,
      estimatedWorkload: request.duration * 10, // 假设每周10小时
      resources: await this.generateCourseResources(outline)
    };
  }

  /**
   * 生成教学材料
   */
  async generateEducationalContent(request: {
    topic: string;
    learningObjectives: string[];
    targetAudience: string;
    contentType: 'lecture' | 'tutorial' | 'guide' | 'reference';
    format: 'text' | 'structured' | 'interactive';
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<EducationalContent> {
    const prompt = `Create educational content for:

Topic: ${request.topic}
Learning Objectives: ${request.learningObjectives.join(', ')}
Target Audience: ${request.targetAudience}
Content Type: ${request.contentType}
Format: ${request.format}
Difficulty: ${request.difficulty}

Include overview, key concepts, detailed explanations, examples, and exercises.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['educational-content', 'instructional-design'],
      priority: 'performance',
      context: { contentType: request.contentType, difficulty: request.difficulty }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);

    return this.parseEducationalContent(content);
  }

  // ==================== 个性化学习路径 ====================

  /**
   * 创建个性化学习路径
   */
  async createPersonalizedLearningPath(
    learnerProfile: LearnerProfile,
    subject: string,
    timeframe: number // 周
  ): Promise<LearningPath> {
    // 分析学习者特征
    const learnerAnalysis = this.analyzeLearnerProfile(learnerProfile);

    // 生成适应性学习路径
    const prompt = `Create a personalized learning path for:

Subject: ${subject}
Timeframe: ${timeframe} weeks
Learning Style: ${learnerProfile.learningStyle}
Pace: ${learnerProfile.pace}
Prior Knowledge: ${JSON.stringify(learnerProfile.priorKnowledge)}
Interests: ${learnerProfile.interests.join(', ')}
Goals: ${learnerProfile.goals.join(', ')}

Adapt the content to match learning preferences and prior knowledge.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['personalization', 'adaptive-learning'],
      priority: 'performance',
      context: learnerAnalysis
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const learningPath = this.parseLearningPath(content, learnerProfile, subject);

    return learningPath;
  }

  /**
   * 调整学习路径
   */
  async adjustLearningPath(
    currentPath: LearningPath,
    learnerProfile: LearnerProfile,
    performanceData: PerformanceRecord[]
  ): Promise<LearningPath> {
    // 分析性能数据
    const performanceAnalysis = this.analyzePerformanceData(performanceData);

    // 生成调整建议
    const prompt = `Adjust the learning path based on performance data:

Current Path: ${currentPath.title}
Learner's Performance: ${JSON.stringify(performanceAnalysis)}
Learning Style: ${learnerProfile.learningStyle}
Recent Performance: ${performanceData.slice(-5).map(p => `Module ${p.moduleId}: ${p.score}%`).join(', ')}

Provide adjustments to difficulty, pace, or content focus.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['adaptive-learning', 'performance-analysis'],
      priority: 'performance'
    });

    const adjustments = await this.generateContent(prompt, routingResult.model.id);
    const adjustedPath = this.applyPathAdjustments(currentPath, adjustments);

    return adjustedPath;
  }

  // ==================== 评估和测试生成 ====================

  /**
   * 生成自动评估
   */
  async generateAssessment(request: {
    topic: string;
    learningObjectives: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    questionCount: number;
    types: ('multiple-choice' | 'true-false' | 'short-answer' | 'essay')[];
    timeLimit?: number;
  }): Promise<Assessment> {
    const prompt = `Create an assessment for:

Topic: ${request.topic}
Learning Objectives: ${request.learningObjectives.join(', ')}
Difficulty: ${request.difficulty}
Questions: ${request.questionCount}
Types: ${request.types.join(', ')}
${request.timeLimit ? `Time Limit: ${request.timeLimit} minutes` : ''}

Include questions with answers and explanations.`;

    const routingResult = await this.modelRouterService.routeRequest({
      capabilities: ['assessment-creation', 'educational-testing'],
      priority: 'performance',
      context: { questionCount: request.questionCount, difficulty: request.difficulty }
    });

    const content = await this.generateContent(prompt, routingResult.model.id);
    const assessment = this.parseAssessment(content, request);

    return assessment;
  }

  /**
   * 生成练习题
   */
  async generateExercises(request: {
    topic: string;
    concepts: string[];
    count: number;
    types: ('practice' | 'application' | 'challenge')[];
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<Exercise[]> {
    const exercises: Exercise[] = [];

    for (let i = 0; i < request.count; i++) {
      const type = request.types[i % request.types.length];
      const prompt = `Create a ${type} exercise for:

Topic: ${request.topic}
Concept: ${request.concepts[i % request.concepts.length]}
Difficulty: ${request.difficulty}

Include description, hints, and solution.`;

      const routingResult = await this.modelRouterService.routeRequest({
        capabilities: ['exercise-creation', 'problem-solving'],
        priority: 'performance'
      });

      const content = await this.generateContent(prompt, routingResult.model.id);
      const exercise = this.parseExercise(content, type, request.difficulty);
      exercises.push(exercise);
    }

    return exercises;
  }

  // ==================== 学习分析和洞察 ====================

  /**
   * 分析学习表现
   */
  analyzeLearningPerformance(
    learnerProfile: LearnerProfile,
    performanceData: PerformanceRecord[]
  ): {
    overallProgress: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    predictedCompletion: Date;
    adaptiveSuggestions: string[];
  } {
    // 计算总体进度
    const completedModules = learnerProfile.completedModules.length;
    const totalModules = performanceData.length + completedModules;
    const overallProgress = totalModules > 0 ? completedModules / totalModules : 0;

    // 分析强项和弱项
    const averageScores = this.calculateAverageScores(performanceData);
    const strengths = Object.entries(averageScores)
      .filter(([, score]) => score >= 0.8)
      .map(([topic]) => topic);

    const weaknesses = Object.entries(averageScores)
      .filter(([, score]) => score < 0.6)
      .map(([topic]) => topic);

    // 生成推荐
    const recommendations = this.generateLearningRecommendations(
      strengths,
      weaknesses,
      learnerProfile
    );

    // 预测完成时间
    const predictedCompletion = this.predictCompletionDate(
      performanceData,
      learnerProfile.pace
    );

    // 生成适应性建议
    const adaptiveSuggestions = this.generateAdaptiveSuggestions(
      performanceData,
      learnerProfile
    );

    return {
      overallProgress,
      strengths,
      weaknesses,
      recommendations,
      predictedCompletion,
      adaptiveSuggestions
    };
  }

  /**
   * 生成学习报告
   */
  generateLearningReport(
    learnerProfile: LearnerProfile,
    performanceData: PerformanceRecord[]
  ): {
    executiveSummary: string;
    detailedAnalysis: {
      progress: any;
      performance: any;
      engagement: any;
      recommendations: string[];
    };
    visualizations: {
      progressChart: any;
      performanceChart: any;
      topicMasteryChart: any;
    };
  } {
    const analysis = this.analyzeLearningPerformance(learnerProfile, performanceData);

    return {
      executiveSummary: `学生在 ${performanceData.length} 个模块中取得了 ${analysis.overallProgress * 100}% 的完成率。`,
      detailedAnalysis: {
        progress: analysis.overallProgress,
        performance: this.calculateAverageScores(performanceData),
        engagement: this.calculateEngagementMetrics(performanceData),
        recommendations: analysis.recommendations
      },
      visualizations: {
        progressChart: this.generateProgressChart(performanceData),
        performanceChart: this.generatePerformanceChart(performanceData),
        topicMasteryChart: this.generateTopicMasteryChart(performanceData)
      }
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 生成内容
   */
  private async generateContent(prompt: string, modelId: string): Promise<string> {
    // 这里应该调用实际的AI模型API
    // 暂时返回模拟内容
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `Generated educational content based on prompt: ${prompt.substring(0, 100)}...`;
  }

  /**
   * 分析学习者特征
   */
  private analyzeLearnerProfile(profile: LearnerProfile): any {
    return {
      learningStyle: profile.learningStyle,
      pacePreference: profile.pace,
      knowledgeGaps: Object.entries(profile.priorKnowledge)
        .filter(([, level]) => level < 0.5)
        .map(([topic]) => topic),
      interestAlignment: profile.interests,
      performanceTrend: this.analyzePerformanceTrend(profile.performanceHistory)
    };
  }

  /**
   * 解析课程大纲
   */
  private parseCourseOutline(content: string, request: any): LearningPath {
    // 简化的解析逻辑
    return {
      id: `course-${Date.now()}`,
      title: `${request.subject} Course`,
      description: `A ${request.level} level course on ${request.subject}`,
      subject: request.subject,
      level: request.level,
      duration: request.duration * 40, // 每周40小时
      modules: [],
      prerequisites: request.prerequisites || [],
      learningOutcomes: request.learningObjectives
    };
  }

  /**
   * 解析教育内容
   */
  private parseEducationalContent(content: string): EducationalContent {
    // 简化的解析逻辑
    return {
      overview: 'Content overview',
      keyConcepts: ['Concept 1', 'Concept 2'],
      detailedContent: content,
      examples: ['Example 1', 'Example 2'],
      exercises: []
    };
  }

  /**
   * 解析学习路径
   */
  private parseLearningPath(content: string, profile: LearnerProfile, subject: string): LearningPath {
    return {
      id: `path-${Date.now()}`,
      title: `Personalized ${subject} Learning Path`,
      description: `Adapted for ${profile.learningStyle} learning style`,
      subject,
      level: 'intermediate',
      duration: 20,
      modules: [],
      prerequisites: [],
      learningOutcomes: []
    };
  }

  /**
   * 应用路径调整
   */
  private applyPathAdjustments(currentPath: LearningPath, adjustments: string): LearningPath {
    // 简化的调整逻辑
    return {
      ...currentPath,
      description: `${currentPath.description} (Adjusted based on performance)`
    };
  }

  /**
   * 解析评估
   */
  private parseAssessment(content: string, request: any): Assessment {
    return {
      type: 'quiz',
      questions: [],
      passingScore: 70,
      timeLimit: request.timeLimit
    };
  }

  /**
   * 解析练习
   */
  private parseExercise(content: string, type: string, difficulty: string): Exercise {
    return {
      id: `exercise-${Date.now()}`,
      title: 'Practice Exercise',
      description: content,
      type: type as any,
      difficulty: difficulty as any,
      estimatedTime: 15,
      hints: [],
      solution: 'Solution here'
    };
  }

  /**
   * 生成课程资源
   */
  private async generateCourseResources(outline: LearningPath): Promise<LearningResource[]> {
    return [
      {
        type: 'article',
        title: 'Course Introduction',
        url: '#',
        description: 'Introduction to the course'
      }
    ];
  }

  /**
   * 计算平均分数
   */
  private calculateAverageScores(performanceData: PerformanceRecord[]): Record<string, number> {
    const scores: Record<string, number[]> = {};

    performanceData.forEach(record => {
      if (!scores[record.moduleId]) {
        scores[record.moduleId] = [];
      }
      scores[record.moduleId].push(record.score);
    });

    const averages: Record<string, number> = {};
    Object.entries(scores).forEach(([moduleId, moduleScores]) => {
      averages[moduleId] = moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length;
    });

    return averages;
  }

  /**
   * 生成学习推荐
   */
  private generateLearningRecommendations(
    strengths: string[],
    weaknesses: string[],
    profile: LearnerProfile
  ): string[] {
    const recommendations: string[] = [];

    if (weaknesses.length > 0) {
      recommendations.push(`Focus on improving ${weaknesses.join(', ')}`);
    }

    if (profile.learningStyle === 'visual') {
      recommendations.push('Incorporate more visual aids and diagrams');
    }

    return recommendations;
  }

  /**
   * 预测完成日期
   */
  private predictCompletionDate(performanceData: PerformanceRecord[], pace: string): Date {
    const avgScore = performanceData.reduce((sum, p) => sum + p.score, 0) / performanceData.length;
    const paceMultiplier = pace === 'fast' ? 0.8 : pace === 'slow' ? 1.2 : 1.0;
    const remainingModules = 10; // 假设
    const estimatedDays = (remainingModules / (avgScore / 100)) * paceMultiplier;

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + estimatedDays);

    return completionDate;
  }

  /**
   * 生成适应性建议
   */
  private generateAdaptiveSuggestions(
    performanceData: PerformanceRecord[],
    profile: LearnerProfile
  ): string[] {
    const suggestions: string[] = [];

    const recentPerformance = performanceData.slice(-3);
    const avgRecentScore = recentPerformance.reduce((sum, p) => sum + p.score, 0) / recentPerformance.length;

    if (avgRecentScore < 70) {
      suggestions.push('Consider reviewing foundational concepts');
    }

    return suggestions;
  }

  /**
   * 计算参与度指标
   */
  private calculateEngagementMetrics(performanceData: PerformanceRecord[]): any {
    const avgTimeSpent = performanceData.reduce((sum, p) => sum + p.timeSpent, 0) / performanceData.length;
    const completionRate = performanceData.filter(p => p.score >= 60).length / performanceData.length;

    return {
      averageTimeSpent: avgTimeSpent,
      completionRate,
      consistencyScore: this.calculateConsistencyScore(performanceData)
    };
  }

  /**
   * 计算一致性分数
   */
  private calculateConsistencyScore(performanceData: PerformanceRecord[]): number {
    if (performanceData.length < 2) return 1;

    const scores = performanceData.map(p => p.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // 一致性分数：标准差越小，分数越高
    return Math.max(0, 1 - (standardDeviation / 50));
  }

  /**
   * 生成进度图表
   */
  private generateProgressChart(performanceData: PerformanceRecord[]): any {
    return {
      type: 'line',
      data: performanceData.map((p, index) => ({
        x: index + 1,
        y: p.score,
        label: `Module ${p.moduleId}`
      }))
    };
  }

  /**
   * 生成性能图表
   */
  private generatePerformanceChart(performanceData: PerformanceRecord[]): any {
    return {
      type: 'bar',
      data: performanceData.map(p => ({
        label: `Module ${p.moduleId}`,
        value: p.score
      }))
    };
  }

  /**
   * 生成主题掌握图表
   */
  private generateTopicMasteryChart(performanceData: PerformanceRecord[]): any {
    const topicScores = this.calculateAverageScores(performanceData);

    return {
      type: 'radar',
      data: Object.entries(topicScores).map(([topic, score]) => ({
        label: topic,
        value: score
      }))
    };
  }

  /**
   * 分析性能趋势
   */
  private analyzePerformanceTrend(performanceHistory: PerformanceRecord[]): any {
    if (performanceHistory.length < 2) return 'insufficient_data';

    const recent = performanceHistory.slice(-5);
    const earlier = performanceHistory.slice(-10, -5);

    const recentAvg = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, p) => sum + p.score, 0) / earlier.length;

    if (recentAvg > earlierAvg + 5) return 'improving';
    if (recentAvg < earlierAvg - 5) return 'declining';
    return 'stable';
  }
}
