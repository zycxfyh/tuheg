// ============================================================================
// 企业领域层 - 企业级业务逻辑和服务
// Enterprise Domain Layer - Enterprise Business Logic and Services
// ============================================================================

// -----------------------------------------------------------------------------
// 企业核心服务 (Enterprise Core Services)
// -----------------------------------------------------------------------------
export * from './enterprise/enterprise.module'
export * from './enterprise/tenant.service'
export * from './enterprise/audit.service'
export * from './enterprise/enterprise-security.service'
export * from './enterprise/multi-tenant.middleware'

// -----------------------------------------------------------------------------
// 企业安全测试 (Enterprise Security Tests)
// -----------------------------------------------------------------------------
// 注意：测试文件通常不应该在生产环境中导出
// export * from './security/api-security.e2e-spec'
// export * from './security/auth-security.e2e-spec'
