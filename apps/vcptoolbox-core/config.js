/**
 * 创世星环 (Creation Ring) 配置文件
 */

// 创世星环配置
const creationRingConfig = {
  // =============== 基础信息 ===============
  name: '创世星环',
  version: '1.0.0',
  description: 'AI驱动的叙事创作平台',

  // =============== 服务器配置 ===============
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || 'localhost',
    mode: process.env.CREATION_RING_MODE || 'development'
  },

  // =============== 管理员配置 ===============
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'creation-ring-2024'
  },

  // =============== AI 服务配置 ===============
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiUrl: process.env.API_URL || 'https://api.openai.com/v1',
    apiKey: process.env.API_KEY,
    vcpKey: process.env.VCP_KEY,

    models: {
      storyGeneration: process.env.STORY_GENERATION_MODEL || 'gpt-4',
      characterCreation: process.env.CHARACTER_CREATION_MODEL || 'gpt-4',
      worldBuilding: process.env.WORLD_BUILDING_MODEL || 'gpt-4'
    },

    limits: {
      storyTokens: parseInt(process.env.MAX_STORY_TOKENS) || 4000,
      characterTokens: parseInt(process.env.MAX_CHARACTER_TOKENS) || 2000,
      worldTokens: parseInt(process.env.MAX_WORLD_TOKENS) || 3000
    }
  },

  // =============== 创世星环特有配置 ===============
  creation: {
    narrative: {
      defaultStyle: process.env.DEFAULT_NARRATIVE_STYLE || '现代现实主义',
      maxLength: parseInt(process.env.MAX_STORY_LENGTH) || 50000
    },

    collaboration: {
      enabled: process.env.ENABLE_COLLABORATION === 'true',
      realtime: process.env.REALTIME_COLLABORATION === 'true',
      maxUsers: parseInt(process.env.MAX_SESSION_USERS) || 10,
      timeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 480
    },

    plugins: {
      enabled: ['StoryGenerator', 'CharacterCreator', 'WorldBuilder', 'NarrativeLogic', 'CollaborationManager'],
      path: './plugins'
    }
  },

  // =============== 数据存储配置 ===============
  storage: {
    paths: {
      stories: process.env.STORY_DATABASE_PATH || './data/stories',
      characters: process.env.CHARACTER_DATABASE_PATH || './data/characters',
      worlds: process.env.WORLD_DATABASE_PATH || './data/worlds',
      sessions: './data/sessions',
      backups: './data/backups',
      logs: './logs'
    }
  },

  // =============== WebSocket 配置 ===============
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT) || 3002,
    host: process.env.WEBSOCKET_HOST || 'localhost',
    heartbeatInterval: parseInt(process.env.WEBSOCKET_HEARTBEAT_INTERVAL) || 30000
  },

  // =============== VCPToolBox 兼容配置 ===============
  vcp: {
    enabled: true,
    memory: {
      similarityThreshold: parseFloat(process.env.MEMORY_SIMILARITY_THRESHOLD) || 0.8,
      maxConnections: parseInt(process.env.MEMORY_MAX_CONNECTIONS) || 1000
    },

    workflow: {
      maxConcurrent: parseInt(process.env.WORKFLOW_MAX_CONCURRENT) || 5,
      defaultTimeout: parseInt(process.env.WORKFLOW_DEFAULT_TIMEOUT) || 300000
    }
  },

  // =============== 安全配置 ===============
  security: {
    encryption: {
      key: process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production'
    },

    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      credentials: true
    }
  },

  // =============== 监控配置 ===============
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
  }
};

// 验证配置
function validateConfig() {
  const errors = [];

  if (!creationRingConfig.ai.apiKey) {
    errors.push('AI API Key 未配置');
  }

  if (!creationRingConfig.ai.vcpKey) {
    errors.push('VCP Key 未配置');
  }

  return errors;
}

// 导出配置
module.exports = {
  config: creationRingConfig,
  validateConfig,
  get: (path) => {
    return path.split('.').reduce((obj, key) => obj && obj[key], creationRingConfig);
  }
};
