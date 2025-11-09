const fs = require('node:fs')

function deduplicateRepomixFile(inputPath, outputPath) {
  const content = fs.readFileSync(inputPath, 'utf8')
  const lines = content.split('\n')

  const outputLines = []
  const seenFiles = new Set()
  let skipCurrentFile = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle file entries
    if (line.startsWith('<file path="')) {
      const match = line.match(/<file path="([^"]+)">/)
      if (match) {
        const filePath = match[1]

        // If we've seen this file before, skip it
        if (seenFiles.has(filePath)) {
          skipCurrentFile = true
          // Skip until we find the closing </file> tag
          while (i < lines.length && lines[i] !== '</file>') {
            i++
          }
        } else {
          // First time seeing this file, keep it
          seenFiles.add(filePath)
          skipCurrentFile = false
          outputLines.push(line)
        }
      }
    } else if (line === '</file>') {
      if (!skipCurrentFile) {
        outputLines.push(line)
      }
      skipCurrentFile = false
    } else {
      // Keep lines that are not part of skipped files
      if (!skipCurrentFile) {
        outputLines.push(line)
      }
    }
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8')
  console.log(`Deduplicated file saved to ${outputPath}`)
  console.log(`Original lines: ${lines.length}, Deduplicated lines: ${outputLines.length}`)
  console.log(`Unique files kept: ${seenFiles.size}`)
}

const inputFile = 'repomix-output.xml'
const outputFile = 'repomix-output-deduplicated.xml'

deduplicateRepomixFile(inputFile, outputFile)
