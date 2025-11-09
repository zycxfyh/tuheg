// Mock implementation of langfuse-core for testing
export class LangfuseCore {
  // Mock methods that might be called via dynamic import
  async dynamicImport() {
    return Promise.resolve({})
  }

  // Add other methods as needed
}

export class LangfuseWebStateless {
  // Mock methods
  authCheck() {
    return Promise.resolve({ valid: true })
  }
}

export class LangfuseTraceClient {
  end() {
    return this
  }
}

export class LangfuseSpanClient {
  end() {
    return this
  }
}

export class LangfuseGenerationClient {
  end() {
    return this
  }
}

export class LangfusePromptClient {}

export class ChatPromptClient {}

export class TextPromptClient {}

export class LangfuseEventClient {}

export class LangfuseMedia {}

export class LangfusePromptRecord {}

// Type definitions
export type LangfuseCoreOptions = any
export type LangfusePersistedProperty = any
export type LangfuseFetchOptions = any
export type LangfuseFetchResponse = any
export type CreateLangfuseTraceBody = any
export type CreateLangfuseGenerationBody = any

export default LangfuseCore
