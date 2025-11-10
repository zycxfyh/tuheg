#!/usr/bin/env node

/**
 * 验证重构结果的脚本
 * 检查新的包结构和依赖关系
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPackageExists(packageName) {
  const packagePath = path.join(__dirname, '..', 'packages', packageName);
  const exists = fs.existsSync(packagePath);
  log(exists ? colors.green : colors.red, `${exists ? '✅' : '❌'} Package ${packageName}: ${exists ? 'exists' : 'missing'}`);
  return exists;
}

function checkPackageJson(packageName) {
  const packageJsonPath = path.join(__dirname, '..', 'packages', packageName, 'package.json');
  const exists = fs.existsSync(packageJsonPath);

  if (!exists) {
    log(colors.red, `❌ ${packageName}/package.json: missing`);
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasName = packageJson.name === `@tuheg/${packageName}`;
    const hasMain = packageJson.main === 'src/index.ts';

    log(hasName && hasMain ? colors.green : colors.yellow,
      `⚠️ ${packageName}/package.json: ${hasName ? 'name ok' : 'name mismatch'}, ${hasMain ? 'main ok' : 'main missing'}`);

    return hasName && hasMain;
  } catch (error) {
    log(colors.red, `❌ ${packageName}/package.json: invalid JSON`);
    return false;
  }
}

function checkIndexFile(packageName) {
  const indexPath = path.join(__dirname, '..', 'packages', packageName, 'src', 'index.ts');
  const exists = fs.existsSync(indexPath);

  log(exists ? colors.green : colors.red, `${exists ? '✅' : '❌'} ${packageName}/src/index.ts: ${exists ? 'exists' : 'missing'}`);
  return exists;
}

function checkAppDependencies(appName) {
  const packageJsonPath = path.join(__dirname, '..', 'apps', appName, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log(colors.red, `❌ ${appName}/package.json: missing`);
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = packageJson.dependencies || {};

    const newDeps = ['@tuheg/abstractions', '@tuheg/config-management', '@tuheg/database', '@tuheg/ai-providers'];
    const hasNewDeps = newDeps.every(dep => deps[dep] === 'workspace:*');
    const hasOldDeps = deps['@tuheg/infrastructure'] === 'workspace:*';

    if (hasNewDeps && !hasOldDeps) {
      log(colors.green, `✅ ${appName}: dependencies updated correctly`);
      return true;
    } else if (hasOldDeps) {
      log(colors.yellow, `⚠️ ${appName}: still has old infrastructure dependency`);
      return false;
    } else {
      log(colors.yellow, `⚠️ ${appName}: missing some new dependencies`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ ${appName}/package.json: invalid JSON`);
    return false;
  }
}

function main() {
  log(colors.blue, '🔍 验证项目重构结果...\n');

  // 检查新创建的包
  const newPackages = ['abstractions', 'config-management', 'database', 'ai-providers'];

  log(colors.blue, '📦 检查新创建的包:');
  let allPackagesOk = true;

  for (const packageName of newPackages) {
    const packageExists = checkPackageExists(packageName);
    const packageJsonOk = packageExists && checkPackageJson(packageName);
    const indexExists = packageExists && checkIndexFile(packageName);

    allPackagesOk = allPackagesOk && packageExists && packageJsonOk && indexExists;
  }

  log(colors.blue, '\n🏗️ 检查应用依赖更新:');
  const apps = ['backend-gateway', 'creation-agent'];
  let allAppsOk = true;

  for (const appName of apps) {
    allAppsOk = allAppsOk && checkAppDependencies(appName);
  }

  // 检查Nx配置
  log(colors.blue, '\n⚙️ 检查Nx配置:');
  const nxJsonPath = path.join(__dirname, '..', 'nx.json');
  if (fs.existsSync(nxJsonPath)) {
    try {
      const nxJson = JSON.parse(fs.readFileSync(nxJsonPath, 'utf8'));
      const projects = Object.keys(nxJson.projects || {});

      const hasNewProjects = newPackages.every(pkg => projects.includes(pkg));
      log(hasNewProjects ? colors.green : colors.red,
        `${hasNewProjects ? '✅' : '❌'} Nx projects: ${hasNewProjects ? 'new packages added' : 'missing new packages'}`);

      allPackagesOk = allPackagesOk && hasNewProjects;
    } catch (error) {
      log(colors.red, '❌ nx.json: invalid JSON');
      allPackagesOk = false;
    }
  } else {
    log(colors.red, '❌ nx.json: missing');
    allPackagesOk = false;
  }

  // 总结
  log(colors.blue, '\n📊 重构验证结果:');

  if (allPackagesOk && allAppsOk) {
    log(colors.green, '🎉 重构验证通过！所有新包和依赖更新都正确。');
    log(colors.blue, '\n📋 下一步建议:');
    console.log('1. 运行完整的构建测试: npm run build:all');
    console.log('2. 实现事件驱动架构以进一步解耦');
    console.log('3. 添加更多的业务领域包');
    console.log('4. 完善测试覆盖率');
    process.exit(0);
  } else {
    log(colors.red, '❌ 重构验证失败！请检查上述问题。');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
