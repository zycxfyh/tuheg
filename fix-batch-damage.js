#!/usr/bin/env node

/**
 * 修复批量脚本造成的破坏性修改
 */

const fs = require('fs');
const path = require('path');

// 递归遍历目录
function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      walkDirectory(filePath, callback);
    } else if (stat.isFile() && file.endsWith('.ts')) {
      callback(filePath);
    }
  }
}

// 修复批量脚本造成的破坏
function fixBatchDamage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 修复函数返回值类型被破坏的情况
  content = content.replace(/(\w+)\s*\(\s*[^)]*\)\s*:\s*[^|)]+\s*\|\s*undefined\s*\?\?\s*undefined/g, '$1(');

  // 修复重复的 ?? undefined
  content = content.replace(/\?\?\s*undefined\s*\?\?\s*undefined/g, '?? undefined');

  // 修复变量声明被破坏的情况
  content = content.replace(/let\s+undefined\s*:\s*(\w+)\s*\?\?\s*undefined/g, 'let $1 = 0');

  // 修复接口属性被破坏的情况
  content = content.replace(/undefined\s*:\s*(\w+)\s*\?\?\s*undefined/g, '$1: string');

  // 修复参数类型声明被破坏的情况
  content = content.replace(/(\w+)\s*:\s*([^,)\n}]+?)\s*\?\?\s*undefined\s*\?\?\s*undefined/g, '$1: $2');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed batch damage in: ${filePath}`);
  }
}

// 主函数
function main() {
  const rootDir = process.argv[2] || '.';

  console.log('Starting to fix batch damage...');
  walkDirectory(rootDir, fixBatchDamage);
  console.log('Done!');
}

if (require.main === module) {
  main();
}
