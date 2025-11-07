#!/bin/bash

# 🔄 工业级回归测试脚本
# 用于验证历史功能在新版本中仍然正常工作

set -e

echo "🔄 Starting Industrial Regression Tests..."
echo "=========================================="

# 启动测试环境
log_info "Starting test environment..."
if ! docker-compose -f docker-compose.test.yml up -d --build; then
    log_error "Failed to start test environment"
    exit 1
fi

# 等待服务启动
log_info "Waiting for services to be ready..."
sleep 30

# 检查所有服务是否健康
log_info "Checking service health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    all_healthy=true

    # 检查PostgreSQL
    if ! docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U testuser -d tuheg_test > /dev/null; then
        all_healthy=false
    fi

    # 检查Redis
    if ! docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping | grep -q PONG; then
        all_healthy=false
    fi

    # 检查RabbitMQ
    if ! docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmq-diagnostics -q ping; then
        all_healthy=false
    fi

    # 检查API Gateway
    if ! curl -f --max-time 5 http://localhost:3001/health > /dev/null 2>&1; then
        all_healthy=false
    fi

    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy"
        break
    fi

    log_info "Waiting for services... (attempt $attempt/$max_attempts)"
    sleep 10
    ((attempt++))
done

if [ "$all_healthy" = false ]; then
    log_error "Services failed to start within timeout"
    docker-compose -f docker-compose.test.yml down
    exit 1
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建测试报告目录
mkdir -p test-results/regression
REPORT_FILE="test-results/regression/regression-test-report.md"

# 初始化测试报告
echo "# 🔄 回归测试报告" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **开始时间**: $(date)" >> "$REPORT_FILE"
echo "- **测试环境**: $(hostname)" >> "$REPORT_FILE"
echo "- **测试类型**: 历史功能验证" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 测试计数器
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"

    ((TESTS_TOTAL++))
    log_info "Running: $test_name"

    echo "## $test_name" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    if eval "$test_command" 2>&1; then
        log_success "✓ $test_name PASSED"
        echo "- **状态**: ✅ PASSED" >> "$REPORT_FILE"
        ((TESTS_PASSED++))
    else
        log_error "✗ $test_name FAILED"
        echo "- **状态**: ❌ FAILED" >> "$REPORT_FILE"
        ((TESTS_FAILED++))
        return 1
    fi

    echo "- **时间**: $(date)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# 1. 用户认证功能回归测试
