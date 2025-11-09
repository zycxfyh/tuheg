#!/usr/bin/env node

const { program } = require('commander')
const { generateApiDocs, generateHtmlDocs } = require('../src/index.js')

program
  .name('generate-api-docs')
  .description('Generate OpenAPI 3.0 documentation for VCPToolBox APIs')
  .version('1.0.0')

program
  .command('json <source>')
  .description('Generate OpenAPI JSON specification')
  .option('-o, --output <output>', 'output file path', 'openapi.json')
  .option('-t, --title <title>', 'API title', 'VCPToolBox API')
  .option('-d, --description <description>', 'API description', 'VCPToolBox API Documentation')
  .option('-v, --version <version>', 'API version', '1.0.0')
  .option('-s, --server <server>', 'API server URL', 'http://localhost:3000')
  .action(async (source, options) => {
    try {
      await generateApiDocs(source, options)
      console.log(`✅ API documentation generated: ${options.output}`)
    } catch (error) {
      console.error('❌ Error generating API docs:', error.message)
      process.exit(1)
    }
  })

program
  .command('html <source>')
  .description('Generate interactive HTML documentation')
  .option('-o, --output <output>', 'output file path', 'api-docs.html')
  .option('-t, --title <title>', 'API title', 'VCPToolBox API')
  .option('-d, --description <description>', 'API description', 'VCPToolBox API Documentation')
  .option('-v, --version <version>', 'API version', '1.0.0')
  .option('-s, --server <server>', 'API server URL', 'http://localhost:3000')
  .action(async (source, options) => {
    try {
      // First generate JSON spec
      const jsonOptions = { ...options, output: 'temp-openapi.json' }
      const openApiSpec = await generateApiDocs(source, jsonOptions)

      // Then generate HTML
      await generateHtmlDocs(openApiSpec, options.output)

      // Clean up temp file
      const fs = require('node:fs')
      if (fs.existsSync('temp-openapi.json')) {
        fs.unlinkSync('temp-openapi.json')
      }

      console.log(`✅ HTML API documentation generated: ${options.output}`)
    } catch (error) {
      console.error('❌ Error generating HTML docs:', error.message)
      process.exit(1)
    }
  })

program
  .command('all <source>')
  .description('Generate both JSON and HTML documentation')
  .option('-j, --json-output <jsonOutput>', 'JSON output file path', 'openapi.json')
  .option('-h, --html-output <htmlOutput>', 'HTML output file path', 'api-docs.html')
  .option('-t, --title <title>', 'API title', 'VCPToolBox API')
  .option('-d, --description <description>', 'API description', 'VCPToolBox API Documentation')
  .option('-v, --version <version>', 'API version', '1.0.0')
  .option('-s, --server <server>', 'API server URL', 'http://localhost:3000')
  .action(async (source, options) => {
    try {
      // Generate JSON
      const jsonOptions = {
        output: options.jsonOutput,
        title: options.title,
        description: options.description,
        version: options.version,
        server: options.server,
      }
      const openApiSpec = await generateApiDocs(source, jsonOptions)
      console.log(`✅ JSON API documentation generated: ${options.jsonOutput}`)

      // Generate HTML
      await generateHtmlDocs(openApiSpec, options.htmlOutput)
      console.log(`✅ HTML API documentation generated: ${options.htmlOutput}`)
    } catch (error) {
      console.error('❌ Error generating docs:', error.message)
      process.exit(1)
    }
  })

program.parse()
