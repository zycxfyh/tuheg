var __decorate =
  (this && this.__decorate) ||
  ((decorators, target, key, desc) => {
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
    return c > 3 && r && Object.defineProperty(target, key, r), r
  })
var CircuitBreakerService_1
Object.defineProperty(exports, '__esModule', { value: true })
exports.CircuitBreakerService = exports.CircuitState = void 0
const common_1 = require('@nestjs/common')
var CircuitState
;((CircuitState) => {
  CircuitState['CLOSED'] = 'closed'
  CircuitState['OPEN'] = 'open'
  CircuitState['HALF_OPEN'] = 'half_open'
})(CircuitState || (exports.CircuitState = CircuitState = {}))
let CircuitBreakerService = (CircuitBreakerService_1 = class CircuitBreakerService {
  logger = new common_1.Logger(CircuitBreakerService_1.name)
  circuits = new Map()
  async execute(name, operation, options = {}) {
    const {
      failureThreshold = 5,
      failureRateThreshold = 0.5,
      timeout = 5000,
      halfOpenRequests = 3,
      successThreshold = 2,
    } = options
    const circuit = this.getOrCreateCircuit(name)
    if (circuit.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - circuit.lastFailureTime
      if (timeSinceLastFailure >= timeout) {
        circuit.state = CircuitState.HALF_OPEN
        circuit.halfOpenRequests = 0
        this.logger.log(`Circuit breaker "${name}" transitioned to HALF_OPEN`)
      } else {
        throw new Error(`Circuit breaker "${name}" is OPEN. Request rejected.`)
      }
    }
    if (circuit.state === CircuitState.HALF_OPEN) {
      if (circuit.halfOpenRequests >= halfOpenRequests) {
        throw new Error(`Circuit breaker "${name}" is HALF_OPEN. Request limit reached.`)
      }
      circuit.halfOpenRequests++
    }
    try {
      const result = await operation()
      this.recordSuccess(name, circuit, successThreshold)
      return result
    } catch (error) {
      this.recordFailure(name, circuit, failureThreshold, failureRateThreshold)
      throw error
    }
  }
  getOrCreateCircuit(name) {
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
    return this.circuits.get(name)
  }
  recordSuccess(name, circuit, successThreshold) {
    circuit.metrics.totalRequests++
    circuit.metrics.successfulRequests++
    circuit.successes++
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
    circuit.metrics.failureRate =
      circuit.metrics.totalRequests > 0
        ? circuit.metrics.failedRequests / circuit.metrics.totalRequests
        : 0
  }
  recordFailure(name, circuit, failureThreshold, failureRateThreshold) {
    circuit.metrics.totalRequests++
    circuit.metrics.failedRequests++
    circuit.failures++
    circuit.lastFailureTime = Date.now()
    circuit.metrics.failureRate =
      circuit.metrics.totalRequests > 0
        ? circuit.metrics.failedRequests / circuit.metrics.totalRequests
        : 0
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
      circuit.state = CircuitState.OPEN
      circuit.metrics.state = CircuitState.OPEN
      circuit.metrics.lastStateChange = Date.now()
      this.logger.warn(`Circuit breaker "${name}" opened after failure in HALF_OPEN state`)
    }
  }
  getMetrics(name) {
    const circuit = this.circuits.get(name)
    return circuit ? circuit.metrics : null
  }
  reset(name) {
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
})
exports.CircuitBreakerService = CircuitBreakerService
exports.CircuitBreakerService =
  CircuitBreakerService =
  CircuitBreakerService_1 =
    __decorate([(0, common_1.Injectable)()], CircuitBreakerService)
//# sourceMappingURL=circuit-breaker.service.js.map
