import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AiConfigCard from './AiConfigCard.vue'
import { renderWithProviders } from '../../test-utils'

// Mock the composables and stores
vi.mock('@/stores/ai.store', () => ({
  useAiStore: () => ({
    configurations: [
      {
        id: 'config-1',
        provider: 'OpenAI',
        modelId: 'gpt-4',
        apiKey: 'sk-...',
        baseUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isLoading: false,
    error: null,
    loadConfigurations: vi.fn(),
    createConfiguration: vi.fn(),
    updateConfiguration: vi.fn(),
    deleteConfiguration: vi.fn(),
    testConfiguration: vi.fn(),
  }),
}))

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}))

describe('AiConfigCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render configuration details correctly', () => {
    const config = {
      id: 'config-1',
      provider: 'OpenAI',
      modelId: 'gpt-4',
      apiKey: 'sk-...****',
      baseUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config },
    })

    expect(wrapper.text()).toContain('OpenAI')
    expect(wrapper.text()).toContain('gpt-4')
    expect(wrapper.text()).toContain('sk-...****')
  })

  it('should display masked API key', () => {
    const config = {
      id: 'config-2',
      provider: 'Anthropic',
      modelId: 'claude-3',
      apiKey: 'sk-ant-api03-very-long-key-here',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config },
    })

    expect(wrapper.text()).toContain('sk-ant-...')
    expect(wrapper.text()).not.toContain('sk-ant-api03-very-long-key-here')
  })

  it('should show edit button when editable', () => {
    const config = {
      id: 'config-3',
      provider: 'Google',
      modelId: 'gemini-pro',
      apiKey: 'AIza...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, editable: true },
    })

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.exists()).toBe(true)
  })

  it('should hide edit button when not editable', () => {
    const config = {
      id: 'config-4',
      provider: 'DeepSeek',
      modelId: 'deepseek-chat',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, editable: false },
    })

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.exists()).toBe(false)
  })

  it('should emit edit event when edit button is clicked', async () => {
    const config = {
      id: 'config-5',
      provider: 'OpenAI',
      modelId: 'gpt-3.5-turbo',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, editable: true },
    })

    const editButton = wrapper.find('[data-testid="edit-button"]')
    await editButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('edit')
    expect(wrapper.emitted('edit')![0]).toEqual([config])
  })

  it('should display custom base URL when provided', () => {
    const config = {
      id: 'config-6',
      provider: 'Custom',
      modelId: 'custom-model',
      apiKey: 'custom-key',
      baseUrl: 'https://custom-api.example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config },
    })

    expect(wrapper.text()).toContain('custom-api.example.com')
  })

  it('should show loading state when testing configuration', () => {
    const config = {
      id: 'config-7',
      provider: 'OpenAI',
      modelId: 'gpt-4',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, isTesting: true },
    })

    const testButton = wrapper.find('[data-testid="test-button"]')
    expect(testButton.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('测试中')
  })

  it('should show success state after successful test', () => {
    const config = {
      id: 'config-8',
      provider: 'Anthropic',
      modelId: 'claude-3',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, testResult: 'success' },
    })

    expect(wrapper.find('.test-success').exists()).toBe(true)
  })

  it('should show error state after failed test', () => {
    const config = {
      id: 'config-9',
      provider: 'Google',
      modelId: 'gemini-pro',
      apiKey: 'AIza...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, testResult: 'error', testError: 'Invalid API key' },
    })

    expect(wrapper.find('.test-error').exists()).toBe(true)
    expect(wrapper.text()).toContain('Invalid API key')
  })

  it('should handle different provider icons', () => {
    const providers = [
      { provider: 'OpenAI', iconClass: 'openai-icon' },
      { provider: 'Anthropic', iconClass: 'anthropic-icon' },
      { provider: 'Google', iconClass: 'google-icon' },
      { provider: 'DeepSeek', iconClass: 'deepseek-icon' },
    ]

    providers.forEach(({ provider, iconClass }) => {
      const config = {
        id: `config-${provider}`,
        provider,
        modelId: 'model',
        apiKey: 'key',
        baseUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const wrapper = renderWithProviders(AiConfigCard, {
        props: { config },
      })

      const icon = wrapper.find(`.${iconClass}`)
      expect(icon.exists()).toBe(true)
    })
  })

  it('should format creation date correctly', () => {
    const createdAt = new Date('2024-01-15T10:30:00Z')
    const config = {
      id: 'config-date',
      provider: 'OpenAI',
      modelId: 'gpt-4',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt,
      updatedAt: createdAt,
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config },
    })

    // Check if date is displayed (exact format may vary)
    expect(wrapper.text()).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  it('should be accessible with proper ARIA labels', () => {
    const config = {
      id: 'config-accessible',
      provider: 'OpenAI',
      modelId: 'gpt-4',
      apiKey: 'sk-...',
      baseUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const wrapper = renderWithProviders(AiConfigCard, {
      props: { config, editable: true },
    })

    const editButton = wrapper.find('[data-testid="edit-button"]')
    expect(editButton.attributes('aria-label')).toContain('编辑')
  })
})
