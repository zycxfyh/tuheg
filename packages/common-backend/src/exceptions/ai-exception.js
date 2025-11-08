'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.AiGenerationException = void 0
class AiGenerationException extends Error {
  details
  constructor(message, details) {
    super(message)
    this.details = details
    this.name = 'AiGenerationException'
  }
}
exports.AiGenerationException = AiGenerationException
//# sourceMappingURL=ai-exception.js.map
