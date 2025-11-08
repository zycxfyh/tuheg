// VCPToolBox SDK - 构建插件命令

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

export interface BuildOptions {
  outDir: string
  minify: boolean
  sourcemap: boolean
  watch: boolean
}

export class BuildCommand {
  async execute(options: BuildOptions): Promise<void> {
    console.log('🔨 构建VCPToolBox插件...')

    try {
      const packageJson = this.loadPackageJson()

      if (!packageJson.vcptoolbox) {
        throw new Error('这不是一个有效的VCPToolBox插件项目')
      }

      // 确保输出目录存在
      const outDir = path.resolve(options.outDir)
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
      }

      // 构建TypeScript
      await this.buildTypeScript(options)

      // 复制必要文件
      await this.copyAssets(outDir)

      // 生成插件清单
      await this.generateManifest(outDir, packageJson)

      console.log(`✅ 构建完成！输出目录: ${outDir}`)

    } catch (error: any) {
      console.error(`❌ 构建失败: ${error.message}`)
      process.exit(1)
    }
  }

  private loadPackageJson(): any {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('找不到package.json文件')
    }

    const content = fs.readFileSync(packageJsonPath, 'utf-8')
    return JSON.parse(content)
  }

  private async buildTypeScript(options: BuildOptions): Promise<void> {
    console.log('📝 编译TypeScript...')

    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error('找不到tsconfig.json文件')
    }

    try {
      const command = options.watch
        ? 'tsc --watch'
        : 'tsc'

      if (!options.watch) {
        execSync(command, { stdio: 'inherit', cwd: process.cwd() })
      } else {
        console.log('👀 启动监听模式...')
        // 在监听模式下，我们不阻塞进程
        const child = execSync(command, { stdio: 'inherit', cwd: process.cwd() })
      }
    } catch (error) {
      throw new Error('TypeScript编译失败')
    }
  }

  private async copyAssets(outDir: string): Promise<void> {
    console.log('📋 复制资源文件...')

    const assetsToCopy = [
      'README.md',
      'LICENSE',
      'CHANGELOG.md'
    ]

    for (const asset of assetsToCopy) {
      const srcPath = path.join(process.cwd(), asset)
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(outDir, asset)
        fs.copyFileSync(srcPath, destPath)
      }
    }

    // 复制静态资源目录
    const assetsDir = path.join(process.cwd(), 'assets')
    if (fs.existsSync(assetsDir)) {
      this.copyDirectory(assetsDir, path.join(outDir, 'assets'))
    }
  }

  private async generateManifest(outDir: string, packageJson: any): Promise<void> {
    console.log('📄 生成插件清单...')

    const manifestPath = path.join(process.cwd(), 'src', 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      console.warn('⚠️  找不到插件清单文件，将使用package.json中的信息')
      return
    }

    const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestContent)

    // 合并package.json信息
    const finalManifest = {
      ...manifest,
      version: packageJson.version,
      name: packageJson.name,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license,
      repository: packageJson.repository,
      keywords: packageJson.keywords,
      buildInfo: {
        buildTime: new Date().toISOString(),
        builder: 'VCPToolBox SDK v1.0.0'
      }
    }

    const outputPath = path.join(outDir, 'manifest.json')
    fs.writeFileSync(outputPath, JSON.stringify(finalManifest, null, 2), 'utf-8')
  }

  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
}
