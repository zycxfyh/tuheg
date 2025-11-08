#!/usr/bin/env node

const { program } = require('commander')
const { createPlugin } = require('../src/index.js')

program
  .name('create-vcp-plugin')
  .description('VCPToolBox Plugin Development Tools')
  .version('1.0.0')

program
  .command('create <name>')
  .description('Create a new VCPToolBox plugin')
  .option('-t, --type <type>', 'plugin type', 'tool')
  .option('-d, --description <description>', 'plugin description')
  .option('-a, --author <author>', 'plugin author')
  .action(async (name, options) => {
    try {
      await createPlugin(name, options)
    } catch (error) {
      console.error('Error creating plugin:', error.message)
      process.exit(1)
    }
  })

program
  .command('debug <plugin>')
  .description('Debug a VCPToolBox plugin')
  .option('-p, --port <port>', 'debug server port', parseInt)
  .option('-w, --watch', 'enable watch mode')
  .option('-s, --sandbox', 'enable sandbox testing')
  .action(async (pluginPath, options) => {
    try {
      const { debugCommand } = await import('../src/debug.js')
      await debugCommand(pluginPath, options)
    } catch (error) {
      console.error('Error debugging plugin:', error.message)
      process.exit(1)
    }
  })

program
  .command('info <plugin>')
  .description('Get plugin information')
  .action(async (pluginPath) => {
    try {
      const { PluginDebugTool } = await import('../src/debug.js')
      const debugTool = new PluginDebugTool()
      const info = await debugTool.getPluginInfo(pluginPath)

      console.log('📋 Plugin Information:')
      console.log(`   ID: ${info.manifest?.id}`)
      console.log(`   Name: ${info.manifest?.name}`)
      console.log(`   Version: ${info.manifest?.version}`)
      console.log(`   Description: ${info.manifest?.description}`)
      console.log(`   Author: ${info.manifest?.author}`)
      console.log(`   Tools: ${info.tools.length}`)
      console.log(`   Load Time: ${info.executionTime}ms`)

      if (info.tools.length > 0) {
        console.log('\n🔧 Available Tools:')
        info.tools.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name} (${tool.id})`)
          console.log(`      ${tool.description}`)
        })
      }
    } catch (error) {
      console.error('Error getting plugin info:', error.message)
      process.exit(1)
    }
  })

program
  .command('sandbox <plugin>')
  .description('Test plugin in sandbox environment')
  .option('-i, --input <input>', 'test input data')
  .option('-t, --tool <tool>', 'specific tool to test')
  .option('-c, --config <config>', 'plugin configuration file')
  .option('-o, --output <output>', 'save test results to file')
  .action(async (pluginPath, options) => {
    try {
      const { sandboxCommand } = require('../src/sandbox.js')
      await sandboxCommand(pluginPath, options)
    } catch (error) {
      console.error('Error running sandbox test:', error.message)
      process.exit(1)
    }
  })

program.parse()
