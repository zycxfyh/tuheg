import { z } from 'zod'
export interface FormattedValidationError {
  summary: string
  fieldErrors: Array<{
    path: string
    expected: string
    received: string | undefined
    message: string
  }>
  aiFeedback: string
}
export declare function formatZodError(error: z.ZodError): FormattedValidationError
export declare function formatZodErrorAsJson(formattedError: FormattedValidationError): string
//# sourceMappingURL=schema-error-formatter.d.ts.map
