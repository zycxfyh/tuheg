const fs = require('fs-extra')
const path = require('node:path')
const { glob } = require('glob')
const chalk = require('chalk').default
const ora = require('ora').default

/**
 * Generate OpenAPI 3.0 documentation from NestJS controllers
 * 从NestJS控制器生成OpenAPI 3.0文档
 */
async function generateApiDocs(sourceDir, options = {}) {
  const spinner = ora('Generating API documentation...').start()

  try {
    // 扫描控制器文件
    const controllerFiles = await glob('**/*controller.ts', {
      cwd: sourceDir,
      absolute: true,
    })

    console.log(chalk.gray(`Found ${controllerFiles.length} controller files`))

    // 解析所有控制器
    const controllers = []
    for (const file of controllerFiles) {
      try {
        const controller = await parseController(file)
        if (controller) {
          controllers.push(controller)
        }
      } catch (error) {
        console.warn(chalk.yellow(`Warning parsing ${file}: ${error.message}`))
      }
    }

    // 生成OpenAPI规范
    const openApiSpec = generateOpenApiSpec(controllers, options)

    // 写入文件
    await fs.ensureDir(path.dirname(options.output || 'openapi.json'))
    await fs.writeFile(
      options.output || 'openapi.json',
      JSON.stringify(openApiSpec, null, 2),
      'utf-8'
    )

    spinner.succeed(`Generated API docs for ${controllers.length} controllers`)

    // 输出统计信息
    const totalEndpoints = controllers.reduce((sum, ctrl) => sum + ctrl.endpoints.length, 0)
    console.log(chalk.green(`📊 Generated ${totalEndpoints} API endpoints`))
    console.log(chalk.gray(`📄 Output: ${options.output || 'openapi.json'}`))

    // 返回OpenAPI规范以供HTML生成使用
    return openApiSpec
  } catch (error) {
    spinner.fail('Failed to generate API docs')
    throw error
  }
}

/**
 * Parse a NestJS controller file
 * 解析NestJS控制器文件
 */
async function parseController(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')

  // 提取控制器装饰器
  const controllerMatch = content.match(/@Controller\(['"]([^'"]*)['"]\)/)
  if (!controllerMatch) {
    return null
  }

  const basePath = controllerMatch[1]

  // 提取类名
  const classMatch = content.match(/export class (\w+)Controller/)
  if (!classMatch) {
    return null
  }

  const className = classMatch[1]
  const controllerName = className.toLowerCase()

  // 解析端点
  const endpoints = parseEndpoints(content, basePath)

  return {
    name: controllerName,
    className,
    basePath,
    description: extractDescription(content),
    endpoints,
  }
}

/**
 * Parse endpoints from controller content
 * 从控制器内容解析端点
 */
function parseEndpoints(content, basePath) {
  const endpoints = []

  // 匹配HTTP方法装饰器
  const methodPatterns = {
    GET: /@Get\(['"]([^'"]*)['"]\)/g,
    POST: /@Post\(['"]([^'"]*)['"]\)/g,
    PUT: /@Put\(['"]([^'"]*)['"]\)/g,
    DELETE: /@Delete\(['"]([^'"]*)['"]\)/g,
    PATCH: /@Patch\(['"]([^'"]*)['"]\)/g,
  }

  for (const [method, pattern] of Object.entries(methodPatterns)) {
    let match
    // biome-ignore lint/suspicious/noAssignInExpressions: 这里需要在循环条件中进行正则匹配赋值
    while ((match = pattern.exec(content)) !== null) {
      const path = match[1]
      const fullPath = basePath + (path.startsWith('/') ? path : `/${path}`)

      // 提取方法名和描述
      const methodStart = match.index + match[0].length
      const methodContent = content.substring(methodStart)
      const methodMatch = methodContent.match(/async (\w+)\s*\(/)

      if (methodMatch) {
        const methodName = methodMatch[1]
        const description = extractMethodDescription(methodContent)

        endpoints.push({
          method: method.toLowerCase(),
          path: fullPath,
          operationId: `${methodName}`,
          summary: description || `${method} ${methodName}`,
          description: description || `Execute ${methodName} operation`,
          parameters: extractParameters(methodContent),
          requestBody: method !== 'GET' ? extractRequestBody(methodContent) : undefined,
          responses: generateDefaultResponses(),
        })
      }
    }
  }

  return endpoints
}

/**
 * Extract description from JSDoc comments
 * 从JSDoc注释提取描述
 */
function extractDescription(content) {
  const match = content.match(/\/\*\*\s*\n\s*\*\s*([^*\n]+)/)
  return match ? match[1].trim() : ''
}

/**
 * Extract method description
 * 提取方法描述
 */
function extractMethodDescription(content) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('/**') || line.startsWith('*')) {
      const nextLine = lines[i + 1]?.trim()
      if (nextLine && (nextLine.startsWith('*') || nextLine.includes('*/'))) {
        return nextLine
          .replace(/^\*\s*/, '')
          .replace(/\s*\*\/$/, '')
          .trim()
      }
    }
  }
  return ''
}

