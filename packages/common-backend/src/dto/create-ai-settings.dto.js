Object.defineProperty(exports, '__esModule', { value: true })
exports.createAiSettingsSchema =
  exports.baseUrlSchema =
  exports.roleNameSchema =
  exports.modelIdSchema =
  exports.apiKeySchema =
  exports.providerSchema =
  exports.allowedProviders =
    void 0
const zod_1 = require('zod')
exports.allowedProviders = [
  'DeepSeek',
  'Moonshot',
  'OpenAI',
  'Groq',
  'Ollama',
  'CustomOpenAICompatible',
]
exports.providerSchema = zod_1.z.enum(exports.allowedProviders, {
  message: 'Unsupported provider. Please select a known provider or CustomOpenAICompatible.',
})
exports.apiKeySchema = zod_1.z
  .string()
  .trim()
  .min(16, { message: 'API key must be at least 16 characters long.' })
  .max(200, { message: 'API key must be 200 characters or fewer.' })
  .regex(/^[A-Za-z0-9_\-.+=:/]+$/, {
    message: 'API key contains invalid characters.',
  })
exports.modelIdSchema = zod_1.z
  .string()
  .trim()
  .min(1, { message: 'Model ID is required.' })
  .max(120, { message: 'Model ID must be 120 characters or fewer.' })
  .regex(/^[A-Za-z0-9._\-:/]+$/, {
    message: 'Model ID contains invalid characters.',
  })
exports.roleNameSchema = zod_1.z
  .string()
  .trim()
  .min(1, { message: 'Role name cannot be empty.' })
  .max(40, { message: 'Role name must be 40 characters or fewer.' })
  .regex(/^[A-Za-z0-9:_-]+$/, {
    message: 'Role name can only include letters, numbers, colon, underscore, or hyphen.',
  })
exports.baseUrlSchema = zod_1.z
  .string()
  .trim()
  .url({ message: 'Base URL must be a valid URL.' })
  .max(300, { message: 'Base URL must be 300 characters or fewer.' })
exports.createAiSettingsSchema = zod_1.z.object({
  provider: exports.providerSchema,
  apiKey: exports.apiKeySchema,
  modelId: exports.modelIdSchema,
  baseUrl: exports.baseUrlSchema.optional().nullable(),
  roles: zod_1.z
    .array(exports.roleNameSchema)
    .max(20, {
      message: 'No more than 20 roles can be assigned to a configuration.',
    })
    .optional(),
})
//# sourceMappingURL=create-ai-settings.dto.js.map
