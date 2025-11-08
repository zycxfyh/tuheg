Object.defineProperty(exports, '__esModule', { value: true })
const zod_1 = require('zod')
const create_ai_settings_dto_1 = require('./create-ai-settings.dto')
const submit_action_dto_1 = require('./submit-action.dto')
const update_ai_settings_dto_1 = require('./update-ai-settings.dto')
describe('AI settings validation schemas', () => {
  const basePayload = {
    provider: 'OpenAI',
    apiKey: 'sk-VALIDKEY_1234567890',
    modelId: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    roles: ['narrative_synthesis', 'logic_parsing'],
  }
  it('accepts a valid payload and trims fields', () => {
    const result = create_ai_settings_dto_1.createAiSettingsSchema.parse({
      ...basePayload,
      apiKey: '  sk-VALIDKEY_1234567890  ',
      modelId: ' gpt-4o-mini ',
      roles: [' narrative_synthesis ', 'logic_parsing'],
    })
    expect(result.apiKey).toBe('sk-VALIDKEY_1234567890')
    expect(result.modelId).toBe('gpt-4o-mini')
    expect(result.roles).toEqual(['narrative_synthesis', 'logic_parsing'])
  })
  it('rejects unknown providers', () => {
    expect(() =>
      create_ai_settings_dto_1.createAiSettingsSchema.parse({
        ...basePayload,
        provider: 'Unknown',
      })
    ).toThrow(zod_1.ZodError)
  })
  it('rejects API keys with spaces or invalid characters', () => {
    expect(() =>
      create_ai_settings_dto_1.createAiSettingsSchema.parse({
        ...basePayload,
        apiKey: 'sk invalid key',
      })
    ).toThrow('API key contains invalid characters.')
  })
  it('rejects role names with forbidden characters', () => {
    expect(() =>
      create_ai_settings_dto_1.createAiSettingsSchema.parse({
        ...basePayload,
        roles: ['admin', 'bad role!'],
      })
    ).toThrow('Role name can only include letters, numbers, colon, underscore, or hyphen.')
  })
  it('allows partial updates with sanitized fields', () => {
    const result = update_ai_settings_dto_1.updateAiSettingsSchema.parse({
      apiKey: 'sk-NEWKEY_123456789',
      roles: ['critic'],
    })
    expect(result.apiKey).toBe('sk-NEWKEY_123456789')
    expect(result.roles).toEqual(['critic'])
  })
  it('validates test connection payloads consistently', () => {
    expect(() =>
      update_ai_settings_dto_1.testAiConnectionSchema.parse({
        provider: 'OpenAI',
        apiKey: 'sk-invalid key',
      })
    ).toThrow('API key contains invalid characters.')
  })
})
describe('Submit action schema', () => {
  it('accepts valid command payloads', () => {
    const result = submit_action_dto_1.submitActionSchema.parse({
      type: 'command',
      payload: 'Investigate the mysterious glow.',
    })
    expect(result.payload).toBe('Investigate the mysterious glow.')
  })
  it('rejects command payloads with control characters', () => {
    expect(() =>
      submit_action_dto_1.submitActionSchema.parse({
        type: 'command',
        payload: 'Invalid\u0007payload',
      })
    ).toThrow('Command payload contains invalid control characters.')
  })
  it('rejects option payloads exceeding length limits', () => {
    expect(() =>
      submit_action_dto_1.submitActionSchema.parse({
        type: 'option',
        payload: {
          dimension: 'exploration',
          check: 'perception',
          success_rate: 'high',
          text: 'x'.repeat(401),
        },
      })
    ).toThrow('Option text must be 400 characters or fewer.')
  })
})
//# sourceMappingURL=input-validation.spec.js.map
