import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ModelRouter,
  RoutingStrategy,
  AiModel,
  Prisma
} from '@prisma/client';
import { AiProviderService } from './ai-provider.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface RoutingRule {
  id: string;
  name: string;
  conditions: RoutingCondition[];
  targets: RoutingTarget[];
  fallback?: string;
  priority: number;
}

export interface RoutingCondition {
  type: 'capability' | 'performance' | 'cost' | 'latency' | 'availability' | 'geographic';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  weight: number;
}

export interface RoutingTarget {
  modelId: string;
  weight: number;
  priority: number;
}

export interface RoutingRequest {
  capabilities?: string[];
  maxTokens?: number;
  priority?: 'cost' | 'performance' | 'balanced';
  userId?: string;
  geographic?: string;
  context?: Record<string, any>;
}

export interface RoutingResult {
  model: AiModel;
  router: ModelRouter;
  confidence: number;
  reason: string;
  alternatives: AiModel[];
}

@Injectable()
export class ModelRouterService {
  constructor(
    private prisma: PrismaService,
    private providerService: AiProviderService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== 路由器管理 ====================

  /**
   * 创建模型路由器
   */
  async createRouter(data: {
    name: string;
    description?: string;
    strategy: RoutingStrategy;
    conditions?: RoutingCondition[];
    targets: RoutingTarget[];
    fallbackModel?: string;
  }): Promise<ModelRouter> {
    // 验证目标模型存在
    for (const target of data.targets) {
      const model = await this.prisma.aiModel.findUnique({
        where: { id: target.modelId }
      });
      if (!model) {
        throw new BadRequestException(`Target model ${target.modelId} not found`);
      }
    }

    // 验证后备模型（如果指定）
    if (data.fallbackModel) {
      const fallbackModel = await this.prisma.aiModel.findUnique({
        where: { id: data.fallbackModel }
      });
      if (!fallbackModel) {
        throw new BadRequestException(`Fallback model ${data.fallbackModel} not found`);
      }
    }

    const router = await this.prisma.modelRouter.create({
      data: {
        name: data.name,
        description: data.description,
        strategy: data.strategy,
        conditions: data.conditions || [],
        targets: data.targets,
        fallbackModel: data.fallbackModel
      }
    });

    this.eventEmitter.emit('ai.router.created', router);
    return router;
  }

  /**
   * 更新路由器
   */
  async updateRouter(id: string, updates: Partial<{
    name: string;
    description: string;
    strategy: RoutingStrategy;
    conditions: RoutingCondition[];
    targets: RoutingTarget[];
    fallbackModel: string;
    isActive: boolean;
  }>): Promise<ModelRouter> {
    const router = await this.prisma.modelRouter.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    this.eventEmitter.emit('ai.router.updated', router);
    return router;
  }

  /**
   * 删除路由器
   */
  async deleteRouter(id: string): Promise<void> {
    await this.prisma.modelRouter.delete({
      where: { id }
    });

    this.eventEmitter.emit('ai.router.deleted', { id });
  }

  /**
   * 获取路由器详情
   */
  async getRouter(id: string): Promise<ModelRouter> {
    const router = await this.prisma.modelRouter.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            // 这里可以添加关联计数
          }
        }
      }
    });

    if (!router) {
      throw new NotFoundException('Router not found');
    }

    return router;
  }

  /**
   * 获取所有路由器
   */
  async getRouters(activeOnly = true): Promise<ModelRouter[]> {
    const where: Prisma.ModelRouterWhereInput = {};

    if (activeOnly) {
      where.isActive = true;
    }

    return this.prisma.modelRouter.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  // ==================== 智能路由 ====================

  /**
   * 执行智能路由
   */
  async routeRequest(request: RoutingRequest): Promise<RoutingResult> {
    const routers = await this.getRouters(true);

    if (routers.length === 0) {
      // 如果没有路由器，使用默认路由逻辑
      return this.defaultRouting(request);
    }

    // 评估每个路由器的匹配度
    const routerScores = await Promise.all(
      routers.map(router => this.evaluateRouter(router, request))
    );

    // 选择最佳路由器
    const bestMatch = routerScores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    if (bestMatch.score === 0) {
      // 如果没有匹配的路由器，使用默认路由
      return this.defaultRouting(request);
    }

    return bestMatch.result;
  }

  /**
   * 默认路由逻辑
   */
  private async defaultRouting(request: RoutingRequest): Promise<RoutingResult> {
    let models: AiModel[] = [];

    // 基于能力筛选
    if (request.capabilities && request.capabilities.length > 0) {
      models = await this.providerService.findModelsByCapability(request.capabilities[0], 5);
    } else {
      // 获取所有活跃模型
      const providers = await this.providerService.getProviders();
      for (const provider of providers) {
        const providerModels = await this.providerService.getProviderModels(provider.id);
        models.push(...providerModels);
      }
    }

    if (models.length === 0) {
      throw new NotFoundException('No suitable AI models found');
    }

    // 根据优先级选择最佳模型
    const bestModel = this.selectBestModel(models, request);

    return {
      model: bestModel,
      router: null as any, // 默认路由没有路由器
      confidence: 0.7,
      reason: 'Default routing based on capabilities and priority',
      alternatives: models.filter(m => m.id !== bestModel.id).slice(0, 3)
    };
  }

  /**
   * 评估路由器匹配度
   */
  private async evaluateRouter(
    router: ModelRouter,
    request: RoutingRequest
  ): Promise<{ router: ModelRouter; score: number; result: RoutingResult }> {
    const conditions = router.conditions as RoutingCondition[];
    let totalScore = 0;
    let matchCount = 0;

    // 评估每个条件
    for (const condition of conditions) {
      const score = this.evaluateCondition(condition, request);
      if (score > 0) {
        totalScore += score * condition.weight;
        matchCount++;
      }
    }

    if (matchCount === 0) {
      return { router, score: 0, result: null as any };
    }

    // 选择目标模型
    const targets = router.targets as RoutingTarget[];
    const selectedModel = await this.selectRouterTarget(targets, request);

    if (!selectedModel) {
      return { router, score: 0, result: null as any };
    }

    const confidence = Math.min(totalScore / 100, 1);

    return {
      router,
      score: totalScore,
      result: {
        model: selectedModel,
        router,
        confidence,
        reason: `Router "${router.name}" matched ${matchCount} conditions`,
        alternatives: await this.getAlternativeModels(targets, selectedModel.id)
      }
    };
  }

  /**
   * 评估路由条件
   */
  private evaluateCondition(condition: RoutingCondition, request: RoutingRequest): number {
    const { type, operator, value } = condition;

    switch (type) {
      case 'capability':
        return this.evaluateCapabilityCondition(operator, value, request.capabilities);

      case 'performance':
        return this.evaluatePerformanceCondition(operator, value, request.priority);

      case 'cost':
        return this.evaluateCostCondition(operator, value, request.priority);

      case 'latency':
        return this.evaluateLatencyCondition(operator, value, request.context);

      case 'availability':
        return this.evaluateAvailabilityCondition(operator, value, request.context);

      case 'geographic':
        return this.evaluateGeographicCondition(operator, value, request.geographic);

      default:
        return 0;
    }
  }

  /**
   * 评估能力条件
   */
  private evaluateCapabilityCondition(operator: string, value: any, capabilities?: string[]): number {
    if (!capabilities) return 0;

    switch (operator) {
      case 'contains':
        return capabilities.includes(value) ? 100 : 0;
      case 'equals':
        return capabilities.some(cap => cap === value) ? 100 : 0;
      default:
        return 0;
    }
  }

  /**
   * 评估性能条件
   */
  private evaluatePerformanceCondition(operator: string, value: any, priority?: string): number {
    if (!priority) return 50; // 中等匹配

    if (priority === 'performance' && value === 'high') return 100;
    if (priority === 'balanced' && value === 'medium') return 100;
    if (priority === 'cost' && value === 'low') return 30;

    return 0;
  }

  /**
   * 评估成本条件
   */
  private evaluateCostCondition(operator: string, value: any, priority?: string): number {
    if (!priority) return 50;

    if (priority === 'cost' && value === 'low') return 100;
    if (priority === 'balanced' && value === 'medium') return 100;
    if (priority === 'performance' && value === 'high') return 30;

    return 0;
  }

  /**
   * 评估延迟条件
   */
  private evaluateLatencyCondition(operator: string, value: any, context?: Record<string, any>): number {
    if (!context?.maxLatency) return 50;

    const maxLatency = context.maxLatency;

    switch (operator) {
      case 'less_than':
        return maxLatency < value ? 100 : 0;
      case 'greater_than':
        return maxLatency > value ? 100 : 0;
      default:
        return 50;
    }
  }

  /**
   * 评估可用性条件
   */
  private evaluateAvailabilityCondition(operator: string, value: any, context?: Record<string, any>): number {
    // 简化的可用性检查
    return value === 'high' ? 80 : 50;
  }

  /**
   * 评估地理条件
   */
  private evaluateGeographicCondition(operator: string, value: any, geographic?: string): number {
    if (!geographic) return 50;

    switch (operator) {
      case 'equals':
        return geographic === value ? 100 : 0;
      case 'contains':
        return geographic.includes(value) ? 80 : 0;
      default:
        return 50;
    }
  }

  /**
   * 选择路由器目标
   */
  private async selectRouterTarget(targets: RoutingTarget[], request: RoutingRequest): Promise<AiModel | null> {
    if (targets.length === 0) return null;

    // 根据权重和策略选择目标
    const sortedTargets = targets.sort((a, b) => b.weight - a.weight);

    for (const target of sortedTargets) {
      try {
        const model = await this.prisma.aiModel.findUnique({
          where: { id: target.modelId },
          include: { provider: true }
        });

        if (model && model.status === 'ACTIVE' && model.provider.status === 'ACTIVE') {
          return model;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  /**
   * 选择最佳模型
   */
  private selectBestModel(models: AiModel[], request: RoutingRequest): AiModel {
    if (models.length === 1) return models[0];

    // 根据请求优先级排序
    const priority = request.priority || 'balanced';

    return models.sort((a, b) => {
      // 性能优先
      if (priority === 'performance') {
        return (b.performance - b.latency) - (a.performance - a.latency);
      }

      // 成本优先
      if (priority === 'cost') {
        const aCost = this.calculateModelCost(a);
        const bCost = this.calculateModelCost(b);
        return aCost - bCost;
      }

      // 平衡模式（默认）
      const aScore = (a.performance * 0.6) - (this.calculateModelCost(a) * 0.4);
      const bScore = (b.performance * 0.6) - (this.calculateModelCost(b) * 0.4);
      return bScore - aScore;
    })[0];
  }

  /**
   * 计算模型成本
   */
  private calculateModelCost(model: AiModel): number {
    const pricing = model.pricing as any;
    return pricing?.input || pricing?.output || 0;
  }

  /**
   * 获取替代模型
   */
  private async getAlternativeModels(targets: RoutingTarget[], selectedId: string): Promise<AiModel[]> {
    const alternativeIds = targets
      .filter(t => t.modelId !== selectedId)
      .map(t => t.modelId);

    if (alternativeIds.length === 0) return [];

    const models = await this.prisma.aiModel.findMany({
      where: {
        id: { in: alternativeIds },
        status: 'ACTIVE'
      },
      include: { provider: true }
    });

    return models.filter(m => m.provider.status === 'ACTIVE');
  }

  // ==================== 路由器监控 ====================

  /**
   * 获取路由器统计
   */
  async getRouterStats(routerId: string, period: 'day' | 'week' | 'month' = 'week') {
    const router = await this.getRouter(routerId);

    // 这里可以实现路由器使用统计
    // 暂时返回基本信息
    return {
      routerId,
      routerName: router.name,
      strategy: router.strategy,
      targetCount: (router.targets as RoutingTarget[]).length,
      isActive: router.isActive,
      createdAt: router.createdAt,
      // TODO: 添加实际的使用统计
      usageStats: {
        totalRequests: 0,
        successRate: 0,
        averageLatency: 0
      }
    };
  }

  /**
   * 路由器健康检查
   */
  async healthCheck(routerId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    issues: string[];
  }> {
    const router = await this.getRouter(routerId);
    const issues: string[] = [];

    if (!router.isActive) {
      return {
        status: 'unhealthy',
        message: 'Router is inactive',
        issues: ['Router is disabled']
      };
    }

    const targets = router.targets as RoutingTarget[];
    if (targets.length === 0) {
      issues.push('No target models configured');
    }

    // 检查目标模型是否可用
    for (const target of targets) {
      try {
        const model = await this.prisma.aiModel.findUnique({
          where: { id: target.modelId },
          include: { provider: true }
        });

        if (!model || model.status !== 'ACTIVE') {
          issues.push(`Target model ${target.modelId} is not active`);
        } else if (!model.provider || model.provider.status !== 'ACTIVE') {
          issues.push(`Provider for model ${target.modelId} is not active`);
        }
      } catch (error) {
        issues.push(`Failed to check model ${target.modelId}`);
      }
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Router is operating normally';

    if (issues.length > 0) {
      status = issues.length > 2 ? 'unhealthy' : 'degraded';
      message = `${issues.length} issue(s) found`;
    }

    return {
      status,
      message,
      issues
    };
  }

  // ==================== 内置路由器 ====================

  /**
   * 初始化内置路由器
   */
  async initializeBuiltInRouters(): Promise<void> {
    const builtInRouters = [
      {
        name: 'general-purpose',
        description: '通用用途路由器，平衡性能和成本',
        strategy: 'WEIGHTED' as RoutingStrategy,
        conditions: [
          {
            type: 'capability' as const,
            operator: 'contains' as const,
            value: 'text-generation',
            weight: 1
          }
        ],
        targets: [] as RoutingTarget[], // 将在运行时填充
        fallbackModel: undefined
      },
      {
        name: 'cost-optimized',
        description: '成本优化路由器，优先选择低成本模型',
        strategy: 'COST_OPTIMAL' as RoutingStrategy,
        conditions: [
          {
            type: 'cost' as const,
            operator: 'less_than' as const,
            value: 0.01,
            weight: 1
          }
        ],
        targets: [] as RoutingTarget[],
        fallbackModel: undefined
      },
      {
        name: 'performance-max',
        description: '性能最大化路由器，优先选择高性能模型',
        strategy: 'PERFORMANCE' as RoutingStrategy,
        conditions: [
          {
            type: 'performance' as const,
            operator: 'greater_than' as const,
            value: 0.8,
            weight: 1
          }
        ],
        targets: [] as RoutingTarget[],
        fallbackModel: undefined
      }
    ];

    // 获取所有活跃模型作为目标
    const allModels = await this.prisma.aiModel.findMany({
      where: { status: 'ACTIVE' },
      include: { provider: { select: { priority: true } } }
    });

    // 为每个路由器分配目标
    for (const routerConfig of builtInRouters) {
      try {
        const targets: RoutingTarget[] = allModels.map(model => ({
          modelId: model.id,
          weight: this.calculateModelWeight(model, routerConfig.name),
          priority: model.provider.priority
        }));

        await this.createRouter({
          ...routerConfig,
          targets
        });
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error(`Failed to create router ${routerConfig.name}:`, error);
        }
      }
    }
  }

  /**
   * 计算模型权重
   */
  private calculateModelWeight(model: AiModel, routerType: string): number {
    switch (routerType) {
      case 'cost-optimized':
        const cost = this.calculateModelCost(model);
        return Math.max(1, 100 - cost * 10000); // 成本越低权重越高

      case 'performance-max':
        return Math.max(1, model.performance * 100); // 性能越高权重越高

      case 'general-purpose':
      default:
        // 平衡性能和成本
        const performance = model.performance;
        const cost = this.calculateModelCost(model);
        return Math.max(1, (performance * 60) - (cost * 40));
    }
  }
}
