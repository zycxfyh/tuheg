export declare enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}
export interface CircuitBreakerOptions {
  failureThreshold?: number
  failureRateThreshold?: number
  timeout?: number
  halfOpenRequests?: number
  successThreshold?: number
}
export interface CircuitBreakerMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  failureRate: number
  state: CircuitState
  lastStateChange: number
}
export declare class CircuitBreakerService {
  private readonly logger
  private readonly circuits
  execute<T>(name: string, operation: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T>
  private getOrCreateCircuit
  private recordSuccess
  private recordFailure
  getMetrics(name: string): CircuitBreakerMetrics | null
  reset(name: string): void
}
//# sourceMappingURL=circuit-breaker.service.d.ts.map
