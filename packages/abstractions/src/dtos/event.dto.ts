/**
 * 基础事件接口
 */
export interface BaseEvent {
  /** 事件ID */
  eventId: string;

  /** 事件类型 */
  eventType: string;

  /** 事件时间戳 */
  timestamp: Date;

  /** 事件版本 */
  version: string;

  /** 事件源 */
  source: string;

  /** 相关实体ID */
  correlationId?: string;

  /** 因果链ID */
  causationId?: string;

  /** 事件数据 */
  data: any;

  /** 事件元数据 */
  metadata?: Record<string, any>;
}

/**
 * 游戏创建事件
 */
export class GameCreationStartedEvent implements BaseEvent {
  eventId: string;
  eventType = 'game.creation.started';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    gameId: string;
    concept: string;
    genre?: string;
    targetAudience?: string;
    complexityLevel?: string;
    userId: string;
  };
}

/**
 * 游戏创建完成事件
 */
export class GameCreationCompletedEvent implements BaseEvent {
  eventId: string;
  eventType = 'game.creation.completed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    gameId: string;
    worldSetting: any;
    characters: any[];
    initialScene: any;
    rules: any;
  };
}

/**
 * 游戏创建失败事件
 */
export class GameCreationFailedEvent implements BaseEvent {
  eventId: string;
  eventType = 'game.creation.failed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    gameId: string;
    error: string;
    reason?: string;
    retryable: boolean;
  };
}

/**
 * 玩家行动提交事件
 */
export class PlayerActionSubmittedEvent implements BaseEvent {
  eventId: string;
  eventType = 'game.player.action.submitted';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    gameId: string;
    playerId: string;
    actionId: string;
    actionType: string;
    target?: string;
    parameters?: Record<string, any>;
  };
}

/**
 * 逻辑推理完成事件
 */
export class LogicProcessingCompletedEvent implements BaseEvent {
  eventId: string;
  eventType = 'game.logic.processing.completed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    gameId: string;
    inferenceId: string;
    stateChanges: any[];
    triggeredEvents: any[];
    confidence: number;
    processingTime: number;
  };
}

/**
 * 叙事生成完成事件
 */
export class NarrativeGenerationCompletedEvent implements BaseEvent {
  eventId: string;
  eventType = 'game.narrative.generation.completed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    gameId: string;
    narrativeId: string;
    narrative: string;
    narrativeType: string;
    availableActions: any[];
    mood?: string;
  };
}

/**
 * AI推理任务事件
 */
export class AiInferenceTaskEvent implements BaseEvent {
  eventId: string;
  eventType = 'ai.inference.task';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    taskId: string;
    taskType: 'creation' | 'logic' | 'narrative';
    priority: number;
    payload: any;
    timeout?: number;
  };
}

/**
 * AI推理完成事件
 */
export class AiInferenceCompletedEvent implements BaseEvent {
  eventId: string;
  eventType = 'ai.inference.completed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    taskId: string;
    result: any;
    processingTime: number;
    tokensUsed?: number;
    modelUsed?: string;
  };
}

/**
 * AI推理失败事件
 */
export class AiInferenceFailedEvent implements BaseEvent {
  eventId: string;
  eventType = 'ai.inference.failed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    taskId: string;
    error: string;
    retryable: boolean;
    retryCount?: number;
  };
}

/**
 * 插件安装事件
 */
export class PluginInstalledEvent implements BaseEvent {
  eventId: string;
  eventType = 'plugin.installed';
  timestamp: Date;
  version = '1.0';
  source: string;

  data: {
    pluginId: string;
    version: string;
    userId: string;
  };
}

/**
 * 插件启用事件
 */
export class PluginEnabledEvent implements BaseEvent {
  eventId: string;
  eventType = 'plugin.enabled';
  timestamp: Date;
  version = '1.0';
  source: string;

  data: {
    pluginId: string;
    userId: string;
  };
}

/**
 * 插件执行事件
 */
export class PluginExecutedEvent implements BaseEvent {
  eventId: string;
  eventType = 'plugin.executed';
  timestamp: Date;
  version = '1.0';
  source: string;
  correlationId: string;

  data: {
    pluginId: string;
    executionId: string;
    success: boolean;
    executionTime: number;
    error?: string;
  };
}

/**
 * 系统错误事件
 */
export class SystemErrorEvent implements BaseEvent {
  eventId: string;
  eventType = 'system.error';
  timestamp: Date;
  version = '1.0';
  source: string;

  data: {
    error: string;
    stack?: string;
    context?: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * 性能监控事件
 */
export class PerformanceEvent implements BaseEvent {
  eventId: string;
  eventType = 'system.performance';
  timestamp: Date;
  version = '1.0';
  source: string;

  data: {
    metric: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
    context?: Record<string, any>;
  };
}

/**
 * 用户活动事件
 */
export class UserActivityEvent implements BaseEvent {
  eventId: string;
  eventType = 'user.activity';
  timestamp: Date;
  version = '1.0';
  source: string;

  data: {
    userId: string;
    activity: string;
    details?: Record<string, any>;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * 事件重播请求
 */
export class EventReplayRequest {
  /** 重播ID */
  replayId: string;

  /** 事件类型过滤器 */
  eventTypes?: string[];

  /** 时间范围 */
  timeRange?: {
    start: Date;
    end: Date;
  };

  /** 聚合ID过滤器 */
  aggregateIds?: string[];

  /** 重播速度倍数 */
  speed?: number;

  /** 是否为干运行 */
  dryRun?: boolean;
}

/**
 * 事件重播状态
 */
export class EventReplayStatus {
  /** 重播ID */
  replayId: string;

  /** 重播状态 */
  status: 'running' | 'completed' | 'failed' | 'paused';

  /** 处理的事件数量 */
  eventsProcessed: number;

  /** 总事件数量 */
  totalEvents: number;

  /** 开始时间 */
  startedAt: Date;

  /** 完成时间 */
  completedAt?: Date;

  /** 错误信息 */
  error?: string;

  /** 进度百分比 */
  progress: number;
}
