/**
 * 游戏状态枚举
 */
export type GameStatus =
  | 'creating'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'archived';

/**
 * 游戏类型枚举
 */
export type GameType =
  | 'text-adventure'
  | 'interactive-fiction'
  | 'choose-your-own-adventure'
  | 'role-playing'
  | 'puzzle'
  | 'simulation';

/**
 * 游戏难度级别
 */
export type GameDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert';

/**
 * 玩家状态枚举
 */
export type PlayerStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'banned';

/**
 * 游戏阶段枚举
 */
export type GamePhase =
  | 'introduction'
  | 'exploration'
  | 'conflict'
  | 'climax'
  | 'resolution';

/**
 * 叙事风格枚举
 */
export type NarrativeStyle =
  | 'concise'
  | 'detailed'
  | 'dramatic'
  | 'humorous'
  | 'poetic'
  | 'technical'
  | 'conversational';

/**
 * 游戏世界配置
 */
export interface GameWorldConfig {
  /** 世界名称 */
  name: string;

  /** 世界描述 */
  description: string;

  /** 世界类型 */
  type: 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'post-apocalyptic' | 'custom';

  /** 世界规模 */
  scale: 'small' | 'medium' | 'large';

  /** 世界复杂度 */
  complexity: 'simple' | 'medium' | 'complex';

  /** 世界主题 */
  themes: string[];

  /** 世界规则 */
  rules: string[];

  /** 世界限制 */
  restrictions?: string[];
}

/**
 * 游戏角色配置
 */
export interface GameCharacterConfig {
  /** 角色ID */
  id: string;

  /** 角色名称 */
  name: string;

  /** 角色类型 */
  type: 'player' | 'npc' | 'companion' | 'antagonist' | 'neutral';

  /** 角色属性 */
  attributes: Record<string, number>;

  /** 角色技能 */
  skills: Record<string, number>;

  /** 角色关系 */
  relationships: Record<string, 'ally' | 'enemy' | 'neutral'>;

  /** 角色目标 */
  goals: string[];

  /** 角色背景 */
  background: string;

  /** 角色对话风格 */
  dialogueStyle?: NarrativeStyle;
}

/**
 * 游戏场景配置
 */
export interface GameSceneConfig {
  /** 场景ID */
  id: string;

  /** 场景名称 */
  name: string;

  /** 场景描述 */
  description: string;

  /** 场景类型 */
  type: 'location' | 'event' | 'transition' | 'combat' | 'dialogue';

  /** 场景位置 */
  location?: {
    x: number;
    y: number;
    z?: number;
  };

  /** 场景连接 */
  connections: Array<{
    sceneId: string;
    condition?: string;
    description: string;
  }>;

  /** 场景事件 */
  events?: GameEventConfig[];

  /** 场景物品 */
  items?: GameItemConfig[];

  /** 场景NPC */
  npcs?: string[];
}

/**
 * 游戏事件配置
 */
export interface GameEventConfig {
  /** 事件ID */
  id: string;

  /** 事件类型 */
  type: 'trigger' | 'condition' | 'outcome';

  /** 事件触发器 */
  trigger: {
    type: 'enter' | 'exit' | 'action' | 'time' | 'condition';
    condition?: string;
  };

  /** 事件效果 */
  effects: Array<{
    type: 'state_change' | 'item_add' | 'item_remove' | 'character_add' | 'character_remove';
    target: string;
    value: any;
  }>;

  /** 事件概率 */
  probability?: number;
}

/**
 * 游戏物品配置
 */
export interface GameItemConfig {
  /** 物品ID */
  id: string;

  /** 物品名称 */
  name: string;

  /** 物品类型 */
  type: 'weapon' | 'armor' | 'consumable' | 'key' | 'misc';

  /** 物品描述 */
  description: string;

  /** 物品属性 */
  properties: Record<string, any>;

  /** 使用效果 */
  effects?: Array<{
    type: 'attribute_change' | 'skill_change' | 'state_change';
    target: string;
    value: any;
    duration?: number;
  }>;
}

/**
 * 游戏规则配置
 */
export interface GameRulesConfig {
  /** 获胜条件 */
  winConditions: string[];

