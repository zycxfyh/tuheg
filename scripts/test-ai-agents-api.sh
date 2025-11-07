#!/bin/bash

# AI Agents HTTP API 测试脚本
# 测试三个AI agent的独立HTTP API接口

set -e

echo "🤖 测试AI Agents HTTP API"
echo "=========================="

# 测试Creation Agent API
echo ""
echo "🏗️ 测试Creation Agent API"
echo "-------------------------"

CREATION_PORT=${CREATION_AGENT_HTTP_PORT:-8080}
CREATION_URL="http://localhost:${CREATION_PORT}/api/v1/creation"

echo "📡 Creation Agent URL: $CREATION_URL"

# 测试状态端点
echo "🔍 测试 /creation-status 端点..."
if curl -s -X POST "$CREATION_URL/creation-status" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}' | grep -q '"success":true'; then
  echo "✅ Creation Agent 状态检查通过"
else
  echo "❌ Creation Agent 状态检查失败"
  exit 1
fi

# 测试创建世界端点
echo "🏗️ 测试 /create-world 端点..."
if curl -s -X POST "$CREATION_URL/create-world" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "concept": "一个充满魔法和冒险的奇幻世界，玩家可以探索古老的遗迹，结识各种神奇的生物"
  }' | grep -q '"success":true'; then
  echo "✅ Creation Agent 创建世界测试通过"
else
  echo "❌ Creation Agent 创建世界测试失败"
fi

# 测试Logic Agent API
echo ""
echo "🧠 测试Logic Agent API"
echo "---------------------"

LOGIC_PORT=${LOGIC_AGENT_HTTP_PORT:-8081}
LOGIC_URL="http://localhost:${LOGIC_PORT}/api/v1/logic"

echo "📡 Logic Agent URL: $LOGIC_URL"

# 测试状态端点
echo "🔍 测试 /logic-status 端点..."
if curl -s -X POST "$LOGIC_URL/logic-status" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}' | grep -q '"success":true'; then
  echo "✅ Logic Agent 状态检查通过"
else
  echo "❌ Logic Agent 状态检查失败"
  exit 1
fi

# 测试处理行动端点
echo "🎯 测试 /process-action 端点..."
if curl -s -X POST "$LOGIC_URL/process-action" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "gameId": "test-game-123",
    "action": {
      "type": "command",
      "payload": "我想要探索这个森林"
    }
  }' | grep -q '"success":true'; then
  echo "✅ Logic Agent 处理行动测试通过"
else
  echo "❌ Logic Agent 处理行动测试失败"
fi

# 测试Narrative Agent API
echo ""
echo "📖 测试Narrative Agent API"
echo "-------------------------"

NARRATIVE_PORT=${NARRATIVE_AGENT_HTTP_PORT:-8082}
NARRATIVE_URL="http://localhost:${NARRATIVE_PORT}/api/v1/narrative"

echo "📡 Narrative Agent URL: $NARRATIVE_URL"

# 测试状态端点
echo "🔍 测试 /narrative-status 端点..."
if curl -s -X POST "$NARRATIVE_URL/narrative-status" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}' | grep -q '"success":true'; then
  echo "✅ Narrative Agent 状态检查通过"
else
  echo "❌ Narrative Agent 状态检查失败"
  exit 1
fi

# 测试生成叙事端点
echo "📝 测试 /generate-narrative 端点..."
if curl -s -X POST "$NARRATIVE_URL/generate-narrative" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "gameId": "test-game-123",
    "context": {
      "previousEvents": ["玩家进入了森林"],
      "characterState": {"health": 100, "location": "forest"},
      "worldState": {"time": "morning", "weather": "sunny"}
    }
  }' | grep -q '"success":true'; then
  echo "✅ Narrative Agent 生成叙事测试通过"
else
  echo "❌ Narrative Agent 生成叙事测试失败"
fi

echo ""
echo "🎉 所有AI Agents HTTP API测试完成！"
echo ""
echo "📋 API端点总结:"
echo "🏗️  Creation Agent: http://localhost:${CREATION_PORT}/api/v1/creation"
echo "   - POST /create-world      - 创建新世界"
echo "   - POST /creation-status   - 获取状态"
echo ""
echo "🧠 Logic Agent: http://localhost:${LOGIC_PORT}/api/v1/logic"
echo "   - POST /process-action    - 处理游戏行动"
echo "   - POST /logic-status      - 获取状态"
echo ""
echo "📖 Narrative Agent: http://localhost:${NARRATIVE_PORT}/api/v1/narrative"
echo "   - POST /generate-narrative - 生成叙事内容"
echo "   - POST /narrative-status   - 获取状态"
