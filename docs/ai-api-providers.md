# 🤖 AI API 供应商配置指南

本文档收集了市面上主流的AI API供应商信息及其base URL配置，用于"创世星环"项目的AI服务集成。

## 📋 支持的AI供应商列表

### 🌟 国际主流供应商

#### OpenAI (ChatGPT)
- **供应商**: OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **支持模型**:
  - `gpt-4-turbo`
  - `gpt-4`
  - `gpt-3.5-turbo`
  - `gpt-4o`
  - `gpt-4o-mini`
- **特点**: 最稳定的GPT模型，推理能力强
- **官网**: https://platform.openai.com

#### Anthropic (Claude)
- **供应商**: Anthropic
- **Base URL**: `https://api.anthropic.com`
- **支持模型**:
  - `claude-3-5-sonnet-20241022`
  - `claude-3-haiku-20240307`
  - `claude-3-sonnet-20240229`
  - `claude-3-opus-20240229`
- **特点**: 推理能力优秀，安全系数高
- **官网**: https://console.anthropic.com

#### Google (Gemini)
- **供应商**: Google
- **Base URL**: `https://generativelanguage.googleapis.com`
- **支持模型**:
  - `gemini-1.5-pro`
  - `gemini-1.5-flash`
  - `gemini-pro`
- **特点**: 多模态能力强，性价比高
- **官网**: https://ai.google.dev

#### xAI (Grok)
- **供应商**: xAI
- **Base URL**: `https://api.x.ai/v1`
- **支持模型**:
  - `grok-beta`
  - `grok-vision-beta`
- **特点**: 实时信息获取，幽默风趣
- **官网**: https://x.ai

#### Mistral AI
- **供应商**: Mistral
- **Base URL**: `https://api.mistral.ai/v1`
- **支持模型**:
  - `mistral-large-latest`
  - `mistral-medium`
  - `mistral-small`
- **特点**: 开源模型，性能均衡
- **官网**: https://mistral.ai

#### Together AI
- **供应商**: TogetherAI
- **Base URL**: `https://api.together.xyz/v1`
- **支持模型**: 支持200+种开源模型
  - `meta-llama/Llama-2-70b-chat-hf`
  - `mistralai/Mistral-7B-Instruct-v0.1`
  - `codellama/CodeLlama-34b-Instruct-hf`
- **特点**: 模型选择丰富，价格实惠
- **官网**: https://together.ai

#### OpenRouter
- **供应商**: OpenRouter
- **Base URL**: `https://openrouter.ai/api/v1`
- **支持模型**: 支持100+种模型
  - 各种GPT模型
  - Claude系列
  - 开源模型
- **特点**: 一站式模型聚合平台
- **官网**: https://openrouter.ai

#### NVIDIA
- **供应商**: NVIDIA
- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **支持模型**:
  - `meta/llama3-70b-instruct`
  - `meta/llama3-8b-instruct`
  - `microsoft/wizardlm-8x22b`
- **特点**: GPU加速，推理速度快
- **官网**: https://build.nvidia.com

### 🇨🇳 国内供应商

#### 智谱AI (ChatGLM)
- **供应商**: Zhipu
- **Base URL**: `https://open.bigmodel.cn/api/paas/v4`
- **支持模型**:
  - `glm-4`
  - `glm-3-turbo`
  - `chatglm_turbo`
- **特点**: 国内合规，中文优化
- **官网**: https://open.bigmodel.cn

#### 百度文心一言
- **供应商**: Baichuan
- **Base URL**: `https://api.baichuan-ai.com/v1`
- **支持模型**:
  - `Baichuan4`
  - `Baichuan3-Turbo`
  - `Baichuan2-53B`
- **特点**: 轻量化模型，推理速度快
- **官网**: https://platform.baichuan-ai.com

#### 月之暗面 (Kimi)
- **供应商**: Moonshot
- **Base URL**: `https://api.moonshot.cn/v1`
- **支持模型**:
  - `moonshot-v1-8k`
  - `moonshot-v1-32k`
  - `moonshot-v1-128k`
