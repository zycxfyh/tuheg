'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.testAiConnectionSchema = exports.updateAiSettingsSchema = void 0
const zod_1 = require('zod')
const create_ai_settings_dto_1 = require('./create-ai-settings.dto')
exports.updateAiSettingsSchema = zod_1.z.object({
  provider: create_ai_settings_dto_1.providerSchema.optional(),
  apiKey: create_ai_settings_dto_1.apiKeySchema.optional(),
  modelId: create_ai_settings_dto_1.modelIdSchema.optional(),
  baseUrl: create_ai_settings_dto_1.baseUrlSchema.optional().nullable(),
  roles: zod_1.z
    .array(create_ai_settings_dto_1.roleNameSchema)
    .max(20, {
      message: 'No more than 20 roles can be assigned to a configuration.',
    })
    .optional(),
})
exports.testAiConnectionSchema = zod_1.z.object({
  provider: create_ai_settings_dto_1.providerSchema,
  apiKey: create_ai_settings_dto_1.apiKeySchema,
  baseUrl: create_ai_settings_dto_1.baseUrlSchema.optional().nullable(),
  modelId: create_ai_settings_dto_1.modelIdSchema.optional(),
})
//# sourceMappingURL=update-ai-settings.dto.js.map
