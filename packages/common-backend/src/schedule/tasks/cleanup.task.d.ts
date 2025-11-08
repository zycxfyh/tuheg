import { PrismaService } from '../../prisma/prisma.service'
export declare class CleanupTask {
  private readonly prisma
  private readonly logger
  constructor(prisma: PrismaService)
  cleanupExpiredSessions(): Promise<void>
  cleanupOldLogs(): Promise<void>
  cleanupTempFiles(): Promise<void>
  healthCheck(): Promise<void>
}
//# sourceMappingURL=cleanup.task.d.ts.map
