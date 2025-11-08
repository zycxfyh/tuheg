'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.PromptInjectionDetectedException = void 0
const common_1 = require('@nestjs/common')
class PromptInjectionDetectedException extends common_1.BadRequestException {
  details
  constructor(message, details) {
    super(message)
    this.details = details
    this.name = 'PromptInjectionDetectedException'
  }
}
exports.PromptInjectionDetectedException = PromptInjectionDetectedException
//# sourceMappingURL=prompt-injection-detected.exception.js.map
