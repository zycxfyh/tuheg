import * as fs from 'fs'
import * as path from 'path'
import { type PluginType, VCPPlugin } from '../PluginFramework'

// VCPToolBox 插件生成器
// 专注于AI叙事创作的插件模板生成

export interface PluginTemplate {
  id: string
  name: string
  description: string
  type: PluginType
  category: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  features: string[]
  files: TemplateFile[]
  dependencies: string[]
  configuration: TemplateConfig
}

export interface TemplateFile {
  path: string
  content: string
  executable?: boolean
}

export interface TemplateConfig {
  prompts: ConfigPrompt[]
  variables: Record<string, any>
  validation: ConfigValidation[]
}

export interface ConfigPrompt {
  id: string
  type: 'input' | 'select' | 'multiselect' | 'confirm'
  message: string
  default?: any
  choices?: string[]
  required?: boolean
  validate?: (value: any) => boolean | string
}

export interface ConfigValidation {
  field: string
  rule: string
  message: string
}

// 插件生成器类
export class PluginGenerator {
  private templates: Map<string, PluginTemplate> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  // 初始化内置模板
  private initializeTemplates() {
    // 故事生成器模板
    this.templates.set('story-generator-basic', {
      id: 'story-generator-basic',
      name: '基础故事生成器',
      description: '创建简单的故事生成插件，支持自定义提示和基本故事结构',
      type: 'story-generator',
      category: '故事创作',
      complexity: 'beginner',
      features: ['自定义故事提示', '基础故事结构', '简单文本生成', '配置界面'],
      files: [
        {
          path: 'src/index.ts',
          content: this.getStoryGeneratorTemplate(),
        },
        {
          path: 'src/types.ts',
          content: this.getStoryTypesTemplate(),
        },
        {
          path: 'src/config.ts',
          content: this.getConfigTemplate(),
        },
        {
          path: 'package.json',
          content: this.getPackageTemplate('story-generator-basic'),
        },
        {
          path: 'vcptoolbox.json',
          content: this.getManifestTemplate(
            'story-generator-basic',
            '基础故事生成器',
            'story-generator'
          ),
        },
        {
          path: 'README.md',
          content: this.getReadmeTemplate('基础故事生成器'),
        },
      ],
      dependencies: ['@vcptoolbox/core'],
      configuration: {
        prompts: [
          {
            id: 'pluginName',
            type: 'input',
            message: '插件名称',
            default: 'My Story Generator',
            required: true,
          },
          {
            id: 'description',
            type: 'input',
            message: '插件描述',
            default: 'A custom story generator plugin',
            required: true,
          },
          {
            id: 'author',
            type: 'input',
            message: '作者名称',
            required: true,
          },
          {
            id: 'genres',
            type: 'multiselect',
            message: '支持的故事类型',
            choices: ['fantasy', 'sci-fi', 'mystery', 'romance', 'horror', 'adventure'],
            default: ['fantasy'],
          },
        ],
        variables: {
          currentYear: new Date().getFullYear(),
        },
        validation: [
          {
            field: 'pluginName',
            rule: 'required',
            message: '插件名称不能为空',
          },
          {
            field: 'author',
            rule: 'required',
            message: '作者名称不能为空',
          },
        ],
      },
    })

    // 角色创建器模板
    this.templates.set('character-creator-advanced', {
      id: 'character-creator-advanced',
      name: '高级角色创建器',
      description: '创建功能完整的角色生成插件，支持复杂性格特征和背景故事',
      type: 'character-creator',
      category: '角色设计',
      complexity: 'intermediate',
      features: [
        '复杂性格特征',
        '详细背景故事',
        '关系网络映射',
        '视觉描述生成',
        '语音特征定义',
        '自定义属性系统',
      ],
      files: [
        {
          path: 'src/index.ts',
          content: this.getCharacterCreatorTemplate(),
        },
        {
          path: 'src/character-engine.ts',
          content: this.getCharacterEngineTemplate(),
        },
        {
          path: 'src/ui/components/CharacterForm.vue',
          content: this.getCharacterFormTemplate(),
        },
        {
          path: 'src/ui/components/CharacterPreview.vue',
          content: this.getCharacterPreviewTemplate(),
        },
        {
          path: 'package.json',
          content: this.getPackageTemplate('character-creator-advanced'),
        },
        {
          path: 'vcptoolbox.json',
          content: this.getManifestTemplate(
            'character-creator-advanced',
            '高级角色创建器',
            'character-creator'
          ),
        },
      ],
      dependencies: ['@vcptoolbox/core', '@vcptoolbox/ui', 'vue'],
      configuration: {
        prompts: [
          {
            id: 'pluginName',
            type: 'input',
            message: '插件名称',
            default: 'Advanced Character Creator',
            required: true,
          },
          {
            id: 'includeVisual',
            type: 'confirm',
            message: '是否包含视觉描述功能',
            default: true,
          },
          {
            id: 'includeVoice',
            type: 'confirm',
            message: '是否包含语音特征功能',
            default: false,
          },
          {
            id: 'customTraits',
            type: 'input',
            message: '自定义性格特征 (用逗号分隔)',
            default: '勇敢,智慧,善良',
          },
        ],
        variables: {},
        validation: [],
      },
    })

    // 世界构建器模板
    this.templates.set('world-builder-comprehensive', {
      id: 'world-builder-comprehensive',
      name: '综合世界构建器',
      description: '创建完整的游戏世界构建插件，支持地理、文化、魔法系统等',
      type: 'world-builder',
      category: '世界设计',
      complexity: 'advanced',
      features: [
        '地理环境生成',
        '文化体系构建',
        '魔法/科技系统',
        '历史事件线',
        '规则系统定义',
        '可视化编辑器',
        '导出多种格式',
      ],
      files: [
        {
          path: 'src/index.ts',
          content: this.getWorldBuilderTemplate(),
        },
        {
          path: 'src/world-engine.ts',
          content: this.getWorldEngineTemplate(),
        },
        {
          path: 'src/generators/geography.ts',
          content: this.getGeographyGeneratorTemplate(),
        },
        {
          path: 'src/generators/culture.ts',
          content: this.getCultureGeneratorTemplate(),
        },
        {
          path: 'src/ui/WorldEditor.vue',
          content: this.getWorldEditorTemplate(),
        },
        {
          path: 'src/exporters/index.ts',
          content: this.getExporterTemplate(),
        },
        {
          path: 'package.json',
          content: this.getPackageTemplate('world-builder-comprehensive'),
        },
        {
          path: 'vcptoolbox.json',
          content: this.getManifestTemplate(
            'world-builder-comprehensive',
            '综合世界构建器',
            'world-builder'
          ),
        },
      ],
      dependencies: ['@vcptoolbox/core', '@vcptoolbox/ui', 'vue', 'd3'],
      configuration: {
        prompts: [
          {
            id: 'pluginName',
            type: 'input',
            message: '插件名称',
            default: 'Comprehensive World Builder',
            required: true,
          },
          {
            id: 'worldTypes',
            type: 'multiselect',
            message: '支持的世界类型',
            choices: ['fantasy', 'sci-fi', 'historical', 'modern', 'post-apocalyptic'],
            default: ['fantasy', 'sci-fi'],
          },
          {
            id: 'maxContinents',
            type: 'input',
            message: '最大大陆数量',
            default: '5',
            validate: (value) => parseInt(value) > 0 && parseInt(value) <= 10,
          },
        ],
        variables: {},
        validation: [],
      },
    })

    // UI主题模板
    this.templates.set('ui-theme-custom', {
      id: 'ui-theme-custom',
      name: '自定义UI主题',
      description: '创建自定义UI主题插件，支持颜色、字体、布局定制',
      type: 'ui-theme',
      category: '界面定制',
      complexity: 'beginner',
      features: ['自定义颜色方案', '字体选择', '布局调整', '动画效果', '主题切换'],
      files: [
        {
          path: 'src/index.ts',
          content: this.getUIThemeTemplate(),
        },
        {
          path: 'src/themes/default.ts',
          content: this.getDefaultThemeTemplate(),
        },
        {
          path: 'src/themes/dark.ts',
          content: this.getDarkThemeTemplate(),
        },
        {
          path: 'assets/styles/theme.css',
          content: this.getThemeCSSTemplate(),
        },
        {
          path: 'package.json',
          content: this.getPackageTemplate('ui-theme-custom'),
        },
        {
          path: 'vcptoolbox.json',
          content: this.getManifestTemplate('ui-theme-custom', '自定义UI主题', 'ui-theme'),
        },
      ],
      dependencies: ['@vcptoolbox/core', '@vcptoolbox/ui'],
      configuration: {
        prompts: [
          {
            id: 'themeName',
            type: 'input',
            message: '主题名称',
            default: 'My Custom Theme',
            required: true,
          },
          {
            id: 'primaryColor',
            type: 'input',
            message: '主色调 (HEX)',
            default: '#667eea',
          },
          {
            id: 'includeDarkMode',
            type: 'confirm',
            message: '是否包含暗色模式',
            default: true,
          },
        ],
        variables: {},
        validation: [],
      },
    })
  }