  /** 失败条件 */
  loseConditions: string[];

  /** 游戏限制 */
  restrictions: string[];

  /** 评分系统 */
  scoring?: {
    enabled: boolean;
    metrics: Array<{
      name: string;
      weight: number;
      formula?: string;
    }>;
  };

  /** 时间限制 */
  timeLimit?: {
    enabled: boolean;
    duration: number; // 分钟
    type: 'soft' | 'hard';
  };
}

/**
 * 游戏会话配置
 */
export interface GameSessionConfig {
  /** 会话ID */
  sessionId: string;

  /** 游戏ID */
  gameId: string;

  /** 玩家ID */
  playerId: string;

  /** 会话开始时间 */
  startedAt: Date;

  /** 会话结束时间 */
  endedAt?: Date;

  /** 会话状态 */
  status: 'active' | 'paused' | 'completed' | 'abandoned';

  /** 会话设置 */
  settings: {
    autoSave: boolean;
    saveInterval: number; // 分钟
    maxUndoSteps: number;
  };

  /** 游戏进度 */
  progress: {
    scenesVisited: number;
    actionsTaken: number;
    itemsCollected: number;
    charactersMet: number;
    questsCompleted: number;
  };
}

/**
 * 游戏存档
 */
export interface GameSave {
  /** 存档ID */
  saveId: string;

  /** 游戏ID */
  gameId: string;

  /** 玩家ID */
  playerId: string;

  /** 存档名称 */
  name: string;

  /** 存档描述 */
  description?: string;

  /** 存档时间 */
  savedAt: Date;

  /** 游戏状态 */
  gameState: Record<string, any>;

  /** 玩家状态 */
  playerState: Record<string, any>;

  /** 元数据 */
  metadata: {
    version: string;
    gameVersion: string;
    playTime: number; // 分钟
    achievements: string[];
  };
}

/**
 * 游戏统计信息
 */
export interface GameStatistics {
  /** 游戏ID */
  gameId: string;

  /** 玩家ID */
  playerId: string;

  /** 总游戏时间 */
  totalPlayTime: number; // 分钟

  /** 游戏会话数 */
  sessionCount: number;

  /** 完成度 */
  completion: {
    scenes: number;
    totalScenes: number;
    percentage: number;
  };

  /** 玩家表现 */
  performance: {
    actionsPerMinute: number;
    decisionsMade: number;
    optimalChoices: number;
    score?: number;
  };

  /** 成就 */
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: Date;
  }>;

  /** 最后活动时间 */
  lastActivity: Date;
}

/**
 * 游戏分析报告
 */
export interface GameAnalysisReport {
  /** 报告ID */
  reportId: string;

  /** 游戏ID */
  gameId: string;

  /** 生成时间 */
  generatedAt: Date;

  /** 分析类型 */
  analysisType: 'completion' | 'performance' | 'engagement' | 'narrative';

  /** 分析结果 */
  results: Record<string, any>;

  /** 建议 */
  recommendations: Array<{
    type: 'improvement' | 'bug' | 'feature';
    priority: 'low' | 'medium' | 'high';
    description: string;
    actionable: boolean;
  }>;

  /** 洞察 */
  insights: Array<{
    category: string;
    title: string;
    description: string;
    data: any;
  }>;
}

/**
 * 游戏模板
 */
export interface GameTemplate {
  /** 模板ID */
  templateId: string;

  /** 模板名称 */
  name: string;

  /** 模板描述 */
  description: string;

  /** 模板类型 */
  type: GameType;

  /** 难度级别 */
  difficulty: GameDifficulty;

  /** 预计游戏时间 */
  estimatedDuration: number; // 分钟

  /** 模板配置 */
  config: {
    worldConfig: GameWorldConfig;
    characterConfig: GameCharacterConfig[];
    sceneConfig: GameSceneConfig[];
    rulesConfig: GameRulesConfig;
  };

  /** 模板标签 */
  tags: string[];

  /** 使用统计 */
  usageStats: {
    totalUses: number;
    averageRating: number;
    successRate: number;
  };

  /** 创建者 */
  createdBy: string;

  /** 创建时间 */
  createdAt: Date;

  /** 版本 */
  version: string;
}
