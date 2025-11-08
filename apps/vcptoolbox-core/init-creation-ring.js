#!/usr/bin/env node

/**
 * 创世星环初始化脚本
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🚀 开始初始化创世星环...');

// 初始化配置
const config = {
  name: '创世星环',
  version: '1.0.0',
  initialized: true,
  initTime: new Date().toISOString()
};

// 示例数据
const sampleData = {
  story: {
    id: 'sample-story-001',
    title: '创世星环的诞生',
    genre: '奇幻',
    content: '一个关于AI与人类共同创造故事的奇幻冒险...',
    status: 'draft',
    createdAt: new Date().toISOString()
  },

  character: {
    id: 'sample-character-001',
    name: '艾丽娅',
    age: 25,
    personality: ['聪明', '富有创造力'],
    background: '来自一个古老的叙事师家族',
    status: 'active',
    createdAt: new Date().toISOString()
  },

  world: {
    id: 'sample-world-001',
    name: '创世星环宇宙',
    type: '奇幻',
    description: '一个AI与人类共同创造故事的奇幻宇宙',
    status: 'active',
    createdAt: new Date().toISOString()
  }
};

async function initializeDirectories() {
  console.log('📁 创建目录结构...');

  const directories = [
    'data/stories',
    'data/characters',
    'data/worlds',
    'data/sessions',
    'data/backups',
    'logs',
    'plugins/creation-ring'
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`  ✅ ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`  ❌ 创建目录失败 ${dir}:`, error.message);
      }
    }
  }
}

async function createSampleData() {
  console.log('📄 创建示例数据...');

  const samples = [
    { type: 'story', data: sampleData.story },
    { type: 'character', data: sampleData.character },
    { type: 'world', data: sampleData.world }
  ];

  for (const sample of samples) {
    const filePath = `data/${sample.type}s/${sample.data.id}.json`;
    try {
      await fs.writeFile(filePath, JSON.stringify(sample.data, null, 2));
      console.log(`  ✅ ${filePath}`);
    } catch (error) {
      console.error(`  ❌ 创建示例${sample.type}失败:`, error.message);
    }
  }
}

async function createReadme() {
  console.log('📖 创建README文件...');

  const readme = `# 创世星环 (Creation Ring)

## 简介

创世星环是一个基于VCPToolBox定制的AI叙事创作平台。

## 特性

- 🤖 AI驱动的故事生成
- 👥 实时协作创作
- 🌍 沉浸式世界构建
- 👤 深度角色塑造

## 快速开始

1. 配置环境变量到 .env 文件
2. 运行 \`npm install\`
3. 运行 \`npm start\`

## API文档

- GET /api/v1/health - 健康检查
- POST /api/v1/stories - 创建故事
- GET /api/v1/stories - 获取故事列表
`;

  try {
    await fs.writeFile('README.md', readme);
    console.log('  ✅ README.md');
  } catch (error) {
    console.error('  ❌ 创建README失败:', error.message);
  }
}

async function main() {
  try {
    console.log('🎭 创世星环初始化开始...\n');

    await initializeDirectories();
    console.log('');

    await createSampleData();
    console.log('');

    await createReadme();
    console.log('');

    console.log('🎉 创世星环初始化完成！');
    console.log('');
    console.log('📋 下一步操作：');
    console.log('1. 复制 config.template.js 为 .env 并配置');
    console.log('2. 运行 npm install');
    console.log('3. 运行 npm start');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  initializeDirectories,
  createSampleData,
  createReadme
};