  // 获取所有可用模板
  getTemplates(): PluginTemplate[] {
    return Array.from(this.templates.values())
  }

  // 根据类型获取模板
  getTemplatesByType(type: PluginType): PluginTemplate[] {
    return Array.from(this.templates.values()).filter((template) => template.type === type)
  }

  // 获取单个模板
  getTemplate(templateId: string): PluginTemplate | null {
    return this.templates.get(templateId) || null
  }

  // 生成插件项目
  async generatePlugin(
    templateId: string,
    targetPath: string,
    config: Record<string, any>
  ): Promise<void> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // 验证配置
    this.validateConfig(template, config)

    // 合并配置和变量
    const finalConfig = {
      ...template.configuration.variables,
      ...config,
      timestamp: new Date().toISOString(),
      templateId,
    }

    // 确保目标目录存在
    await fs.promises.mkdir(targetPath, { recursive: true })

    // 生成文件
    for (const file of template.files) {
      const filePath = path.join(targetPath, file.path)
      const fileDir = path.dirname(filePath)

      // 确保文件目录存在
      await fs.promises.mkdir(fileDir, { recursive: true })

      // 处理模板变量
      const content = this.processTemplate(file.content, finalConfig)

      // 写入文件
      await fs.promises.writeFile(filePath, content, 'utf-8')

      // 设置执行权限（如果需要）
      if (file.executable) {
        await fs.promises.chmod(filePath, 0o755)
      }
    }

