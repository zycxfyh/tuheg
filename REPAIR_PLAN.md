# 创世星环项目修复计划

_生成时间：2025-11-08_

## 一、整体健康状况概览
- `pnpm install`：✅ 成功，伴随部分 peer dependency 与弃用包告警
- `pnpm run test:fail-fast`：❌ 失败，8 个测试套件未通过
- `pnpm run lint`：❌ 失败，Biome 报告约 3000+ lint 错误（复杂度与 `any` 使用居多）
- `pnpm run build:all`：❌ 失败，TypeScript 项目引用配置错误、多处输出未生成，前端构建缺少依赖

> 当前仓库处于“不可通过 CI / 不可构建”状态，必须先修复工具链与配置问题，才能进入功能层面的修补。

## 二、关键失败点详解

### 1. TypeScript 工程配置失效
- 根目录 `tsconfig.json` 设置了 `"noEmit": true`，但仍在 `references` 中引用多个项目，导致 `pnpm run build:all` 时 `tsc` 要求各子项目启用 `composite` 且允许输出。
- 各子项目（例如 `apps/backend-gateway/tsconfig.json`、`packages/common-backend/tsconfig.json`）继承根配置，缺少独立的 `tsconfig.build.json` 或覆盖项，最终生成 `TS6305/TS6306/TS6310` 系列错误。
- `tsconfig.json` 的 `references` 指向多个并不存在的编译单元（如 `packages/ai-services` 仅包含文档），触发 `TS6053` “文件未找到”。
- 建议：为每个可构建项目新增/修正 `tsconfig.build.json`（开启 `composite`, `declaration`, `emitDecoratorMetadata` 等），根 `tsconfig.json` 仅保留真实存在且需要增量编译的引用。

### 2. 测试运行失败
- 环境变量校验失败：`packages/common-backend/src/config/env.schema.ts` 要求 `ENCRYPTION_KEY` 等字段，`tests/setup.ts` 未提供默认值，导致所有依赖模块在加载阶段抛错。
- `langfuse` 为 ESM 包，`packages/common-backend/src/ai/langfuse.service.ts` 在 Jest 下抛出 “dynamic import callback was invoked without --experimental-vm-modules”。需在测试环境中 mock/隔离该模块或调整导入方式。
- `tools/plugin-generator/my-test-plugin`：测试期望命名导出 `createMyTestPluginPlugin`，但 `src/index.ts` 仅提供默认导出，运行时报 “is not a function”。需同步导出方式与测试。
- `ts-jest` 相对导入报 “Cannot find module './xxx'”——与当前 `tsconfig` 设置（`moduleResolution: node` + `isolatedModules` + 未生成产物）冲突，待 TypeScript 构建链恢复后再复核。

### 3. Lint 配置与现有代码脱节
- `pnpm run lint` 调用 Biome 且启用 `noExplicitAny`、`noExcessiveCognitiveComplexity` 等严格规则，现实代码（例如 `tools/plugin-generator/src/sandbox.ts` 复杂度 30、多个 `any`）导致成千上万的错误。
- 建议：短期降低规则严格度（例如对生成代码或脚本目录降级为警告或排除），中期分阶段重构高复杂度/`any` 使用点，逐渐收紧规则。

### 4. 前端构建阻塞
- `apps/frontend/vite.config.js` 出现重复的 `server`、`build`、`optimizeDeps` 定义，疑似在既有配置上直接复制追加，导致配置难以维护。
- 构建时 Rollup 报 “Could not resolve entry module `@capacitor/camera`”，项目依赖并未安装对应的 Capacitor 包。`package.json` 中缺失 `@capacitor/core`、`@capacitor/camera`、`@capacitor/filesystem` 等条目。
- 需梳理移动端/桌面端支持策略，按需添加依赖并拆分环境配置，避免单一 `vite.config.js` 同时承担所有平台逻辑。

### 5. 代码库结构混乱
- `packages/` 与 `packages/common-backend/dist` 并存，大量编译产物（`.js/.map/.d.ts`）被提交到仓库。建议在 `.gitignore` 中排除生成文件，并清理历史产物。
- Nx 项目主要通过 `nx run-script` 触发 `pnpm run ...`，未充分利用 Nx 原生执行器（导致缓存与依赖图价值受限）。可评估逐步迁移到官方执行器。

## 三、修复规划（建议顺序）

1. **工具链与配置基础**
   - 为所有实际构建项目创建 `tsconfig.build.json`（或调整现有 `tsconfig`）使其符合 `composite` 要求，并在 `package.json` 中更新 `build` 命令指向新的配置。
   - 清理根 `tsconfig.json` 中不存在的 `references`，并将 `noEmit` 限定于非构建流程（可在 `tsconfig.base.json` 保持，构建用独立配置禁用）。
   - 调整 Nx target：从 `nx:run-script` 迁移至 `@nx/js:tsc`、`@nx/vite:build` 等，以充分使用依赖图与缓存。

2. **恢复测试能力**
   - 在 `tests/setup.ts` 中补齐最小化的环境变量 mock（例如为 `ENCRYPTION_KEY`、`ENCRYPTION_SALT` 提供伪值），并针对 `langfuse` 引入条件加载或 Jest mock。
   - 修复 `tools/plugin-generator/my-test-plugin` 导出与测试不匹配的问题。
   - 重跑 `pnpm run test:fail-fast`，确认余下 “Cannot find module” 问题是否仍存在；若存在，再检查 Jest 配置与 tsconfig 的联动。

3. **前端构建梳理**
   - 拆分或去重 `vite.config.js` 配置，明确 web / capacitor / tauri 三类配置入口。
   - 在 `apps/frontend/package.json` 中声明缺失的 Capacitor 依赖，或在未准备好之前暂时禁用相关 chunk。
   - 重新执行 `pnpm run build --filter @tuheg/frontend`，确保打包链路稳定。

4. **Lint 策略落地**
   - 分目录调整 Biome 规则：短期可对 `tools/`、测试或生成代码目录放宽 `noExplicitAny` 与复杂度限制。
   - 建立阶段性重构计划，对关键逻辑（例如 `plugin-generator` 沙盒）拆分函数、补充类型。

5. **仓库卫生**
   - `packages/common-backend/dist` 及 `src` 内编译产物已于 2025-11-08 清理，并在 `.gitignore` 中添加忽略规则。
   - `apps-new/` 目录已于 2025-11-08 清理，后续仅需继续关注产物目录和重复脚本。

## 四、验证清单
完成上述修复后，预计需成功通过以下命令：

```bash
pnpm install
pnpm run lint
pnpm run test:fail-fast
pnpm run build:all
nx run-many --target=build --all --skip-nx-cache
```

此外，建议补充：
- `pnpm run type-check`（待恢复真实 TypeScript 校验脚本）
- 前后端关键路径的端到端冒烟测试

## 五、风险与关注点
- 调整 TypeScript 配置时需确保 NestJS 运行时依赖（`emitDecoratorMetadata`, `experimentalDecorators`）仍被启用。
- 重新组织 Vite 配置时注意 PWA 及多平台定制逻辑不要被误删。
- 大规模 lint 规则调整需与团队达成共识，避免长期处于“禁用多数规则”的状态。

> 建议先建立独立的修复分支，按上述顺序逐步合入，每一步都通过 CI 验证，再继续下一阶段。
