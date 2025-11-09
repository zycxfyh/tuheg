#!/bin/bash

# Creation Ring Docker 清理脚本
# 使用方法: ./docker-clean.sh

echo "🧹 清理 Creation Ring Docker 环境..."

# 停止并移除所有服务和卷
echo "🛑 停止服务..."
docker-compose down -v --remove-orphans

# 移除未使用的镜像
echo "🗑️  移除未使用的Docker镜像..."
docker image prune -f

# 移除未使用的卷
echo "🗂️  移除未使用的Docker卷..."
docker volume prune -f

# 移除未使用的网络
echo "🌐 移除未使用的Docker网络..."
docker network prune -f

echo ""
echo "✅ Docker环境已清理完成！"
echo ""
echo "💡 如需完全重新开始，可以运行:"
echo "   rm -rf .env"
echo "   ./docker-start.sh"
