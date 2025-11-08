#!/usr/bin/env node

/**
 * 安全修复exactOptionalPropertyTypes错误
 * 只在明确的对象字面量中添加 ?? undefined
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

// 安全修复可选属性
function fixOptionalProps(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 只修复对象字面量中的可选属性（在冒号后，逗号或大括号前）
  const objectLiteralPattern = /(\w+)\s*:\s*([^,\n}]+?\s*\|\s*undefined)(\s*[,}])/g;
  content = content.replace(objectLiteralPattern, (match, prop, type, separator) => {
    if (!match.includes('?? undefined') && !match.includes('|| undefined')) {
      modified = true;
      return `${prop}: ${type} ?? undefined${separator}`;
    }
    return match;
  });

  // 修复函数调用参数中的可选对象属性
  const functionCallPattern = /(\w+)\s*:\s*([^,)\n}]+?\s*\|\s*undefined)(\s*[,)])/g;
  content = content.replace(functionCallPattern, (match, param, type, separator) => {
    if (!match.includes('?? undefined') && !match.includes('|| undefined')) {
      // 只在函数调用参数中修复，避免破坏函数定义
      const beforeMatch = content.substring(0, content.indexOf(match));
      const lastParen = beforeMatch.lastIndexOf('(');
      const lastBrace = beforeMatch.lastIndexOf('{');

      if (lastParen > lastBrace) {
        modified = true;
        return `${param}: ${type} ?? undefined${separator}`;
      }
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed optional props in: ${filePath}`);
  }
}

// 主函数
function main() {
  const rootDir = process.argv[2] || '.';

  console.log('Starting safe fix for optional properties...');
  walkDirectory(rootDir, fixOptionalProps);
  console.log('Done!');
}

if (require.main === module) {
  main();
}
