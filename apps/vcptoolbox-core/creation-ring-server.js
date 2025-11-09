#!/usr/bin/env node

/**
 * 创世星环核心服务器
 * 基于VCPToolBox定制的AI叙事创作平台
 */

// 核心依赖
const express = require('express')
const cors = require('cors')
const path = require('node:path')
const fs = require('node:fs').promises
const fsSync = require('node:fs')
const crypto = require('crypto')
const basicAuth = require('basic-auth')
const winston = require('winston')
const schedule = require('node-schedule')
const { WebSocketServer } = require('./WebSocketServer')
const { PluginManager } = require('./Plugin')

// 创世星环特有配置
const CREATION_RING_CONFIG = {
  name: '创世星环',
  version: '1.0.0',
  description: 'AI驱动的叙事创作平台',
  features: ['多Agent协作叙事', '智能故事生成', '角色深度塑造', '世界观构建', '实时协作创作'],
}

// 加载环境变量
require('dotenv').config()

// 创世星环特有环境变量
const {
  // 基础配置
  PORT = 3001,
  // biome-ignore lint/correctness/noUnusedVariables: 预留用于将来API密钥管理
  API_KEY,
  // biome-ignore lint/correctness/noUnusedVariables: 预留用于将来API URL配置
  API_URL = 'https://api.openai.com',
  VCP_KEY,

  // 创世星环特有配置
  CREATION_RING_MODE = 'development',
  STORY_DATABASE_PATH = './data/stories',
  CHARACTER_DATABASE_PATH = './data/characters',
  WORLD_DATABASE_PATH = './data/worlds',

  // 叙事创作配置
  DEFAULT_NARRATIVE_STYLE = '现代现实主义',
  MAX_STORY_LENGTH = 50000,
  ENABLE_COLLABORATION = true,
  REALTIME_COLLABORATION = true,

  // AI模型配置
  STORY_GENERATION_MODEL = 'gpt-4',
  CHARACTER_CREATION_MODEL = 'gpt-4',
  WORLD_BUILDING_MODEL = 'gpt-4',

  // 管理员配置
  ADMIN_USERNAME = 'admin',
  ADMIN_PASSWORD = 'creation-ring-2024',
} = process.env

