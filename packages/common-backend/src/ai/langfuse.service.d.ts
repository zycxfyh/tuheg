import { OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
export interface LangfuseTrace {
  id: string
  name: string
  metadata?: Record<string, unknown>
  tags?: string[]
}
export interface LangfuseSpan {
  id: string
  name: string
  traceId: string
  startTime: Date
  endTime?: Date
  metadata?: Record<string, unknown>
}
export declare class LangfuseService implements OnModuleInit, OnModuleDestroy {
  private readonly configService
  private readonly logger
  private langfuse
  constructor(configService: ConfigService)
  onModuleInit(): Promise<void>
  onModuleDestroy(): Promise<void>
  createTrace(
    name: string,
    metadata?: Record<string, unknown>,
    tags?: string[]
  ): Promise<LangfuseTrace>
  createSpan(name: string, traceId: string, metadata?: Record<string, any>): Promise<LangfuseSpan>
  endSpan(spanId: string, output?: unknown): Promise<void>
  recordEvent(name: string, traceId: string, metadata?: Record<string, any>): Promise<void>
  recordModelCall(
    traceId: string,
    modelName: string,
    input: unknown,
    output: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void>
  getTraceStats(traceId: string): Promise<any>
  logGeneration(
    traceId: string,
    modelName: string,
    input: unknown,
    output: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void>
  flush(): Promise<void>
  isEnabled(): boolean
  private createMockTrace
  private createMockSpan
}
//# sourceMappingURL=langfuse.service.d.ts.map
