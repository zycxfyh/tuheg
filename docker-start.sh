#!/bin/bash

# Creation Ring Docker 启动脚本
# 使用方法: ./docker-start.sh

set -e

echo "🚀 启动 Creation Ring Docker 环境..."

# 检查Docker和Docker Compose是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装。请先安装 Docker。"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装。请先安装 Docker Compose。"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "📋 复制环境变量模板..."
    cp docker.env .env
    echo "⚠️  请编辑 .env 文件，设置你的 DeepSeek API 密钥和其他配置。"
    echo "   编辑完成后重新运行此脚本。"
    exit 1
fi

# 检查DeepSeek API密钥
if ! grep -q "DEEPSEEK_API_KEY=sk-" .env; then
    echo "⚠️  请在 .env 文件中设置有效的 DeepSeek API 密钥。"
    echo "   DEEPSEEK_API_KEY=你的API密钥"
    exit 1
fi

echo "🔨 构建并启动服务..."
docker-compose down 2>/dev/null || true
docker-compose build --parallel
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 30

echo "🔍 检查服务状态..."
docker-compose ps

echo ""
echo "🎉 Creation Ring 已启动！"
echo ""
echo "📊 服务访问地址:"
echo "   🌐 前端应用: http://localhost:3000"
echo "   🚪 API网关:   http://localhost:4000"
echo "   🤖 创建代理:   http://localhost:8080"
echo "   🧠 逻辑代理:   http://localhost:8081"
echo "   📚 叙事代理:   http://localhost:8082"
echo "   🐰 RabbitMQ:   http://localhost:15672 (guest/guest)"
echo "   📈 Grafana:    http://localhost:3001 (admin/admin)"
echo ""
echo "🔧 管理命令:"
echo "   查看日志:    docker-compose logs -f"
echo "   停止服务:    docker-compose down"
echo "   重启服务:    docker-compose restart"
echo ""
echo "📖 完整文档请查看: DOCKER_DEPLOYMENT.md"
