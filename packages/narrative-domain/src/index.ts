// ============================================================================
// 叙事领域层 - 叙事相关业务逻辑和DTO
// Narrative Domain Layer - Narrative Business Logic and DTOs
// ============================================================================

// -----------------------------------------------------------------------------
// 数据传输对象 (Data Transfer Objects)
// -----------------------------------------------------------------------------
export * from './dto/create-ai-settings.dto'
export * from './dto/create-game.dto'
export * from './dto/plugin-marketplace.dto'
export * from './dto/submit-action.dto'
export * from './dto/update-ai-settings.dto'
export * from './dto/update-character.dto'
// 行业领域服务
export * from './industry/business.service'
export * from './industry/content-creation.service'
export * from './industry/education.service'
export * from './industry/healthcare.service'
export * from './industry/industry.controller'
// -----------------------------------------------------------------------------
// 行业特定服务 (Industry-Specific Services)
// -----------------------------------------------------------------------------
// 注意：这些服务将来应该移动到独立的行业包中
export * from './industry/industry.module'
export * from './industry/manufacturing.service'
