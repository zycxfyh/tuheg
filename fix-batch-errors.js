const fs = require('node:fs')
const _path = require('node:path')

// 找到所有包含重复错误检查的文件
const files = [
  'apps/backend-gateway/src/plugin-sandbox/plugin-sandbox.controller.ts',
  'apps/logic-agent/src/logic.service.ts',
  'apps/logic-agent/src/rule-engine.service.ts',
  'apps/vcptoolbox/src/PluginFramework.ts',
  'apps/vcptoolbox/src/publisher/Publisher.ts',
]

files.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8')

    // 添加 getErrorMessage 导入（如果还没有的话）
    if (!content.includes('getErrorMessage')) {
      const importMatch = content.match(/import.*from ['"]@tuheg\/common-backend['"]/)
      if (importMatch) {
        const importLine = importMatch[0]
        const newImport = importLine.replace('}', ', getErrorMessage }')
        content = content.replace(importLine, newImport)
      } else {
        // 如果没有找到现有导入，添加新的
        const firstImportMatch = content.match(/import.*from/)
        if (firstImportMatch) {
          const insertPos = content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length
          content =
            content.slice(0, insertPos) +
            "\nimport { getErrorMessage } from '@tuheg/common-backend';\n" +
            content.slice(insertPos)
        }
      }
    }

    // 替换重复的错误检查
    content = content.replace(
      /error instanceof Error \? error instanceof Error \? error instanceof Error \? error\.message : String\(error\) : String\(error\) : String\(error\)/g,
      'getErrorMessage(error)'
    )

    fs.writeFileSync(filePath, content)
    console.log('Fixed:', filePath)
  } else {
    console.log('File not found:', filePath)
  }
})

console.log('Batch fix completed')
