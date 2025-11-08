Object.defineProperty(exports, '__esModule', { value: true })
const zod_1 = require('zod')
const enhanced_validator_1 = require('./enhanced-validator')
describe('EnhancedValidator', () => {
  describe('validate', () => {
    it('应该成功验证有效数据', () => {
      const schema = zod_1.z.object({
        name: zod_1.z.string().min(3),
        age: zod_1.z.number().min(0),
      })
      const result = enhanced_validator_1.EnhancedValidator.validate(schema, {
        name: 'John Doe',
        age: 25,
      })
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'John Doe', age: 25 })
      expect(result.errors).toBeUndefined()
    })
    it('应该返回友好的错误消息', () => {
      const schema = zod_1.z.object({
        name: zod_1.z.string().min(3),
        age: zod_1.z.number().min(0),
      })
      const result = enhanced_validator_1.EnhancedValidator.validate(schema, {
        name: 'Jo',
        age: -1,
      })
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
      const nameError = result.errors?.find((e) => e.path.includes('name'))
      expect(nameError?.message).toContain('字符串长度至少为')
    })
    it('应该处理类型错误', () => {
      const schema = zod_1.z.object({
        email: zod_1.z.string().email(),
      })
      const result = enhanced_validator_1.EnhancedValidator.validate(schema, {
        email: 123,
      })
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      const emailError = result.errors?.find((e) => e.path.includes('email'))
      expect(emailError?.code).toBe('invalid_type')
      expect(emailError?.expected).toBe('string')
    })
  })
  describe('safeParse', () => {
    it('应该安全解析数据', () => {
      const schema = zod_1.z.object({
        value: zod_1.z.string(),
      })
      const result = enhanced_validator_1.EnhancedValidator.safeParse(schema, { value: 'test' })
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ value: 'test' })
    })
    it('应该在不抛出异常的情况下处理错误', () => {
      const schema = zod_1.z.object({
        value: zod_1.z.string(),
      })
      const result = enhanced_validator_1.EnhancedValidator.safeParse(schema, { value: 123 })
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })
  describe('formatErrorsAsString', () => {
    it('应该格式化错误为字符串', () => {
      const schema = zod_1.z.object({
        name: zod_1.z.string().min(3),
        age: zod_1.z.number().min(0),
      })
      const result = enhanced_validator_1.EnhancedValidator.validate(schema, {
        name: 'Jo',
        age: -1,
      })
      if (!result.success && result.errors) {
        const formatted = enhanced_validator_1.EnhancedValidator.formatErrorsAsString(result.errors)
        expect(formatted).toContain('name')
        expect(formatted).toContain('age')
      }
    })
  })
})
//# sourceMappingURL=enhanced-validator.spec.js.map