    // 生成额外的配置文件
    await this.generateAdditionalFiles(targetPath, template, finalConfig)
  }

  // 验证配置
  private validateConfig(template: PluginTemplate, config: Record<string, any>): void {
    for (const validation of template.configuration.validation) {
      const value = config[validation.field]

      switch (validation.rule) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            throw new Error(validation.message)
          }
          break
      }
    }
  }

  // 处理模板变量
  private processTemplate(content: string, config: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return config[key] !== undefined ? String(config[key]) : match
    })
  }

  // 生成额外文件
  private async generateAdditionalFiles(
    targetPath: string,
    template: PluginTemplate,
    config: Record<string, any>
  ): Promise<void> {
    // 生成 .gitignore
    const gitignore = `node_modules/
dist/
*.log
.env
.DS_Store
.vscode/
.idea/
`
    await fs.promises.writeFile(path.join(targetPath, '.gitignore'), gitignore)

    // 生成 tsconfig.json（如果需要）
    if (template.files.some((f) => f.path.endsWith('.ts'))) {
      const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
      await fs.promises.writeFile(path.join(targetPath, 'tsconfig.json'), tsconfig)
    }
  }

  // 创建自定义模板
  createTemplate(template: PluginTemplate): void {
    this.templates.set(template.id, template)
  }

  // 删除模板
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  // 获取模板预览
  getTemplatePreview(templateId: string): { files: string[]; features: string[] } | null {
    const template = this.templates.get(templateId)
    if (!template) return null

    return {
      files: template.files.map((f) => f.path),
      features: template.features,
    }
  }

  // 模板文件内容生成方法
  private getStoryGeneratorTemplate(): string {
    return `import { VCPPlugin, PluginContext } from '@vcptoolbox/core'

export class {{pluginName}}Plugin implements VCPPlugin {
  id = '{{pluginName | camelCase}}'
  name = '{{pluginName}}'
  version = '1.0.0'
  description = '{{description}}'
  type = 'story-generator' as const

  compatibility = {
    minVersion: '1.0.0',
    platforms: ['web', 'desktop']
  }

  capabilities = {
    storyGeneration: {
      supportedGenres: {{{genres | json}}},
      supportedLengths: ['short', 'medium', 'long'],
      customPrompts: true,
      branchingNarratives: false,
      multipleEndings: false,
      characterConsistency: true
    }
  }

  lifecycle = {
    onInitialize: async (context: PluginContext) => {
      console.log('{{pluginName}} plugin initialized')

      // 注册UI组件
      context.ui.addMenuItem('tools', {
        id: 'story-generator',
        label: '故事生成器',
        icon: '📖',
        action: () => this.showStoryGenerator(context)
      })
    },

    onActivate: async (context: PluginContext) => {
      console.log('{{pluginName}} plugin activated')
    }
  }

  metadata = {
    createdAt: new Date(),
    updatedAt: new Date(),
    downloads: 0,
    rating: 0,
    tags: ['story', 'generator', 'ai'],
    license: 'MIT'
  }

  private showStoryGenerator(context: PluginContext) {
    context.ui.showModal({
      title: '故事生成器',
      content: {
        component: 'StoryGeneratorForm',
        props: { plugin: this }
      },
      buttons: [
        {
          label: '生成故事',
          action: () => this.generateStory(context),
          primary: true
        },
        {
          label: '取消',
          action: () => {}
        }
      ]
    })
  }

  private async generateStory(context: PluginContext) {
    try {
      const prompt = context.config.get('currentPrompt', '讲述一个奇幻冒险故事')
      const story = await context.api.ai.generateStory(prompt)

      context.ui.showNotification({
        type: 'success',
        title: '故事生成完成',
        message: '您的故事已经生成完毕'
      })

      // 这里可以添加保存故事的逻辑
      console.log('Generated story:', story)
    } catch (error) {
      context.ui.showNotification({
        type: 'error',
        title: '生成失败',
        message: '故事生成过程中出现错误，请重试'
      })
    }
  }
}

export default new {{pluginName}}Plugin()`
  }

  private getCharacterCreatorTemplate(): string {
    return `import { VCPPlugin, PluginContext } from '@vcptoolbox/core'
import { CharacterEngine } from './character-engine'

export class {{pluginName}}Plugin implements VCPPlugin {
  id = '{{pluginName | camelCase}}'
  name = '{{pluginName}}'
  version = '1.0.0'
  description = '高级角色创建器插件'
  type = 'character-creator' as const

  private characterEngine: CharacterEngine

  constructor() {
    this.characterEngine = new CharacterEngine()
  }

  compatibility = {
    minVersion: '1.0.0',
    platforms: ['web', 'desktop']
  }

  capabilities = {
    characterCreation: {
      personalityTraits: true,
      backgroundStories: true,
      relationshipMapping: true,
      visualDescriptions: {{includeVisual}},
      voiceProfiles: {{includeVoice}},
      customAttributes: {{{customTraits | split | json}}}
    }
  }

  lifecycle = {
    onInitialize: async (context: PluginContext) => {
      context.ui.registerComponent('CharacterForm', await import('./ui/components/CharacterForm.vue'))
      context.ui.registerComponent('CharacterPreview', await import('./ui/components/CharacterPreview.vue'))

      context.ui.addMenuItem('tools', {
        id: 'character-creator',
        label: '角色创建器',
        icon: '👤',
        action: () => this.showCharacterCreator(context)
      })
    }
  }

  metadata = {
    createdAt: new Date(),
    updatedAt: new Date(),
    downloads: 0,
    rating: 0,
    tags: ['character', 'creator', 'ai'],
    license: 'MIT'
  }

  private showCharacterCreator(context: PluginContext) {
    context.ui.showModal({
      title: '角色创建器',
      content: {
        component: 'CharacterForm',
        props: { plugin: this }
      },
      size: 'large'
    })
  }

  async createCharacter(traits: any, context: PluginContext) {
    return await this.characterEngine.createCharacter(traits, context)
  }
}

export default new {{pluginName}}Plugin()`
  }

  private getWorldBuilderTemplate(): string {
    return `import { VCPPlugin, PluginContext } from '@vcptoolbox/core'
import { WorldEngine } from './world-engine'

export class {{pluginName}}Plugin implements VCPPlugin {
  id = '{{pluginName | camelCase}}'
  name = '{{pluginName}}'
  version = '1.0.0'
  description = '综合世界构建器插件'
  type = 'world-builder' as const

  private worldEngine: WorldEngine

  constructor() {
    this.worldEngine = new WorldEngine()
  }

  compatibility = {
    minVersion: '1.0.0',
    platforms: ['web', 'desktop']
  }

  capabilities = {
    worldBuilding: {
      geography: true,
      cultures: true,
      magicSystems: true,
      technology: true,
      history: true,
      rules: true,
      customElements: ['custom-races', 'custom-magic', 'custom-tech']
    }
  }

  lifecycle = {
    onInitialize: async (context: PluginContext) => {
      context.ui.registerComponent('WorldEditor', await import('./ui/WorldEditor.vue'))

      context.ui.addMenuItem('tools', {
        id: 'world-builder',
        label: '世界构建器',
        icon: '🌍',
        action: () => this.showWorldBuilder(context)
      })
    }
  }

  metadata = {
    createdAt: new Date(),
    updatedAt: new Date(),
    downloads: 0,
    rating: 0,
    tags: ['world', 'builder', 'creation'],
    license: 'MIT'
  }

  private showWorldBuilder(context: PluginContext) {
    context.ui.showModal({
      title: '世界构建器',
      content: {
        component: 'WorldEditor',
        props: { plugin: this }
      },
      size: 'large'
    })
  }

  async createWorld(theme: string, options: any, context: PluginContext) {
    return await this.worldEngine.createWorld(theme, options, context)
  }
}

export default new {{pluginName}}Plugin()`
  }

  private getUIThemeTemplate(): string {
    return `import { VCPPlugin, PluginContext } from '@vcptoolbox/core'
import { defaultTheme } from './themes/default'
import { darkTheme } from './themes/dark'

export class {{themeName}}Plugin implements VCPPlugin {
  id = '{{themeName | camelCase}}'
  name = '{{themeName}}'
  version = '1.0.0'
  description = '自定义UI主题插件'
  type = 'ui-theme' as const

  compatibility = {
    minVersion: '1.0.0',
    platforms: ['web']
  }

  capabilities = {
    uiCustomization: {
      themes: true,
      layouts: false,
      fonts: true,
      colors: true,
      animations: true,
      customComponents: ['theme-switcher']
    }
  }

  lifecycle = {
    onInitialize: async (context: PluginContext) => {
      // 注册主题
      this.registerThemes(context)

      // 添加主题切换器
      context.ui.addToolbarButton({
        id: 'theme-switcher',
        icon: '🎨',
        label: '切换主题',
        action: () => this.showThemeSwitcher(context)
      })
    }
  }

  metadata = {
    createdAt: new Date(),
    updatedAt: new Date(),
    downloads: 0,
    rating: 0,
    tags: ['theme', 'ui', 'customization'],
    license: 'MIT'
  }

  private registerThemes(context: PluginContext) {
    // 注册默认主题
    context.config.set('themes.default', defaultTheme)

    {{#includeDarkMode}}
    // 注册暗色主题
    context.config.set('themes.dark', darkTheme)
    {{/includeDarkMode}}
  }

  private showThemeSwitcher(context: PluginContext) {
    const themes = context.config.get('themes', {})
    const currentTheme = context.config.get('currentTheme', 'default')

    context.ui.showModal({
      title: '选择主题',
      content: {
        component: 'ThemeSwitcher',
        props: {
          themes: Object.keys(themes),
          currentTheme,
          onSelect: (themeName: string) => this.applyTheme(themeName, context)
        }
      }
    })
  }

  private applyTheme(themeName: string, context: PluginContext) {
    const themes = context.config.get('themes', {})
    const theme = themes[themeName]

    if (theme) {
      context.config.set('currentTheme', themeName)
      // 应用主题样式
      this.applyThemeStyles(theme, context)
    }
  }

  private applyThemeStyles(theme: any, context: PluginContext) {
    // 应用主题到全局样式
    const styleElement = document.getElementById('vcp-theme-styles') ||
                        document.createElement('style')
    styleElement.id = 'vcp-theme-styles'
    styleElement.textContent = this.generateThemeCSS(theme)
    document.head.appendChild(styleElement)
  }

  private generateThemeCSS(theme: any): string {
    return \`
      :root {
        --primary-color: \${theme.colors.primary};
        --secondary-color: \${theme.colors.secondary};
        --background-color: \${theme.colors.background};
        --text-color: \${theme.colors.text};
        --font-family: \${theme.fonts.primary};
      }
    \`
  }
}

export default new {{themeName}}Plugin()`
  }

  // 其他模板方法
  private getStoryTypesTemplate(): string {
    return `export interface Story {
  id: string
  title: string
  content: string
  genre: string
  length: 'short' | 'medium' | 'long'
  characters: Character[]
  createdAt: Date
}

export interface Character {
  id: string
  name: string
  traits: string[]
  background: string
}

export interface StoryPrompt {
  genre: string
  theme: string
  characters: number
  length: string
  customInstructions?: string
}`
  }

  private getConfigTemplate(): string {
    return `export interface PluginConfig {
  apiKey?: string
  defaultGenre: string
  maxLength: number
  enableAI: boolean
}

export const defaultConfig: PluginConfig = {
  defaultGenre: 'fantasy',
  maxLength: 5000,
  enableAI: true
}`
  }

  private getPackageTemplate(pluginName: string): string {
    return `{
  "name": "{{pluginName | kebabCase}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "package": "vcptoolbox package"
  },
  "keywords": ["vcptoolbox", "plugin", "ai", "storytelling"],
  "author": "{{author}}",
  "license": "MIT",
  "peerDependencies": {
    "@vcptoolbox/core": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "@vcptoolbox/core": "^1.0.0",
    "typescript": "^4.9.0"
  }
}`
  }

  private getManifestTemplate(id: string, name: string, type: string): string {
    return `{
  "id": "${id}",
  "name": "${name}",
  "version": "1.0.0",
  "type": "${type}",
  "description": "Generated by VCPToolBox",
  "compatibility": {
    "minVersion": "1.0.0",
    "platforms": ["web", "desktop"]
  },
  "author": {
    "name": "{{author}}"
  },
  "metadata": {
    "tags": ["vcptoolbox", "generated"],
    "license": "MIT"
  }
}`
  }

  private getReadmeTemplate(title: string): string {
    return `# ${title}

${title} 是一个基于 VCPToolBox 开发的创世星环插件。

## 功能特性

- 核心功能描述
- 主要特性列表

## 安装使用

1. 安装插件
2. 配置设置
3. 开始使用

## 开发

\`\`\`bash
npm install
npm run build
npm run dev
\`\`\`

## 许可证

MIT License

## 作者

{{author}}`
  }

  // 其他模板方法（简化版）
  private getCharacterEngineTemplate(): string {
    return '// Character engine implementation'
  }
  private getCharacterFormTemplate(): string {
    return '<template><div>Character Form</div></template>'
  }
  private getCharacterPreviewTemplate(): string {
    return '<template><div>Character Preview</div></template>'
  }
  private getWorldEngineTemplate(): string {
    return '// World engine implementation'
  }
  private getGeographyGeneratorTemplate(): string {
    return '// Geography generator'
  }
  private getCultureGeneratorTemplate(): string {
    return '// Culture generator'
  }
  private getWorldEditorTemplate(): string {
    return '<template><div>World Editor</div></template>'
  }
  private getExporterTemplate(): string {
    return '// Exporter implementation'
  }
  private getDefaultThemeTemplate(): string {
    return 'export const defaultTheme = {}'
  }
  private getDarkThemeTemplate(): string {
    return 'export const darkTheme = {}'
  }
  private getThemeCSSTemplate(): string {
    return '/* Theme styles */'
  }
}

// 创建单例实例
export const pluginGenerator = new PluginGenerator()
