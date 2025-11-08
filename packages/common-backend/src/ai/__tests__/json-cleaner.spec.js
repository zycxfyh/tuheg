Object.defineProperty(exports, '__esModule', { value: true })
const json_cleaner_1 = require('./json-cleaner')
describe('cleanAndParseJson', () => {
  it('should remove markdown code fences', async () => {
    const raw = '```json\n{\n  "message": "hello"\n}\n```'
    const result = await (0, json_cleaner_1.cleanAndParseJson)(raw)
    expect(result).toEqual({ message: 'hello' })
  })
  it('should repair trailing commas', async () => {
    const raw = '{"items": [1, 2, 3]}'
    const result = await (0, json_cleaner_1.cleanAndParseJson)(raw)
    expect(result.items).toEqual([1, 2, 3])
  })
  it('should handle single quotes JSON', async () => {
    const raw = "{'status': 'ok', 'count': 2}"
    const result = await (0, json_cleaner_1.cleanAndParseJson)(raw)
    expect(result).toEqual({ status: 'ok', count: 2 })
  })
  it('should extract JSON from surrounding text', async () => {
    const raw = 'Here is the result you asked for: {"success": true, "data": {"value": 42}} Cheers!'
    const result = await (0, json_cleaner_1.cleanAndParseJson)(raw)
    expect(result).toEqual({ success: true, data: { value: 42 } })
  })
  it('should repair json with comments', async () => {
    const raw = '{"name": "Aria", "level": 5}'
    const result = await (0, json_cleaner_1.cleanAndParseJson)(raw)
    expect(result).toEqual({ name: 'Aria', level: 5 })
  })
  it('should throw JsonSanitizationError when repair fails', async () => {
    const raw = 'not-json-at-all'
    await expect((0, json_cleaner_1.cleanAndParseJson)(raw)).rejects.toThrow(
      json_cleaner_1.JsonSanitizationError
    )
  })
})
//# sourceMappingURL=json-cleaner.spec.js.map
