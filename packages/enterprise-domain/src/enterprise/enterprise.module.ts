import { Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { ComplianceService } from './compliance.service'
import { EnterpriseController } from './enterprise.controller'
import { EnterpriseIntegrationService } from './enterprise-integration.service'
import { EnterpriseSecurityService } from './enterprise-security.service'
import { MultiTenantMiddleware } from './multi-tenant.middleware'
import { TenantService } from './tenant.service'

@Module({
  providers: [
    TenantService,
    EnterpriseSecurityService,
    AuditService,
    EnterpriseIntegrationService,
    ComplianceService,
    MultiTenantMiddleware,
  ],
  controllers: [EnterpriseController],
  exports: [
    TenantService,
    EnterpriseSecurityService,
    AuditService,
    EnterpriseIntegrationService,
    ComplianceService,
  ],
})
export class EnterpriseModule {}