- **特点**: 长文本处理能力强
- **官网**: https://platform.moonshot.cn

#### 硅基流动
- **供应商**: SiliconFlow
- **Base URL**: `https://api.siliconflow.cn/v1`
- **支持模型**:
  - `deepseek-ai/deepseek-v2-chat`
  - `meta-llama/Meta-Llama-3.1-70B-Instruct`
  - `01-ai/Yi-1.5-34B-Chat-16K`
- **特点**: 模型丰富，价格实惠
- **官网**: https://siliconflow.cn

#### 火山引擎
- **供应商**: Volcengine
- **Base URL**: `https://ark.cn-beijing.volces.com/api/v3`
- **支持模型**:
  - `doubao-lite-32k`
  - `doubao-lite-4k`
  - `doubao-pro-32k`
- **特点**: 字节跳动出品，性能稳定
- **官网**: https://www.volcengine.com

#### 腾讯混元
- **供应商**: Tencent
- **Base URL**: `https://api.hunyuan.cloud.tencent.com/v1`
- **支持模型**:
  - `hunyuan-lite`
  - `hunyuan-standard`
  - `hunyuan-pro`
- **特点**: 腾讯云生态集成
- **官网**: https://cloud.tencent.com

#### 阿里云通义千问
- **供应商**: Aliyun
- **Base URL**: `https://dashscope.aliyuncs.com/api/v1`
- **支持模型**:
  - `qwen-turbo`
  - `qwen-plus`
  - `qwen-max`
- **特点**: 阿里云生态，安全合规
- **官网**: https://dashscope.aliyuncs.com

#### DeepSeek
- **供应商**: DeepSeek
- **Base URL**: `https://api.deepseek.com/v1`
- **支持模型**:
  - `deepseek-chat`
  - `deepseek-coder`
- **特点**: 开源模型，性价比极高
- **官网**: https://platform.deepseek.com

### 🔧 配置使用方法

#### 1. 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# AI 提供商配置
AI_PROVIDER=OpenAI
AI_API_KEY=your-api-key-here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4-turbo

# 可选：备用提供商
FALLBACK_AI_PROVIDER=DeepSeek
FALLBACK_AI_API_KEY=your-fallback-key
FALLBACK_AI_BASE_URL=https://api.deepseek.com/v1
FALLBACK_AI_MODEL=deepseek-chat
```

#### 2. 数据库配置

通过管理界面或直接数据库配置AI提供商：

```sql
-- 插入AI配置
INSERT INTO "AiConfiguration" (
  "provider",
  "modelId",
  "baseUrl",
  "apiKey",
  "ownerId"
) VALUES (
  'OpenAI',
  'gpt-4-turbo',
  'https://api.openai.com/v1',
  'encrypted-api-key',
  'user-uuid'
);
```

#### 3. 动态调度配置

系统会根据用户角色自动选择最适合的AI模型：

```typescript
// 代码中的使用方式
const aiResponse = await dynamicAiScheduler.getProviderForRole(user, 'narrative_synthesis');
const result = await aiResponse.model.invoke([
  new HumanMessage("创建一个奇幻故事...")
]);
```

### 📊 供应商对比

| 供应商 | 模型质量 | 价格 | 速度 | 中文支持 | 合规性 |
|--------|----------|------|------|----------|--------|
| OpenAI | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Anthropic | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Google | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| DeepSeek | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 智谱AI | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 月之暗面 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### ⚠️ 注意事项

1. **API Key安全**: 永远不要在代码中硬编码API Key
2. **费用控制**: 合理设置使用限制和预算
3. **合规要求**: 国内供应商更适合处理中文内容
4. **备用方案**: 配置多个供应商确保服务可用性
5. **监控告警**: 设置API调用失败的监控和告警

### 🔄 更新计划

本配置文档会定期更新，跟踪AI市场的最新动态和供应商变化。如有新的供应商上线或配置变更，请及时更新此文档。

---

*最后更新: 2025-11-07*
*维护者: 创世星环开发团队*
