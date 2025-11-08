import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { EnterpriseSecurityService } from './enterprise-security.service';
import { AuditService } from './audit.service';
import { EnterpriseIntegrationService } from './enterprise-integration.service';
import { ComplianceService } from './compliance.service';
import { EnterpriseController } from './enterprise.controller';
import { MultiTenantMiddleware } from './multi-tenant.middleware';

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
