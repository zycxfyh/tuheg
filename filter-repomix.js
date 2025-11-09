const fs = require('node:fs')
const _path = require('node:path')

function shouldKeepFile(filePath) {
  // Remove test files
  if (
    filePath.includes('__tests__') ||
    filePath.includes('.spec.') ||
    filePath.includes('.test.') ||
    filePath.includes('/tests/') ||
    filePath.includes('.e2e-spec.')
  ) {
    return false
  }

  // Remove CI/CD workflows and GitHub templates
  if (
    filePath.startsWith('.github/workflows/') ||
    filePath.startsWith('.github/ISSUE_TEMPLATE/') ||
    filePath.startsWith('.github/PULL_REQUEST_TEMPLATE/')
  ) {
    return false
  }

  // Keep code files in src directories
  if (
    filePath.includes('/src/') &&
    (filePath.endsWith('.ts') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.vue') ||
      filePath.endsWith('.css') ||
      filePath.endsWith('.scss') ||
      filePath.endsWith('.html'))
  ) {
    return true
  }

  // Keep architecture documentation
  if (filePath.startsWith('docs/')) {
    if (
      filePath === 'docs/development/ARCHITECTURE.md' ||
      filePath === 'docs/System-Technical-Specification.md' ||
      filePath.startsWith('docs/api/') ||
      filePath.startsWith('docs/core/') ||
      filePath.startsWith('docs/project/')
    ) {
      return true
    }
    return false
  }

  // Keep configuration files that define architecture
  if (
    filePath.endsWith('package.json') ||
    filePath.endsWith('tsconfig.json') ||
    filePath.endsWith('tsconfig.app.json') ||
    filePath === 'docker-compose.yml' ||
    filePath.startsWith('deployment/k8s/') ||
    filePath === 'nest-cli.json' ||
    (filePath.endsWith('README.md') && !filePath.startsWith('.github/'))
  ) {
    return true
  }

  // Remove everything else
  return false
}

function filterRepomixFile(inputPath, outputPath) {
  const content = fs.readFileSync(inputPath, 'utf8')
  const lines = content.split('\n')

  const outputLines = []
  let inFileContent = false
  let currentFilePath = ''
  let skipCurrentFile = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Keep the header sections
    if (i < 982) {
      // Before directory_structure ends
      outputLines.push(line)
      continue
    }

    // Handle file entries
    if (line.startsWith('<file path="')) {
      const match = line.match(/<file path="([^"]+)">/)
      if (match) {
        currentFilePath = match[1]
        skipCurrentFile = !shouldKeepFile(currentFilePath)

        if (!skipCurrentFile) {
          outputLines.push(line)
          inFileContent = true
        } else {
          inFileContent = false
        }
      }
    } else if (line === '</file>') {
      if (!skipCurrentFile) {
        outputLines.push(line)
      }
      inFileContent = false
      currentFilePath = ''
      skipCurrentFile = false
    } else if (inFileContent && !skipCurrentFile) {
      outputLines.push(line)
    }
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8')
  console.log(`Filtered file saved to ${outputPath}`)
  console.log(`Original lines: ${lines.length}, Filtered lines: ${outputLines.length}`)
}

const inputFile = 'repomix-output.xml'
const outputFile = 'repomix-output-filtered.xml'

filterRepomixFile(inputFile, outputFile)
