'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.RuleEngineExecutionException = void 0
class RuleEngineExecutionException extends Error {
  details
  constructor(message, details) {
    super(message)
    this.details = details
    this.name = 'RuleEngineExecutionException'
  }
}
exports.RuleEngineExecutionException = RuleEngineExecutionException
//# sourceMappingURL=rule-engine-exception.js.map
