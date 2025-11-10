// ============================================================================
// AI 领域层 - 核心业务逻辑和服务
// AI Domain Layer - Core Business Logic and Services
// ============================================================================

// -----------------------------------------------------------------------------
// 核心 AI 服务 (Core AI Services)
// -----------------------------------------------------------------------------
export * from './ai/ai-guard'
export * from './ai/ai-provider.factory'
export * from './ai/dynamic-ai-scheduler.service'
export * from './ai/json-cleaner'
export * from './ai/retry-strategy'
export * from './ai/schema-error-formatter'

// -----------------------------------------------------------------------------
// AI 能力服务 (AI Capability Services)
// -----------------------------------------------------------------------------
export * from './ai/crew'                    // AI协作编排
export * from './ai/memory-hierarchy.service' // 记忆层次管理
export * from './ai/multimodal.service'      // 多模态处理
export * from './ai/vector-search.service'   // 向量搜索
export * from './ai/time-aware-vector-search.service' // 时间感知向量搜索
export * from './ai/vcp-meta-thinking.service' // VCP元思考

// -----------------------------------------------------------------------------
// AI 模块 (AI Modules)
// -----------------------------------------------------------------------------
export * from './ai/memory-hierarchy.module'
export * from './ai/multimodal.module'
export * from './ai/time-aware-vector-search.module'
export * from './ai/vcp-meta-thinking.module'
export * from './ai/vector-search.module'

// -----------------------------------------------------------------------------
// 插件系统 (Plugin System)
// -----------------------------------------------------------------------------
export * from './plugins/plugin-sandbox.service'

// -----------------------------------------------------------------------------
// 提示词管理 (Prompt Management)
// -----------------------------------------------------------------------------
export * from './prompts/prompt-manager.module'
export * from './prompts/prompt-manager.service'

// -----------------------------------------------------------------------------
// VCP 协议 (VCP Protocol)
// -----------------------------------------------------------------------------
export * from './vcp'

// -----------------------------------------------------------------------------
// 类型定义 (Type Definitions)
// -----------------------------------------------------------------------------
export * from './types/ai-providers.types'
export * from './types/queue.types'

// -----------------------------------------------------------------------------
// 示例和演示 (Examples and Demos)
// -----------------------------------------------------------------------------
// 注意：示例文件通常不应该在生产环境中导出
// export * from './ai/memory-hierarchy-examples'
// export * from './ai/multimodal-examples'
// export * from './ai/time-aware-vector-search-examples'
// export * from './ai/vcp-meta-thinking-examples'
