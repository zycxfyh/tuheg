#!/usr/bin/env node

/**
 * AI 供应商配置助手
 * 帮助用户快速配置各种AI API供应商
 */

const fs = require('fs');
const path = require('path');

// AI供应商配置数据
const AI_PROVIDERS = {
  // 国际供应商
  'openai': {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'],
    description: '最稳定的GPT模型，推理能力强'
  },
  'anthropic': {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229'],
    description: '推理能力优秀，安全系数高'
  },
  'google': {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    description: '多模态能力强，性价比高'
  },
  'xai': {
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    models: ['grok-beta', 'grok-vision-beta'],
    description: '实时信息获取，幽默风趣'
  },
  'mistral': {
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    models: ['mistral-large-latest', 'mistral-medium', 'mistral-small'],
    description: '开源模型，性能均衡'
  },
  'together': {
    name: 'TogetherAI',
    baseUrl: 'https://api.together.xyz/v1',
    models: ['meta-llama/Llama-2-70b-chat-hf', 'mistralai/Mistral-7B-Instruct-v0.1'],
    description: '模型选择丰富，价格实惠'
  },
  'openrouter': {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['gpt-4-turbo', 'claude-3-5-sonnet', 'gemini-pro'],
    description: '一站式模型聚合平台'
  },
  'nvidia': {
    name: 'NVIDIA',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: ['meta/llama3-70b-instruct', 'meta/llama3-8b-instruct'],
    description: 'GPU加速，推理速度快'
  },

  // 国内供应商
  'deepseek': {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    description: '开源模型，性价比极高'
  },
  'zhipu': {
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-3-turbo', 'chatglm_turbo'],
    description: '国内合规，中文优化'
  },
  'baichuan': {
    name: '百川智能',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    models: ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan2-53B'],
    description: '轻量化模型，推理速度快'
  },
  'moonshot': {
    name: '月之暗面',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    description: '长文本处理能力强'
  },
  'siliconflow': {
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/deepseek-v2-chat', 'meta-llama/Meta-Llama-3.1-70B-Instruct'],
    description: '模型丰富，价格实惠'
  },
  'volcengine': {
    name: '火山引擎',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-lite-32k', 'doubao-lite-4k', 'doubao-pro-32k'],
    description: '字节跳动出品，性能稳定'
  },
  'tencent': {
    name: '腾讯混元',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    models: ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'],
    description: '腾讯云生态集成'
  },
  'aliyun': {
    name: '阿里云通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    description: '阿里云生态，安全合规'
  }
};

// 角色映射
const ROLE_MODELS = {
  'narrative_synthesis': ['gpt-4-turbo', 'claude-3-5-sonnet-20241022', 'glm-4'],
  'logic_parsing': ['gpt-4', 'claude-3-sonnet-20240229', 'glm-3-turbo'],
  'planner': ['gpt-4-turbo', 'claude-3-5-sonnet-20241022', 'deepseek-chat'],
  'critic': ['gpt-4', 'claude-3-haiku-20240307', 'moonshot-v1-8k'],
  'summarizer': ['gpt-3.5-turbo', 'gemini-1.5-flash', 'qwen-turbo'],
  'converter': ['gpt-4', 'claude-3-sonnet-20240229', 'glm-4'],
  'novelist': ['gpt-4-turbo', 'claude-3-5-sonnet-20241022', 'hunyuan-pro'],
  'supervisor': ['gpt-4', 'claude-3-haiku-20240307', 'deepseek-chat']
};

function showProviders() {
  console.log('🤖 支持的AI供应商列表:\n');

  console.log('🌍 国际供应商:');
  Object.entries(AI_PROVIDERS).forEach(([key, provider]) => {
    if (!['deepseek', 'zhipu', 'baichuan', 'moonshot', 'siliconflow', 'volcengine', 'tencent', 'aliyun'].includes(key)) {
      console.log(`  ${key.padEnd(12)} - ${provider.name}: ${provider.description}`);
    }
  });

  console.log('\n🇨🇳 国内供应商:');
  ['deepseek', 'zhipu', 'baichuan', 'moonshot', 'siliconflow', 'volcengine', 'tencent', 'aliyun'].forEach(key => {
    const provider = AI_PROVIDERS[key];
    console.log(`  ${key.padEnd(12)} - ${provider.name}: ${provider.description}`);
  });

  console.log('\n📖 使用方法:');
  console.log('  node scripts/setup-ai-providers.js <供应商名> [API密钥]');
  console.log('  例如: node scripts/setup-ai-providers.js openai sk-your-api-key-here');
  console.log('\n📚 查看详细配置: node scripts/setup-ai-providers.js --help');
}

