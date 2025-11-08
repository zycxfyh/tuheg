import type { ZodSchema } from 'zod'
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}
export interface ValidationError {
  path: (string | number)[]
  message: string
  code: string
  expected?: string
  received?: unknown
  nested?: ValidationError[]
}
export declare class EnhancedValidator {
  static validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T>
  static validateAsync<T>(schema: ZodSchema<T>, data: unknown): Promise<ValidationResult<T>>
  static safeParse<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T>
  private static formatZodErrors
  private static formatErrorMessage
  static formatErrorsAsString(errors: ValidationError[]): string
}
//# sourceMappingURL=enhanced-validator.d.ts.map
