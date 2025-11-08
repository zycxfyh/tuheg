Object.defineProperty(exports, '__esModule', { value: true })
const zod_1 = require('zod')
const schema_error_formatter_1 = require('./schema-error-formatter')
describe('formatZodError', () => {
  it('should format missing field error', () => {
    const schema = zod_1.z.object({
      name: zod_1.z.string(),
      age: zod_1.z.number(),
    })
    const result = schema.safeParse({ name: 'John' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      expect(formatted.summary).toContain('Validation failed')
      expect(formatted.fieldErrors.length).toBeGreaterThan(0)
      expect(formatted.fieldErrors.some((e) => e.path.includes('age'))).toBe(true)
      expect(formatted.aiFeedback).toContain('age')
    }
  })
  it('should format type mismatch error', () => {
    const schema = zod_1.z.object({
      count: zod_1.z.number(),
    })
    const result = schema.safeParse({ count: 'not-a-number' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      expect(formatted.fieldErrors.length).toBeGreaterThan(0)
      const countError = formatted.fieldErrors.find((e) => e.path === 'count')
      expect(countError).toBeDefined()
      expect(countError?.expected).toBe('number')
    }
  })
  it('should format enum error', () => {
    const schema = zod_1.z.object({
      status: zod_1.z.enum(['active', 'inactive', 'pending']),
    })
    const result = schema.safeParse({ status: 'invalid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      const statusError = formatted.fieldErrors.find((e) => e.path === 'status')
      expect(statusError).toBeDefined()
      expect(statusError?.expected).toContain('active')
      expect(statusError?.expected).toContain('inactive')
    }
  })
  it('should format array length error', () => {
    const schema = zod_1.z.object({
      items: zod_1.z.array(zod_1.z.string()).min(2),
    })
    const result = schema.safeParse({ items: ['one'] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      const itemsError = formatted.fieldErrors.find((e) => e.path === 'items')
      expect(itemsError).toBeDefined()
      expect(itemsError?.expected).toContain('at least')
    }
  })
  it('should generate AI-friendly feedback', () => {
    const schema = zod_1.z.object({
      name: zod_1.z.string().min(1),
      email: zod_1.z.string().email(),
    })
    const result = schema.safeParse({
      name: '',
      email: 'invalid-email',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      expect(formatted.aiFeedback).toContain('Validation Errors Detected')
      expect(formatted.aiFeedback).toContain('Action Required')
      expect(formatted.aiFeedback).toContain('name')
      expect(formatted.aiFeedback).toContain('email')
    }
  })
  it('should handle nested object errors', () => {
    const schema = zod_1.z.object({
      user: zod_1.z.object({
        name: zod_1.z.string(),
        age: zod_1.z.number(),
      }),
    })
    const result = schema.safeParse({
      user: { name: 'John' },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      const userAgeError = formatted.fieldErrors.find((e) => e.path.includes('age'))
      expect(userAgeError).toBeDefined()
      expect(formatted.aiFeedback).toContain('user')
    }
  })
  it('should format as JSON correctly', () => {
    const schema = zod_1.z.object({
      name: zod_1.z.string(),
    })
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = (0, schema_error_formatter_1.formatZodError)(result.error)
      const json = (0, schema_error_formatter_1.formatZodErrorAsJson)(formatted)
      expect(() => JSON.parse(json)).not.toThrow()
      const parsed = JSON.parse(json)
      expect(parsed).toHaveProperty('summary')
      expect(parsed).toHaveProperty('fieldErrors')
      expect(parsed).toHaveProperty('errorCount')
    }
  })
})
//# sourceMappingURL=schema-error-formatter.spec.js.map
