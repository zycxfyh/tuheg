import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import * as fs from 'fs-extra'
import Handlebars from 'handlebars'
import inquirer from 'inquirer'
import ora from 'ora'
import validatePackageName from 'validate-npm-package-name'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface PluginOptions {
  type: string
  description?: string
  author?: string
}

export async function createPlugin(name: string, options: PluginOptions) {
  console.log(chalk.blue.bold('\n🚀 Creating VCPToolBox Plugin\n'))

  // 验证插件名称
  const validation = validatePackageName(name)
  if (!validation.validForNewPackages) {
    console.error(chalk.red('❌ Invalid plugin name:'), name)
    if (validation.errors) {
      validation.errors.forEach((error) => {
        console.error(chalk.red(`  - ${error}`))
      })
    }
    process.exit(1)
  }

  // 如果没有提供详细信息，则询问用户
  let answers = options
  if (!options.description || !options.author) {
    const questions = []

    if (!options.description) {
      questions.push({
        type: 'input',
        name: 'description',
        message: 'Plugin description:',
        default: `A VCPToolBox ${options.type} plugin`,
      })
    }

    if (!options.author) {
      questions.push({
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: 'Your Name',
      })
    }

    const userAnswers = await inquirer.prompt(questions)
    answers = { ...options, ...userAnswers }
  }

  const spinner = ora('Creating plugin structure...').start()

  try {
    // 创建插件目录
    const pluginDir = path.join(process.cwd(), name)
    await fs.ensureDir(pluginDir)

    // 复制模板文件
    const templateDir = path.join(__dirname, '../templates', options.type)
    await copyTemplate(templateDir, pluginDir, {
      name,
      description: answers.description,
      author: answers.author,
      type: options.type,
      className: toPascalCase(name),
      kebabName: toKebabCase(name),
    })

    spinner.succeed('Plugin structure created successfully!')

    console.log(chalk.green('\n✅ Plugin created successfully!'))
    console.log(chalk.blue('\nNext steps:'))
    console.log(`  cd ${name}`)
    console.log('  npm install')
    console.log('  npm run build')
    console.log('  npm test')
    console.log(chalk.yellow('\n📖 For more information, visit: https://tuheg.dev/docs/plugins'))
  } catch (error) {
    spinner.fail('Failed to create plugin')
    throw error
  }
}

async function copyTemplate(templateDir: string, targetDir: string, context: any) {
  const files = await fs.readdir(templateDir)

  for (const file of files) {
    const srcPath = path.join(templateDir, file)
    const stat = await fs.stat(srcPath)

    if (stat.isDirectory()) {
      const targetSubDir = path.join(targetDir, file)
      await fs.ensureDir(targetSubDir)
      await copyTemplate(srcPath, targetSubDir, context)
    } else {
      const content = await fs.readFile(srcPath, 'utf-8')
      const compiled = Handlebars.compile(content)
      const result = compiled(context)

      const targetPath = path.join(targetDir, file.replace(/\.hbs$/, ''))
      await fs.writeFile(targetPath, result, 'utf-8')
    }
  }
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}