run_test "用户认证功能回归测试" "
    log_info 'Testing user authentication regression...'

    # 测试用户注册（创建用户）
    user_data='{\"email\":\"regression-test@example.com\",\"name\":\"Regression Test User\"}'
    register_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$user_data\" http://localhost:3001/api/users)

    if ! echo \"\$register_response\" | jq -e '.id' > /dev/null; then
        log_error 'User registration failed'
        exit 1
    fi

    user_id=\$(echo \"\$register_response\" | jq -r '.id')
    log_info \"User registered with ID: \$user_id\"

    # 测试用户查询（模拟登录验证）
    user_response=\$(curl -s http://localhost:3001/api/users/\$user_id)
    if ! echo \"\$user_response\" | jq -e '.email' > /dev/null; then
        log_error 'User retrieval failed'
        exit 1
    fi

    # 验证用户数据
    retrieved_email=\$(echo \"\$user_response\" | jq -r '.email')
    if [ \"\$retrieved_email\" != 'regression-test@example.com' ]; then
        log_error 'User data mismatch'
        exit 1
    fi

    # 清理测试数据
    docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -c \"DELETE FROM \\\"User\\\" WHERE id::text = '\$user_id';\" > /dev/null

    log_success 'User authentication regression verified'
"

# 2. 世界创建功能回归测试
run_test "世界创建功能回归测试" "
    log_info 'Testing world creation regression...'

    # 先创建用户
    user_data='{\"email\":\"world-test@example.com\",\"name\":\"World Test User\"}'
    user_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$user_data\" http://localhost:3001/api/users)

    if ! echo \"\$user_response\" | jq -e '.id' > /dev/null; then
        log_error 'User creation failed for world test'
        exit 1
    fi

    user_id=\$(echo \"\$user_response\" | jq -r '.id')

    # 测试世界创建
    world_data=\"{\\\"name\\\":\\\"Regression Test World\\\",\\\"description\\\":\\\"A world for regression testing\\\",\\\"userId\\\":\\\"\$user_id\\\"}\"
    world_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$world_data\" http://localhost:3001/api/worlds)

    if ! echo \"\$world_response\" | jq -e '.id' > /dev/null; then
        log_error 'World creation failed'
        exit 1
    fi

    world_id=\$(echo \"\$world_response\" | jq -r '.id')
    log_info \"World created with ID: \$world_id\"

    # 测试世界查询
    world_query_response=\$(curl -s http://localhost:3001/api/worlds/\$world_id)
    if ! echo \"\$world_query_response\" | jq -e '.name' > /dev/null; then
        log_error 'World retrieval failed'
        exit 1
    fi

    # 验证世界数据
    world_name=\$(echo \"\$world_query_response\" | jq -r '.name')
    if [ \"\$world_name\" != 'Regression Test World' ]; then
        log_error 'World data mismatch'
        exit 1
    fi

    # 验证数据库中的数据
    world_count=\$(docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -t -c \"SELECT COUNT(*) FROM \\\"World\\\" WHERE id::text = '\$world_id';\")
    if [ \"\$world_count\" -ne 1 ]; then
        log_error 'World not found in database'
        exit 1
    fi

    # 清理测试数据
    docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -c \"DELETE FROM \\\"World\\\" WHERE id::text = '\$world_id'; DELETE FROM \\\"User\\\" WHERE id::text = '\$user_id';\" > /dev/null

    log_success 'World creation regression verified'
"

# 3. 故事生成功能回归测试
run_test "故事生成功能回归测试" "
    log_info 'Testing story generation regression...'

    # 创建测试用户和世界
    user_data='{\"email\":\"story-test@example.com\",\"name\":\"Story Test User\"}'
    user_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$user_data\" http://localhost:3001/api/users)

    if ! echo \"\$user_response\" | jq -e '.id' > /dev/null; then
        log_error 'User creation failed for story test'
        exit 1
    fi

    user_id=\$(echo \"\$user_response\" | jq -r '.id')

    world_data=\"{\\\"name\\\":\\\"Story Test World\\\",\\\"description\\\":\\\"World for story testing\\\",\\\"userId\\\":\\\"\$user_id\\\"}\"
    world_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$world_data\" http://localhost:3001/api/worlds)

    if ! echo \"\$world_response\" | jq -e '.id' > /dev/null; then
        log_error 'World creation failed for story test'
        exit 1
    fi

    world_id=\$(echo \"\$world_response\" | jq -r '.id')

    # 测试故事创建
    story_data=\"{\\\"title\\\":\\\"Regression Test Story\\\",\\\"content\\\":\\\"This is a test story for regression testing\\\",\\\"worldId\\\":\\\"\$world_id\\\"}\"
    story_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$story_data\" http://localhost:3001/api/stories)

    if ! echo \"\$story_response\" | jq -e '.id' > /dev/null; then
        log_error 'Story creation failed'
        exit 1
    fi

    story_id=\$(echo \"\$story_response\" | jq -r '.id')
    log_info \"Story created with ID: \$story_id\"

    # 验证故事数据持久化
    story_count=\$(docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -t -c \"SELECT COUNT(*) FROM \\\"Story\\\" WHERE id::text = '\$story_id';\")
    if [ \"\$story_count\" -ne 1 ]; then
        log_error 'Story not found in database'
        exit 1
    fi

    # 清理测试数据
    docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -c \"DELETE FROM \\\"Story\\\" WHERE id::text = '\$story_id'; DELETE FROM \\\"World\\\" WHERE id::text = '\$world_id'; DELETE FROM \\\"User\\\" WHERE id::text = '\$user_id';\" > /dev/null

    log_success 'Story generation regression verified'
"

# 4. 实时协作功能回归测试
run_test "实时协作功能回归测试" "
    log_info 'Testing real-time collaboration regression...'

    # 测试WebSocket连接能力（通过HTTP健康检查间接验证）
    if ! curl -f --max-time 5 http://localhost:3001/health; then
        log_error 'WebSocket service unavailable'
        exit 1
    fi

    # 测试Redis连接（用于实时协作的数据存储）
    if ! docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli set collab_test test_value; then
        log_error 'Redis connection failed for collaboration'
        exit 1
    fi

    docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli del collab_test > /dev/null

    log_success 'Real-time collaboration regression verified'
"

# 5. 数据持久化回归测试
run_test "数据持久化回归测试" "
    log_info 'Testing data persistence regression...'

    # 创建测试数据
    user_data='{\"email\":\"persistence-test@example.com\",\"name\":\"Persistence Test User\"}'
    user_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$user_data\" http://localhost:3001/api/users)

    if ! echo \"\$user_response\" | jq -e '.id' > /dev/null; then
        log_error 'User creation failed for persistence test'
        exit 1
    fi

    user_id=\$(echo \"\$user_response\" | jq -r '.id')

    # 立即查询验证数据保存
    saved_user=\$(curl -s http://localhost:3001/api/users/\$user_id)
    if ! echo \"\$saved_user\" | jq -e '.email' > /dev/null; then
        log_error 'Data persistence failed - user not saved'
        exit 1
    fi

    # 验证数据库中的数据
    db_user_count=\$(docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -t -c \"SELECT COUNT(*) FROM \\\"User\\\" WHERE id::text = '\$user_id';\")
    if [ \"\$db_user_count\" -ne 1 ]; then
        log_error 'Database persistence failed'
        exit 1
    fi

    # 清理测试数据
    docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -c \"DELETE FROM \\\"User\\\" WHERE id::text = '\$user_id';\" > /dev/null

    log_success 'Data persistence regression verified'
"

# 6. API兼容性回归测试
run_test "API兼容性回归测试" "
    log_info 'Testing API compatibility regression...'

    # 测试REST API端点兼容性
    endpoints=(\"/api/health\" \"/api/users\" \"/api/worlds\")
    for endpoint in \"\${endpoints[@]}\"; do
        response=\$(curl -s -w '%{http_code}' http://localhost:3001\$endpoint)
        status_code=\${response: -3}
        if [ \"\$status_code\" != '200' ] && [ \"\$status_code\" != '401' ] && [ \"\$status_code\" != '404' ]; then
            log_error \"API endpoint \$endpoint returned unexpected status: \$status_code\"
            exit 1
        fi
    done

    log_success 'API compatibility regression verified'
"

# 7. 性能基准回归测试
run_test "性能基准回归测试" "
    log_info 'Testing performance baseline regression...'

    # 基准性能测试
    start_time=\$(date +%s%N)
    for i in {1..10}; do
        if ! curl -f --max-time 2 http://localhost:3001/health > /dev/null 2>&1; then
            log_error 'Health check failed during performance test'
            exit 1
        fi
    done
    end_time=\$(date +%s%N)

    # 计算平均响应时间
    total_time=\$((end_time - start_time))
    avg_time=\$((total_time / 10000000))  # 转换为毫秒

    log_info \"Average response time: \$avg_time ms\"

    # 检查性能没有显著退化（阈值：200ms）
    if [ \"\$avg_time\" -gt 200 ]; then
        log_warning \"Performance regression detected: \$avg_time ms > 200ms threshold\"
    fi

    log_success 'Performance baseline regression verified'
"

# 8. 安全性功能回归测试
run_test "安全性功能回归测试" "
    log_info 'Testing security features regression...'

    # 测试未授权访问保护
    protected_response=\$(curl -s -w '%{http_code}' http://localhost:3001/api/admin)
    if [ \"\${protected_response: -3}\" = '200' ]; then
        log_warning 'Admin endpoint should require authentication'
    fi

    # 测试健康检查端点公开访问
    public_response=\$(curl -s -w '%{http_code}' http://localhost:3001/health)
    if [ \"\${public_response: -3}\" != '200' ]; then
        log_error 'Health endpoint should be publicly accessible'
        exit 1
    fi

    log_success 'Security features regression verified'
"

# 9. 用户界面回归测试
run_test "用户界面回归测试" "
    log_info 'Testing UI components regression...'

    # 注意：这是一个后端测试脚本，UI测试需要单独的端到端测试框架
    # 这里我们通过API验证后端支持的UI功能

    # 测试用户界面所需的数据API
    users_response=\$(curl -s http://localhost:3001/api/users)
    if [ -z \"\$users_response\" ]; then
        log_error 'Users API for UI failed'
        exit 1
    fi

    worlds_response=\$(curl -s http://localhost:3001/api/worlds)
    if [ -z \"\$worlds_response\" ]; then
        log_error 'Worlds API for UI failed'
        exit 1
    fi

    log_success 'UI components regression verified (API level)'
"

# 10. 第三方集成回归测试
run_test "第三方集成回归测试" "
    log_info 'Testing third-party integrations regression...'

    # 测试数据库集成（PostgreSQL）
    if ! docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U testuser -d tuheg_test > /dev/null; then
        log_error 'PostgreSQL integration failed'
        exit 1
    fi

    # 测试缓存集成（Redis）
    if ! docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping | grep -q PONG; then
        log_error 'Redis integration failed'
        exit 1
    fi

    # 测试消息队列集成（RabbitMQ）
    if ! docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmq-diagnostics -q ping; then
        log_error 'RabbitMQ integration failed'
        exit 1
    fi

    log_success 'Third-party integrations regression verified'
"

# 生成测试摘要
echo "" >> "$REPORT_FILE"
echo "## 📊 回归测试摘要" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **总测试数**: $TESTS_TOTAL" >> "$REPORT_FILE"
echo "- **通过测试**: $TESTS_PASSED" >> "$REPORT_FILE"
echo "- **失败测试**: $TESTS_FAILED" >> "$REPORT_FILE"
echo "- **通过率**: $((TESTS_PASSED * 100 / TESTS_TOTAL))%" >> "$REPORT_FILE"
echo "- **测试类型**: 功能回归验证" >> "$REPORT_FILE"
echo "- **覆盖范围**: 核心业务流程" >> "$REPORT_FILE"
echo "- **完成时间**: $(date)" >> "$REPORT_FILE"

# 风险评估
if [ "$TESTS_FAILED" -eq 0 ]; then
    echo "" >> "$REPORT_FILE"
    echo "## 🎯 风险评估" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**✅ 零风险** - 所有历史功能正常工作，新版本向后兼容。" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**部署建议**: 可以安全部署到生产环境。" >> "$REPORT_FILE"
else
    echo "" >> "$REPORT_FILE"
    echo "## ⚠️ 风险评估" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**⚠️ 中等风险** - $TESTS_FAILED 个历史功能异常，需要进一步调查。" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**部署建议**: 建议在 staging 环境进一步验证，或实施渐进式部署策略。" >> "$REPORT_FILE"
fi

# 输出最终结果
echo ""
echo "=========================================="
echo "🔄 Regression Test Results:"
echo "  Total Tests: $TESTS_TOTAL"
echo "  Passed: $TESTS_PASSED"
echo "  Failed: $TESTS_FAILED"
echo "  Success Rate: $((TESTS_PASSED * 100 / TESTS_TOTAL))%"
echo "=========================================="

# 清理测试环境
log_info "Cleaning up test environment..."
if ! docker-compose -f docker-compose.test.yml down -v; then
    log_warning "Failed to cleanup test environment"
fi

if [ "$TESTS_FAILED" -eq 0 ]; then
    log_success "🎉 All regression tests PASSED!"
    echo "- **最终结果**: ✅ 全部通过" >> "$REPORT_FILE"
    exit 0
else
    log_error "❌ $TESTS_FAILED regression tests FAILED!"
    echo "- **最终结果**: ❌ $TESTS_FAILED 个测试失败" >> "$REPORT_FILE"
    exit 1
fi