// 创建创世星环专用日志器
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [创世星环] ${level.toUpperCase()}: ${message}`
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, 'logs', 'creation-ring.log'),
    }),
  ],
})

// 确保日志目录存在
const logDir = path.join(__dirname, 'logs')
if (!fsSync.existsSync(logDir)) {
  fsSync.mkdirSync(logDir, { recursive: true })
}

// 创世星环核心类
class CreationRingServer {
  constructor() {
    this.app = express()
    this.pluginManager = new PluginManager()
    this.webSocketServer = new WebSocketServer()
    this.storyDatabase = new Map()
    this.characterDatabase = new Map()
    this.worldDatabase = new Map()
    this.activeSessions = new Map()

    this.initializeServer()
  }

  async initializeServer() {
    try {
      logger.info(`🚀 启动${CREATION_RING_CONFIG.name} v${CREATION_RING_CONFIG.version}`)
      logger.info(`📖 ${CREATION_RING_CONFIG.description}`)

      // 初始化数据库目录
      await this.initializeDatabases()

      // 配置Express中间件
      this.configureMiddleware()

      // 配置路由
      this.configureRoutes()

      // 初始化插件系统
      await this.initializePlugins()

      // 初始化WebSocket服务器
      await this.initializeWebSocket()

      // 启动服务器
      this.startServer()

      // 初始化创世星环特有功能
      await this.initializeCreationRingFeatures()

      logger.info('✅ 创世星环核心服务初始化完成')
    } catch (error) {
      logger.error('❌ 创世星环服务初始化失败:', error)
      process.exit(1)
    }
  }

  async initializeDatabases() {
    // 确保数据目录存在
    const dataDirs = [STORY_DATABASE_PATH, CHARACTER_DATABASE_PATH, WORLD_DATABASE_PATH]
    for (const dir of dataDirs) {
      if (!fsSync.existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true })
        logger.info(`📁 创建数据目录: ${dir}`)
      }
    }

    // 加载现有数据
    await this.loadExistingData()
  }

  async loadExistingData() {
    try {
      // 加载故事数据
      const storyFiles = await fs.readdir(STORY_DATABASE_PATH)
      for (const file of storyFiles) {
        if (file.endsWith('.json')) {
          const storyData = JSON.parse(
            await fs.readFile(path.join(STORY_DATABASE_PATH, file), 'utf-8')
          )
          this.storyDatabase.set(storyData.id, storyData)
        }
      }

      // 加载角色数据
      const characterFiles = await fs.readdir(CHARACTER_DATABASE_PATH)
      for (const file of characterFiles) {
        if (file.endsWith('.json')) {
          const characterData = JSON.parse(
            await fs.readFile(path.join(CHARACTER_DATABASE_PATH, file), 'utf-8')
          )
          this.characterDatabase.set(characterData.id, characterData)
        }
      }

      // 加载世界数据
      const worldFiles = await fs.readdir(WORLD_DATABASE_PATH)
      for (const file of worldFiles) {
        if (file.endsWith('.json')) {
          const worldData = JSON.parse(
            await fs.readFile(path.join(WORLD_DATABASE_PATH, file), 'utf-8')
          )
          this.worldDatabase.set(worldData.id, worldData)
        }
      }

      logger.info(
        `📊 加载数据完成: ${this.storyDatabase.size} 故事, ${this.characterDatabase.size} 角色, ${this.worldDatabase.size} 世界`
      )
    } catch (error) {
      logger.warn('⚠️ 加载现有数据时出错:', error.message)
    }
  }

  configureMiddleware() {
    // CORS配置
    this.app.use(
      cors({
        origin: process.env.NODE_ENV === 'production' ? false : '*',
        credentials: true,
      })
    )

    // 请求体解析
    this.app.use(express.json({ limit: '50mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }))

    // 请求日志
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`)
      next()
    })

    // 管理员认证中间件
    this.app.use('/admin', this.adminAuthMiddleware.bind(this))
  }

  adminAuthMiddleware(req, res, next) {
    const credentials = basicAuth(req)

    if (
      !credentials ||
      credentials.name !== ADMIN_USERNAME ||
      credentials.pass !== ADMIN_PASSWORD
    ) {
      res.setHeader('WWW-Authenticate', 'Basic realm="创世星环管理后台"')
      return res.status(401).json({ error: '需要管理员权限' })
    }

    next()
  }

  configureRoutes() {
    // 创世星环API路由
    this.app.get('/api/v1/health', this.healthCheck.bind(this))
    this.app.get('/api/v1/info', this.getSystemInfo.bind(this))

    // 故事创作API
    this.app.post('/api/v1/stories', this.createStory.bind(this))
    this.app.get('/api/v1/stories', this.getStories.bind(this))
    this.app.get('/api/v1/stories/:id', this.getStory.bind(this))
    this.app.put('/api/v1/stories/:id', this.updateStory.bind(this))
    this.app.delete('/api/v1/stories/:id', this.deleteStory.bind(this))

    // 角色管理API
    this.app.post('/api/v1/characters', this.createCharacter.bind(this))
    this.app.get('/api/v1/characters', this.getCharacters.bind(this))
    this.app.get('/api/v1/characters/:id', this.getCharacter.bind(this))

    // 世界构建API
    this.app.post('/api/v1/worlds', this.createWorld.bind(this))
    this.app.get('/api/v1/worlds', this.getWorlds.bind(this))
    this.app.get('/api/v1/worlds/:id', this.getWorld.bind(this))

    // 协作会话API
    this.app.post('/api/v1/sessions', this.createCollaborationSession.bind(this))
    this.app.get('/api/v1/sessions/:id', this.getCollaborationSession.bind(this))

    // AI生成API（基于VCP协议）
    this.app.post('/api/v1/generate/story', this.generateStory.bind(this))
    this.app.post('/api/v1/generate/character', this.generateCharacter.bind(this))
    this.app.post('/api/v1/generate/world', this.generateWorld.bind(this))

    // 插件回调（VCP兼容）
    this.app.post('/plugin-callback/:pluginName/:taskId', this.handlePluginCallback.bind(this))
  }

  async initializePlugins() {
    // 设置插件管理器
    this.pluginManager.setProjectBasePath(__dirname)

    // 加载核心插件
    await this.pluginManager.loadPlugins()

    // 初始化创世星环专用插件
    await this.loadCreationRingPlugins()

    logger.info('🔌 插件系统初始化完成')
  }

  async loadCreationRingPlugins() {
    // 这里可以加载创世星环特有的插件
    // 比如故事生成插件、角色创建插件、世界构建插件等

    const creationRingPlugins = [
      'StoryGenerator',
      'CharacterCreator',
      'WorldBuilder',
      'NarrativeLogic',
      'CollaborationManager',
    ]

    for (const pluginName of creationRingPlugins) {
      try {
        await this.pluginManager.loadPlugin(pluginName)
        logger.info(`✅ 加载创世星环插件: ${pluginName}`)
      } catch (error) {
        logger.warn(`⚠️ 创世星环插件加载失败: ${pluginName}`, error.message)
      }
    }
  }

  async initializeWebSocket() {
    // WebSocket服务器配置
    const wsConfig = {
      debugMode: CREATION_RING_MODE === 'development',
      vcpKey: VCP_KEY,
    }

    // 启动WebSocket服务器
    this.webSocketServer.initialize(this.server, wsConfig)
    this.webSocketServer.setPluginManager(this.pluginManager)

    logger.info('🌐 WebSocket服务器初始化完成')
  }

  startServer() {
    this.server = this.app.listen(PORT, () => {
      logger.info(`🎉 创世星环服务器启动成功，监听端口 ${PORT}`)
      logger.info(`🔗 API地址: http://localhost:${PORT}/api/v1`)
      logger.info(`⚡ WebSocket地址: ws://localhost:${PORT}`)
    })
  }

  async initializeCreationRingFeatures() {
    // 初始化定时任务
    this.scheduleMaintenanceTasks()

    // 初始化协作会话管理
    this.initializeCollaborationSystem()

    // 加载AI模型配置
    await this.loadAIModels()

    logger.info('✨ 创世星环特有功能初始化完成')
  }

  scheduleMaintenanceTasks() {
    // 每小时清理过期会话
    schedule.scheduleJob('0 * * * *', async () => {
      await this.cleanupExpiredSessions()
    })

    // 每天备份数据
    schedule.scheduleJob('0 2 * * *', async () => {
      await this.backupDatabases()
    })
  }

  initializeCollaborationSystem() {
    // 初始化协作会话管理系统
    this.collaborationManager = {
      activeSessions: new Map(),
      sessionTimeouts: new Map(),
    }
  }

  async loadAIModels() {
    // 配置AI模型
    this.aiModels = {
      storyGeneration: STORY_GENERATION_MODEL,
      characterCreation: CHARACTER_CREATION_MODEL,
      worldBuilding: WORLD_BUILDING_MODEL,
    }

    logger.info('🤖 AI模型配置加载完成')
  }

  // ==================== API路由处理器 ====================

  healthCheck(_req, res) {
    res.json({
      status: 'healthy',
      service: CREATION_RING_CONFIG.name,
      version: CREATION_RING_CONFIG.version,
      timestamp: new Date().toISOString(),
      features: CREATION_RING_CONFIG.features,
    })
  }

  getSystemInfo(_req, res) {
    res.json({
      name: CREATION_RING_CONFIG.name,
      version: CREATION_RING_CONFIG.version,
      description: CREATION_RING_CONFIG.description,
      stats: {
        stories: this.storyDatabase.size,
        characters: this.characterDatabase.size,
        worlds: this.worldDatabase.size,
        activeSessions: this.activeSessions.size,
      },
      configuration: {
        mode: CREATION_RING_MODE,
        collaboration: ENABLE_COLLABORATION,
        realtime: REALTIME_COLLABORATION,
        maxStoryLength: MAX_STORY_LENGTH,
      },
    })
  }

  async createStory(req, res) {
    try {
      const storyData = req.body
      const storyId = `story-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

      const story = {
        id: storyId,
        ...storyData,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
      }

      this.storyDatabase.set(storyId, story)

      // 保存到文件
      await fs.writeFile(
        path.join(STORY_DATABASE_PATH, `${storyId}.json`),
        JSON.stringify(story, null, 2)
      )

      res.status(201).json(story)
    } catch (error) {
      logger.error('创建故事失败:', error)
      res.status(500).json({ error: '创建故事失败' })
    }
  }

  getStories(_req, res) {
    const stories = Array.from(this.storyDatabase.values())
    res.json(stories)
  }

  getStory(req, res) {
    const { id } = req.params
    const story = this.storyDatabase.get(id)

    if (!story) {
      return res.status(404).json({ error: '故事不存在' })
    }

    res.json(story)
  }

  async updateStory(req, res) {
    const { id } = req.params
    const updates = req.body

    const story = this.storyDatabase.get(id)
    if (!story) {
      return res.status(404).json({ error: '故事不存在' })
    }

    Object.assign(story, updates, { updatedAt: new Date() })
    this.storyDatabase.set(id, story)

    // 保存到文件
    await fs.writeFile(path.join(STORY_DATABASE_PATH, `${id}.json`), JSON.stringify(story, null, 2))

    res.json(story)
  }

  async deleteStory(req, res) {
    const { id } = req.params

    if (!this.storyDatabase.has(id)) {
      return res.status(404).json({ error: '故事不存在' })
    }

    this.storyDatabase.delete(id)

    // 删除文件
    try {
      await fs.unlink(path.join(STORY_DATABASE_PATH, `${id}.json`))
    } catch (error) {
      logger.warn('删除故事文件失败:', error)
    }

    res.status(204).send()
  }

  // 其他API方法实现类似...

  async generateStory(req, res) {
    try {
      // biome-ignore lint/correctness/noUnusedVariables: 预留用于将来故事长度控制
      const { prompt, style, length } = req.body

      // 这里应该调用AI生成故事
      // 暂时返回模拟结果
      const result = {
        success: true,
        story: {
          title: '生成的测试故事',
          content: `根据提示"${prompt}"生成的测试故事内容...`,
          style: style || DEFAULT_NARRATIVE_STYLE,
          generatedAt: new Date(),
        },
      }

      res.json(result)
    } catch (error) {
      logger.error('故事生成失败:', error)
      res.status(500).json({ error: '故事生成失败' })
    }
  }

  async handlePluginCallback(req, res) {
    const { pluginName, taskId } = req.params
    const _callbackData = req.body

    logger.info(`收到插件回调: ${pluginName} - ${taskId}`)

    res.status(200).json({ status: 'received' })
  }

  // ==================== 协作会话管理 ====================

  async createCollaborationSession(req, res) {
    try {
      const sessionData = req.body
      const sessionId = `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

      const session = {
        id: sessionId,
        ...sessionData,
        createdAt: new Date(),
        status: 'active',
        participants: [],
        messages: [],
      }

      this.activeSessions.set(sessionId, session)

      res.status(201).json(session)
    } catch (error) {
      logger.error('创建协作会话失败:', error)
      res.status(500).json({ error: '创建协作会话失败' })
    }
  }

  getCollaborationSession(req, res) {
    const { id } = req.params
    const session = this.activeSessions.get(id)

    if (!session) {
      return res.status(404).json({ error: '协作会话不存在' })
    }

    res.json(session)
  }

  // ==================== 维护任务 ====================

  async cleanupExpiredSessions() {
    const now = Date.now()
    const expiredSessions = []

    for (const [sessionId, session] of this.activeSessions) {
      const sessionAge = now - session.createdAt.getTime()
      if (sessionAge > 24 * 60 * 60 * 1000) {
        // 24小时
        expiredSessions.push(sessionId)
      }
    }

    for (const sessionId of expiredSessions) {
      this.activeSessions.delete(sessionId)
    }

    if (expiredSessions.length > 0) {
      logger.info(`🧹 清理了 ${expiredSessions.length} 个过期会话`)
    }
  }

  async backupDatabases() {
    try {
      const backupDir = path.join(
        __dirname,
        'data',
        'backups',
        new Date().toISOString().split('T')[0]
      )

      if (!fsSync.existsSync(backupDir)) {
        await fs.mkdir(backupDir, { recursive: true })
      }

      // 备份故事数据库
      const storiesBackup = Object.fromEntries(this.storyDatabase)
      await fs.writeFile(
        path.join(backupDir, 'stories.json'),
        JSON.stringify(storiesBackup, null, 2)
      )

      logger.info(`💾 数据库备份完成: ${backupDir}`)
    } catch (error) {
      logger.error('数据库备份失败:', error)
    }
  }

  // ==================== 优雅关闭 ====================

  gracefulShutdown() {
    logger.info('🔄 正在关闭创世星环服务器...')

    if (this.webSocketServer) {
      this.webSocketServer.shutdown()
    }

    if (this.server) {
      this.server.close(() => {
        logger.info('✅ 创世星环服务器已安全关闭')
        process.exit(0)
      })
    }
  }
}

// 处理进程信号
process.on('SIGINT', () => {
  const server = global.creationRingServer
  if (server) {
    server.gracefulShutdown()
  } else {
    process.exit(0)
  }
})

process.on('SIGTERM', () => {
  const server = global.creationRingServer
  if (server) {
    server.gracefulShutdown()
  } else {
    process.exit(0)
  }
})

// 启动创世星环服务器
const server = new CreationRingServer()
global.creationRingServer = server

module.exports = CreationRingServer
