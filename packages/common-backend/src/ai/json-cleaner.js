Object.defineProperty(exports, '__esModule', { value: true })
exports.JsonSanitizationError = void 0
exports.cleanAndParseJson = cleanAndParseJson
class JsonSanitizationError extends Error {
  context
  constructor(message, context) {
    super(message)
    this.context = context
    this.name = 'JsonSanitizationError'
  }
}
exports.JsonSanitizationError = JsonSanitizationError
function isAcceptableJsonValue(value) {
  if (value === null) {
    return false
  }
  if (Array.isArray(value)) {
    return true
  }
  return typeof value === 'object'
}
function stripCodeFences(raw) {
  let result = raw.trim()
  if (result.startsWith('```')) {
    result = result.replace(/^```[a-zA-Z]*\s*/i, '')
  }
  if (result.endsWith('```')) {
    result = result.replace(/```$/i, '')
  }
  return result.trim()
}
function extractJsonCore(raw) {
  const firstBrace = raw.indexOf('{')
  const firstBracket = raw.indexOf('[')
  let start = -1
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket)
  } else {
    start = Math.max(firstBrace, firstBracket)
  }
  if (start === -1) {
    return raw
  }
  const lastBrace = raw.lastIndexOf('}')
  const lastBracket = raw.lastIndexOf(']')
  const endCandidates = [lastBrace, lastBracket].filter((index) => index !== -1)
  const end = endCandidates.length > 0 ? Math.max(...endCandidates) : raw.length - 1
  if (end <= start) {
    return raw.slice(start)
  }
  return raw.slice(start, end + 1)
}
function normalizeQuotes(raw) {
  const hasDoubleQuotes = raw.includes('"')
  const hasSingleQuotes = raw.includes("'")
  if (!hasDoubleQuotes && hasSingleQuotes) {
    return raw.replace(/'/g, '"')
  }
  return raw
}
async function cleanAndParseJson(raw) {
  if (typeof raw !== 'string') {
    return raw
  }
  let working = stripCodeFences(raw)
  working = extractJsonCore(working)
  working = working.trim()
  const attempts = [
    () => JSON.parse(working),
    async () => {
      try {
        const { jsonrepair } = await import('jsonrepair')
        const repaired = jsonrepair(working)
        console.log('jsonrepair input:', JSON.stringify(working))
        console.log('jsonrepair output:', JSON.stringify(repaired))
        return JSON.parse(repaired)
      } catch (error) {
        console.log('jsonrepair strategy failed:', error)
        return undefined
      }
    },
    async () => {
      try {
        const { jsonrepair } = await import('jsonrepair')
        return JSON.parse(jsonrepair(normalizeQuotes(working)))
      } catch {
        return undefined
      }
    },
    () => JSON.parse(normalizeQuotes(working)),
  ]
  let lastError
  for (const attempt of attempts) {
    try {
      const parsed = await attempt()
      if (parsed === undefined) {
        continue
      }
      if (isAcceptableJsonValue(parsed)) {
        return parsed
      }
      lastError = new Error('Sanitized output was not a JSON object or array.')
    } catch (error) {
      lastError = error
      console.log(`Strategy failed:`, error)
    }
  }
  throw new JsonSanitizationError('Failed to sanitize AI output into valid JSON.', {
    raw,
    lastError,
  })
}
//# sourceMappingURL=json-cleaner.js.map
