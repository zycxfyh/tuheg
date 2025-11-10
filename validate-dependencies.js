#!/usr/bin/env node

/**
 * 依赖关系验证脚本
 * Dependency Validation Script
 */

const fs = require('fs')
const path = require('path')

// 定义架构层级
const ARCHITECTURE_LAYERS = {
  // 基础层 - 可以被任何人依赖
  foundation: ['shared-types', 'abstractions'],

  // 基础设施层 - 可以依赖基础层
  infrastructure: ['infrastructure', 'config-management', 'ai-providers'],

  // 预编译层 - 可以依赖基础层和基础设施层
  precompiled: ['database', 'event-bus'],

  // 领域层 - 可以依赖基础层、基础设施层、预编译层
  domain: ['ai-domain', 'narrative-domain', 'enterprise-domain', 'game-core'],

  // 应用层 - 可以依赖所有层
  application: ['backend-gateway', 'creation-agent', 'logic-agent', 'narrative-agent', 'frontend']
}

// 包名映射
const PACKAGE_NAME_MAP = {
  '@tuheg/shared-types': 'shared-types',
  '@tuheg/abstractions': 'abstractions',
  '@tuheg/infrastructure': 'infrastructure',
  '@tuheg/config-management': 'config-management',
  '@tuheg/ai-providers': 'ai-providers',
  '@tuheg/database': 'database',
  '@tuheg/event-bus': 'event-bus',
  '@tuheg/ai-domain': 'ai-domain',
  '@tuheg/narrative-domain': 'narrative-domain',
  '@tuheg/enterprise-domain': 'enterprise-domain',
  '@tuheg/game-core': 'game-core'
}

// 获取包的层级
function getPackageLayer(packageName) {
  for (const [layer, packages] of Object.entries(ARCHITECTURE_LAYERS)) {
    if (packages.includes(packageName)) {
      return layer
    }
  }
  return null
}

// 检查依赖是否符合架构规则
function isValidDependency(fromLayer, toLayer) {
  const layerOrder = ['foundation', 'infrastructure', 'precompiled', 'domain', 'application']

  const fromIndex = layerOrder.indexOf(fromLayer)
  const toIndex = layerOrder.indexOf(toLayer)

  // 同层或高层可以依赖低层，但不能反向依赖
  return fromIndex >= toIndex
}

// 验证单个包的依赖
function validatePackageDependencies(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    console.warn(`⚠️  找不到 package.json: ${packageJsonPath}`)
    return []
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const packageName = packageJson.name.replace('@tuheg/', '')
  const fromLayer = getPackageLayer(packageName)

  if (!fromLayer) {
    console.warn(`⚠️  未知的包层级: ${packageName}`)
    return []
  }

  const errors = []
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

  for (const [depName, version] of Object.entries(dependencies)) {
    if (!depName.startsWith('@tuheg/')) continue

    const depPackageName = PACKAGE_NAME_MAP[depName]
    if (!depPackageName) continue

    const toLayer = getPackageLayer(depPackageName)

    if (!isValidDependency(fromLayer, toLayer)) {
      errors.push({
        from: packageName,
        to: depPackageName,
        fromLayer,
        toLayer,
        message: `${fromLayer} 层的包不能依赖 ${toLayer} 层的包`
      })
    }
  }

  return errors
}

// 主验证函数
function validateAllDependencies() {
  console.log('🔍 开始验证依赖关系...\n')

  const allErrors = []
  const packagesDir = path.join(__dirname, 'packages')
  const appsDir = path.join(__dirname, 'apps')

  // 验证 packages
  if (fs.existsSync(packagesDir)) {
    const packageDirs = fs.readdirSync(packagesDir)
      .filter(dir => fs.statSync(path.join(packagesDir, dir)).isDirectory())

    for (const packageDir of packageDirs) {
      const packagePath = path.join(packagesDir, packageDir)
      const errors = validatePackageDependencies(packagePath)
      allErrors.push(...errors)
    }
  }

  // 验证 apps
  if (fs.existsSync(appsDir)) {
    const appDirs = fs.readdirSync(appsDir)
      .filter(dir => fs.statSync(path.join(appsDir, dir)).isDirectory())

    for (const appDir of appDirs) {
      const appPath = path.join(appsDir, appDir)
      const errors = validatePackageDependencies(appPath)
      allErrors.push(...errors)
    }
  }

  // 输出结果
  if (allErrors.length === 0) {
    console.log('✅ 所有依赖关系验证通过！')
    return true
  } else {
    console.log('❌ 发现依赖关系违规:')
    allErrors.forEach(error => {
      console.log(`  - ${error.from} (${error.fromLayer}) -> ${error.to} (${error.toLayer}): ${error.message}`)
    })
    return false
  }
}

// 运行验证
if (require.main === module) {
  const isValid = validateAllDependencies()
  process.exit(isValid ? 0 : 1)
}

module.exports = { validateAllDependencies }