function showProviderDetails(providerName) {
  if (!AI_PROVIDERS[providerName]) {
    console.error(`❌ 未找到供应商: ${providerName}`);
    console.log('运行 `node scripts/setup-ai-providers.js --list` 查看所有支持的供应商');
    process.exit(1);
  }

  const provider = AI_PROVIDERS[providerName];
  console.log(`\n📋 ${provider.name} 配置详情:`);
  console.log(`   Base URL: ${provider.baseUrl}`);
  console.log(`   描述: ${provider.description}`);
  console.log(`   支持模型:`);
  provider.models.forEach(model => {
    console.log(`     - ${model}`);
  });

  console.log(`\n💡 推荐用于的角色:`);
  Object.entries(ROLE_MODELS).forEach(([role, models]) => {
    if (models.some(model => provider.models.includes(model))) {
      console.log(`   ${role}: ✅`);
    }
  });
}

function setupProvider(providerName, apiKey) {
  if (!AI_PROVIDERS[providerName]) {
    console.error(`❌ 未找到供应商: ${providerName}`);
    process.exit(1);
  }

  if (!apiKey) {
    console.error('❌ 请提供API密钥');
    console.log('使用方法: node scripts/setup-ai-providers.js <供应商名> <API密钥>');
    process.exit(1);
  }

  const provider = AI_PROVIDERS[providerName];
  const envFile = path.join(process.cwd(), '.env');

  console.log(`\n🔧 配置 ${provider.name}...`);

  // 读取现有环境变量
  let envContent = '';
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }

  // 更新或添加AI配置
  const envLines = envContent.split('\n');
  const newEnvVars = [
    `# ${provider.name} AI 配置`,
    `AI_PROVIDER=${provider.name}`,
    `AI_API_KEY=${apiKey}`,
    `AI_BASE_URL=${provider.baseUrl}`,
    `AI_MODEL=${provider.models[0]}`,  // 使用第一个模型作为默认
    ''
  ];

  // 移除旧的AI配置
  const filteredLines = envLines.filter(line =>
    !line.startsWith('AI_PROVIDER=') &&
    !line.startsWith('AI_API_KEY=') &&
    !line.startsWith('AI_BASE_URL=') &&
    !line.startsWith('AI_MODEL=')
  );

  // 添加新的配置
  const finalContent = [...filteredLines, ...newEnvVars].join('\n');

  // 写入文件
  fs.writeFileSync(envFile, finalContent);

  console.log('✅ 配置完成！');
  console.log(`   供应商: ${provider.name}`);
  console.log(`   Base URL: ${provider.baseUrl}`);
  console.log(`   默认模型: ${provider.models[0]}`);
  console.log(`   配置文件: .env`);

  console.log('\n🚀 接下来你可以：');
  console.log('   1. 启动应用测试配置: npm run dev');
  console.log('   2. 查看AI配置文档: docs/ai-api-providers.md');
  console.log('   3. 配置更多供应商作为备用选项');
}

function showHelp() {
  console.log(`
🤖 AI供应商配置助手

USAGE:
  node scripts/setup-ai-providers.js [command] [options]

COMMANDS:
  --list                    显示所有支持的供应商
  --details <供应商名>       显示供应商详细信息
  <供应商名> <API密钥>       配置指定的AI供应商

EXAMPLES:
  node scripts/setup-ai-providers.js --list
  node scripts/setup-ai-providers.js --details openai
  node scripts/setup-ai-providers.js openai sk-your-api-key-here
  node scripts/setup-ai-providers.js deepseek sk-your-deepseek-key

SUPPORTED PROVIDERS:
  🌍 International: openai, anthropic, google, xai, mistral, together, openrouter, nvidia
  🇨🇳 Domestic: deepseek, zhipu, baichuan, moonshot, siliconflow, volcengine, tencent, aliyun

NOTES:
  - 配置会自动更新 .env 文件
  - 多个供应商可以配置为备用选项
  - 建议至少配置一个国际和一个国内供应商确保稳定性

For more information, see: docs/ai-api-providers.md
  `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case '--list':
      showProviders();
      break;

    case '--details':
      if (args.length < 2) {
        console.error('❌ 请指定供应商名称');
        console.log('例如: node scripts/setup-ai-providers.js --details openai');
        process.exit(1);
      }
      showProviderDetails(args[1]);
      break;

    case '--help':
      showHelp();
      break;

    default:
      // 配置供应商
      if (args.length < 2) {
        console.error('❌ 请提供API密钥');
        console.log('使用方法: node scripts/setup-ai-providers.js <供应商名> <API密钥>');
        process.exit(1);
      }
      setupProvider(args[0], args[1]);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AI_PROVIDERS, ROLE_MODELS };