/**
 * Extract parameters from method
 * 从方法提取参数
 */
function extractParameters(content) {
  const params = []

  // 查找@Param装饰器
  const paramMatches = content.matchAll(/@Param\(['"]([^'"]*)['"]\)/g)
  for (const match of paramMatches) {
    params.push({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    })
  }

  // 查找@Query装饰器
  const queryMatches = content.matchAll(/@Query\(['"]([^'"]*)['"]\)/g)
  for (const match of queryMatches) {
    params.push({
      name: match[1],
      in: 'query',
      schema: { type: 'string' },
    })
  }

  return params
}

/**
 * Extract request body
 * 提取请求体
 */
function extractRequestBody(content) {
  // 查找@Body装饰器
  if (content.includes('@Body()')) {
    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'Request body',
          },
        },
      },
    }
  }
  return undefined
}

/**
 * Generate default responses
 * 生成默认响应
 */
function generateDefaultResponses() {
  return {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
        },
      },
    },
    400: {
      description: 'Bad Request',
    },
    401: {
      description: 'Unauthorized',
    },
    404: {
      description: 'Not Found',
    },
    500: {
      description: 'Internal Server Error',
    },
  }
}

/**
 * Generate OpenAPI 3.0 specification
 * 生成OpenAPI 3.0规范
 */
function generateOpenApiSpec(controllers, options) {
  const paths = {}
  const tags = []

  // 组织路径和标签
  for (const controller of controllers) {
    tags.push({
      name: controller.name,
      description: controller.description || `${controller.className} operations`,
    })

    for (const endpoint of controller.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {}
      }

      paths[endpoint.path][endpoint.method] = {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        description: endpoint.description,
        tags: [controller.name],
        parameters: endpoint.parameters || [],
        requestBody: endpoint.requestBody,
        responses: endpoint.responses,
      }
    }
  }

  return {
    openapi: '3.0.0',
    info: {
      title: options.title || 'VCPToolBox API',
      description: options.description || 'VCPToolBox API Documentation',
      version: options.version || '1.0.0',
    },
    servers: [
      {
        url: options.server || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths,
    tags,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [{ bearerAuth: [] }, { apiKey: [] }],
  }
}

/**
 * Generate HTML documentation from OpenAPI spec
 * 从OpenAPI规范生成HTML文档
 */
async function generateHtmlDocs(openApiSpec, outputPath) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${openApiSpec.info.title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css">
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header p { margin: 0.5rem 0 0 0; opacity: 0.9; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .stat-card h3 { margin: 0; color: #333; font-size: 2rem; }
        .stat-card p { margin: 0.5rem 0 0 0; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 ${openApiSpec.info.title}</h1>
        <p>${openApiSpec.info.description}</p>
        <p><strong>Version:</strong> ${openApiSpec.info.version} | <strong>API Endpoints:</strong> ${Object.keys(openApiSpec.paths).length}</p>
    </div>

    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <h3>${Object.keys(openApiSpec.paths).length}</h3>
                <p>API Endpoints</p>
            </div>
            <div class="stat-card">
                <h3>${openApiSpec.tags?.length || 0}</h3>
                <p>API Groups</p>
            </div>
            <div class="stat-card">
                <h3>${openApiSpec.info.version}</h3>
                <p>API Version</p>
            </div>
            <div class="stat-card">
                <h3>OpenAPI 3.0</h3>
                <p>Specification</p>
            </div>
        </div>

        <div id="swagger-ui"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                spec: ${JSON.stringify(openApiSpec, null, 2)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Add any custom headers here
                    return request;
                },
                responseInterceptor: function(response) {
                    return response;
                }
            });
        };
    </script>
</body>
</html>`

  await fs.writeFile(outputPath, html, 'utf-8')
}

module.exports = { generateApiDocs, parseController, generateHtmlDocs }
