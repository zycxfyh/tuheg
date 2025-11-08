// 文件路径: packages/common-backend/src/resilience/circuit-breaker.service.ts
// 核心理念: 熔断器模式，防止级联故障

import { Injectable, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'

/**
 * @enum CircuitState
 * @description 熔断器状态
 */
export enum CircuitState {
  /** 关闭状态：正常处理请求 */
  CLOSED = 'closed',
  /** 开启状态：拒绝所有请求，直接失败 */
  OPEN = 'open',
  /** 半开状态：允许部分请求通过，测试服务是否恢复 */
  HALF_OPEN = 'half_open',
}

/**
 * @interface CircuitBreakerOptions
 * @description 熔断器选项
 */
export interface CircuitBreakerOptions {
  /** 失败阈值（触发熔断的失败次数） */
  failureThreshold?: number
  /** 失败率阈值（触发熔断的失败率，0-1） */
  failureRateThreshold?: number
  /** 时间窗口（毫秒） */
  timeout?: number
  /** 半开状态允许的请求数 */
  halfOpenRequests?: number
  /** 半开状态成功后切换到关闭状态需要的成功次数 */
  successThreshold?: number
}

/**
 * @interface CircuitBreakerMetrics
 * @description 熔断器指标
 */
export interface CircuitBreakerMetrics {
  /** 总请求数 */
  totalRequests: number
  /** 成功请求数 */
  successfulRequests: number
  /** 失败请求数 */
  failedRequests: number
  /** 当前失败率 */
  failureRate: number
  /** 当前状态 */
  state: CircuitState
  /** 最后状态变更时间 */
  lastStateChange: number
}

/**
 * @class CircuitBreakerService
 * @description 熔断器服务
 * 实现熔断器模式，防止级联故障
 * 支持 Redis 存储以实现集群一致性
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name)

  // Redis 客户端（用于分布式存储）
  private redisClient?: Redis

  // 内存存储（fallback when Redis is unavailable）
  private readonly circuits = new Map<
    string,
    {
      state: CircuitState
      failures: number
      successes: number
      lastFailureTime: number
      halfOpenRequests: number
      metrics: CircuitBreakerMetrics
    }
  >()

  constructor() {
    this.initRedis()
  }

  /**
   * 初始化 Redis 客户端
   */
  private initRedis(): void {
    const redisUrl = process.env.REDIS_URL
    if (redisUrl) {
      try {
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
        })

        this.redisClient.on('error', (error) => {
          this.logger.warn('Redis connection error, falling back to memory store:', error)
          this.redisClient = undefined
        })

        this.logger.log('Circuit breaker using Redis storage')
      } catch (error) {
        this.logger.warn('Failed to initialize Redis, using memory store:', error)
      }
    } else {
      this.logger.log('Circuit breaker using memory store (REDIS_URL not configured)')
    }
  }

  /**
   * @method execute
   * @description 执行受保护的操作
   *
   * @example
   * ```typescript
   * const result = await circuitBreakerService.execute(
   *   'ai-api',
   *   async () => await aiService.call(),
   *   { failureThreshold: 5, timeout: 5000 },
   * );
   * ```
   */
  async execute<T>(
    name: string,
    operation: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ): Promise<T> {
    const {
      failureThreshold = 5,
      failureRateThreshold = 0.5,
      timeout = 5000,
      halfOpenRequests = 3,
      successThreshold = 2,
    } = options

    const circuit = await this.getOrCreateCircuit(name)

    // 检查熔断器状态
    if (circuit.state === CircuitState.OPEN) {
      // 检查是否可以进入半开状态
      const timeSinceLastFailure = Date.now() - circuit.lastFailureTime
      if (timeSinceLastFailure >= timeout) {
        circuit.state = CircuitState.HALF_OPEN
        circuit.halfOpenRequests = 0
        this.logger.log(`Circuit breaker "${name}" transitioned to HALF_OPEN`)
      } else {
        throw new Error(`Circuit breaker "${name}" is OPEN. Request rejected.`)
      }
    }

    // 半开状态：限制请求数
    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.halfOpenRequests >= halfOpenRequests) {
        throw new Error(`Circuit breaker "${name}" is HALF_OPEN. Request limit reached.`)
      }
      circuit.halfOpenRequests++
    }

    // 执行操作
    try {
      const result = await operation()

      // 成功
      await this.recordSuccess(name, circuit, successThreshold)
      return result
    } catch (error) {
      // 失败
      await this.recordFailure(name, circuit, failureThreshold, failureRateThreshold)
      throw error
    }
  }

  /**
   * @method getOrCreateCircuit
   * @description 获取或创建熔断器
   */
  private async getOrCreateCircuit(name: string) {
    // Primeiro tenta carregar do Redis
    if (this.redisClient) {
      try {
        const redisKey = `circuit_breaker:${name}`
        const data = await this.redisClient.hgetall(redisKey)

        if (Object.keys(data).length > 0) {
          const circuit = {
            state: data.state as CircuitState || CircuitState.CLOSED,
            failures: parseInt(data.failures) || 0,
            successes: parseInt(data.successes) || 0,
            lastFailureTime: parseInt(data.lastFailureTime) || 0,
            halfOpenRequests: parseInt(data.halfOpenRequests) || 0,
            metrics: {
              totalRequests: parseInt(data.totalRequests) || 0,
              successfulRequests: parseInt(data.successfulRequests) || 0,
              failedRequests: parseInt(data.failedRequests) || 0,
              failureRate: parseFloat(data.failureRate) || 0,
              state: data.state as CircuitState || CircuitState.CLOSED,
              lastStateChange: parseInt(data.lastStateChange) || Date.now(),
            },
          }
          this.circuits.set(name, circuit)
          return circuit
        }
      } catch (error) {
        this.logger.warn(`Failed to load circuit breaker ${name} from Redis, using memory:`, error)
      }
    }

    // Fallback para memória
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: CircuitState.CLOSED,
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        halfOpenRequests: 0,
        metrics: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          failureRate: 0,
          state: CircuitState.CLOSED,
          lastStateChange: Date.now(),
        },
      })
    }
    return this.circuits.get(name)!
  }

  /**
   * @method saveCircuitToRedis
   * @description 保存熔断器状态到 Redis
   */
  private async saveCircuitToRedis(name: string, circuit: ReturnType<typeof this.getOrCreateCircuit>): Promise<void> {
    if (!this.redisClient) return

    try {
      const redisKey = `circuit_breaker:${name}`
      const data = {
        state: circuit.state,
        failures: circuit.failures.toString(),
        successes: circuit.successes.toString(),
        lastFailureTime: circuit.lastFailureTime.toString(),
        halfOpenRequests: circuit.halfOpenRequests.toString(),
        totalRequests: circuit.metrics.totalRequests.toString(),
        successfulRequests: circuit.metrics.successfulRequests.toString(),
        failedRequests: circuit.metrics.failedRequests.toString(),
        failureRate: circuit.metrics.failureRate.toString(),
        lastStateChange: circuit.metrics.lastStateChange.toString(),
      }

      await this.redisClient.hmset(redisKey, data)
      // Definir TTL de 24 horas para evitar acúmulo de dados antigos
      await this.redisClient.expire(redisKey, 86400)
    } catch (error) {
      this.logger.warn(`Failed to save circuit breaker ${name} to Redis:`, error)
    }
  }

  /**
   * @method recordSuccess
   * @description 记录成功
   */
  private async recordSuccess(
    name: string,
    circuit: ReturnType<typeof this.getOrCreateCircuit>,
    successThreshold: number
  ): Promise<void> {
    circuit.metrics.totalRequests++
    circuit.metrics.successfulRequests++
    circuit.successes++

    // 半开状态：如果成功次数达到阈值，切换到关闭状态
    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.successes >= successThreshold) {
        circuit.state = CircuitState.CLOSED
        circuit.failures = 0
        circuit.successes = 0
        circuit.metrics.state = CircuitState.CLOSED
        circuit.metrics.lastStateChange = Date.now()
        this.logger.log(`Circuit breaker "${name}" transitioned to CLOSED`)
      }
    }

    // 更新失败率
    circuit.metrics.failureRate =
      circuit.metrics.totalRequests > 0
        ? circuit.metrics.failedRequests / circuit.metrics.totalRequests
        : 0

    // 保存到 Redis
    await this.saveCircuitToRedis(name, circuit)
  }

  /**
   * @method recordFailure
   * @description 记录失败
   */
  private async recordFailure(
    name: string,
    circuit: ReturnType<typeof this.getOrCreateCircuit>,
    failureThreshold: number,
    failureRateThreshold: number
  ): Promise<void> {
    circuit.metrics.totalRequests++
    circuit.metrics.failedRequests++
    circuit.failures++
    circuit.lastFailureTime = Date.now()

    // 更新失败率
    circuit.metrics.failureRate =
      circuit.metrics.totalRequests > 0
        ? circuit.metrics.failedRequests / circuit.metrics.totalRequests
        : 0

    // 检查是否需要开启熔断器
    if (circuit.state === CircuitState.CLOSED) {
      const shouldOpen =
        circuit.failures >= failureThreshold || circuit.metrics.failureRate >= failureRateThreshold

      if (shouldOpen) {
        circuit.state = CircuitState.OPEN
        circuit.metrics.state = CircuitState.OPEN
        circuit.metrics.lastStateChange = Date.now()
        this.logger.warn(
          `Circuit breaker "${name}" opened due to failures: ${circuit.failures}, failure rate: ${circuit.metrics.failureRate.toFixed(2)}`
        )
      }
    } else if (circuit.state === CircuitState.HALF_OPEN) {
      // 半开状态：如果失败，立即切换到开启状态
      circuit.state = CircuitState.OPEN
      circuit.metrics.state = CircuitState.OPEN
      circuit.metrics.lastStateChange = Date.now()
      this.logger.warn(`Circuit breaker "${name}" opened after failure in HALF_OPEN state`)
    }

    // 保存到 Redis
    await this.saveCircuitToRedis(name, circuit)
  }

  /**
   * @method getMetrics
   * @description 获取熔断器指标
   */
  getMetrics(name: string): CircuitBreakerMetrics | null {
    const circuit = this.circuits.get(name)
    return circuit ? circuit.metrics : null
  }

  /**
   * @method reset
   * @description 重置熔断器
   */
  reset(name: string): void {
    const circuit = this.circuits.get(name)
    if (circuit) {
      circuit.state = CircuitState.CLOSED
      circuit.failures = 0
      circuit.successes = 0
      circuit.halfOpenRequests = 0
      circuit.metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        failureRate: 0,
        state: CircuitState.CLOSED,
        lastStateChange: Date.now(),
      }
      this.logger.log(`Circuit breaker "${name}" reset`)
    }
  }
}
