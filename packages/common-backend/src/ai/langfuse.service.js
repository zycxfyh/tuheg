'use strict'
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc)
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r
    return (c > 3 && r && Object.defineProperty(target, key, r), r)
  }
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
var LangfuseService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.LangfuseService = void 0
const common_1 = require('@nestjs/common')
const config_1 = require('@nestjs/config')
const langfuse_1 = require('langfuse')
let LangfuseService = (LangfuseService_1 = class LangfuseService {
  configService
  logger = new common_1.Logger(LangfuseService_1.name)
  langfuse = null
  constructor(configService) {
    this.configService = configService
  }
  async onModuleInit() {
    const publicKey = this.configService.get('LANGFUSE_PUBLIC_KEY')
    const secretKey = this.configService.get('LANGFUSE_SECRET_KEY')
    const baseUrl = this.configService.get('LANGFUSE_BASE_URL')
    if (publicKey && secretKey) {
      this.langfuse = new langfuse_1.Langfuse({
        publicKey,
        secretKey,
        baseUrl: baseUrl || 'https://cloud.langfuse.com',
      })
      this.langfuse.on('error', (error) => {
        this.logger.error('Langfuse error:', error)
      })
      this.logger.log('Langfuse client initialized')
    } else {
      this.logger.warn('Langfuse credentials not found, service will be disabled')
    }
  }
  async onModuleDestroy() {
    if (this.langfuse) {
      await this.langfuse.flushAsync()
      this.langfuse = null
      this.logger.log('Langfuse client shutdown')
    }
  }
  async createTrace(name, metadata, tags) {
    if (!this.langfuse) {
      return this.createMockTrace(name, metadata, tags)
    }
    try {
      const trace = this.langfuse.trace({
        name,
        metadata,
        tags,
      })
      this.logger.debug(`Created trace: ${trace.id} - ${name}`)
      return {
        id: trace.id,
        name,
        metadata,
        tags,
      }
    } catch (error) {
      this.logger.error('Failed to create Langfuse trace:', error)
      return this.createMockTrace(name, metadata, tags)
    }
  }
  async createSpan(name, traceId, metadata) {
    if (!this.langfuse) {
      return this.createMockSpan(name, traceId, metadata)
    }
    try {
      const trace = this.langfuse.trace({ id: traceId })
      const span = trace.span({
        name,
        metadata,
      })
      this.logger.debug(`Created span: ${span.id} - ${name} in trace ${traceId}`)
      return {
        id: span.id,
        name,
        traceId,
        startTime: new Date(),
        metadata,
      }
    } catch (error) {
      this.logger.error('Failed to create Langfuse span:', error)
      return this.createMockSpan(name, traceId, metadata)
    }
  }
  async endSpan(spanId, output) {
    if (!this.langfuse) {
      this.logger.debug(`Mock ended span: ${spanId}`, { output })
      return
    }
    try {
      this.logger.debug(`Span ${spanId} will be ended automatically by Langfuse`, { output })
    } catch (error) {
      this.logger.error('Failed to end Langfuse span:', error)
    }
  }
  async recordEvent(name, traceId, metadata) {
    if (!this.langfuse) {
      this.logger.debug(`Mock recorded event: ${name} in trace ${traceId}`, metadata)
      return
    }
    try {
      const trace = this.langfuse.trace({ id: traceId })
      trace.event({
        name,
        metadata,
      })
      this.logger.debug(`Recorded event: ${name} in trace ${traceId}`, metadata)
    } catch (error) {
      this.logger.error('Failed to record Langfuse event:', error)
    }
  }
  async recordModelCall(traceId, modelName, input, output, metadata) {
    if (!this.langfuse) {
      this.logger.debug(`Mock recorded model call: ${modelName} in trace ${traceId}`, {
        input,
        output,
        metadata,
      })
      return
    }
    try {
      const trace = this.langfuse.trace({ id: traceId })
      const generation = trace.generation({
        name: `model-call-${modelName}`,
        model: modelName,
        input,
        output,
        metadata,
      })
      this.logger.debug(
        `Recorded model call generation: ${generation.id} for model ${modelName} in trace ${traceId}`
      )
    } catch (error) {
      this.logger.error('Failed to record Langfuse model call:', error)
    }
  }
  async getTraceStats(traceId) {
    if (!this.langfuse) {
      return {
        traceId,
        spans: [],
        events: [],
        duration: 0,
        isMock: true,
      }
    }
    try {
      return {
        traceId,
        isMock: false,
        note: 'Use Langfuse dashboard for detailed statistics',
      }
    } catch (error) {
      this.logger.error('Failed to get Langfuse trace stats:', error)
      return {
        traceId,
        error: error instanceof Error ? error.message : String(error),
        isMock: false,
      }
    }
  }
  async logGeneration(traceId, modelName, input, output, metadata) {
    await this.recordModelCall(traceId, modelName, input, output, metadata)
  }
  async flush() {
    if (!this.langfuse) {
      this.logger.debug('Mock flushed Langfuse data')
      return
    }
    try {
      await this.langfuse.flushAsync()
      this.logger.debug('Flushed Langfuse data')
    } catch (error) {
      this.logger.error('Failed to flush Langfuse data:', error)
    }
  }
  isEnabled() {
    return this.langfuse !== null
  }
  createMockTrace(name, metadata, tags) {
    const trace = {
      id: `mock-trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      metadata,
      tags,
    }
    this.logger.debug(`Created mock trace: ${trace.id} - ${name}`)
    return trace
  }
  createMockSpan(name, traceId, metadata) {
    const span = {
      id: `mock-span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      traceId,
      startTime: new Date(),
      metadata,
    }
    this.logger.debug(`Created mock span: ${span.id} - ${name} in trace ${traceId}`)
    return span
  }
})
exports.LangfuseService = LangfuseService
exports.LangfuseService =
  LangfuseService =
  LangfuseService_1 =
    __decorate(
      [(0, common_1.Injectable)(), __metadata('design:paramtypes', [config_1.ConfigService])],
      LangfuseService
    )
//# sourceMappingURL=langfuse.service.js.map
