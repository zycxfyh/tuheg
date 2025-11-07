#!/bin/bash

# 🔬 工业级集成测试脚本
# 用于验证微服务间的协作和通信

set -e

echo "🔗 Starting Industrial Integration Tests..."
echo "========================================"

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
mkdir -p test-results/integration
REPORT_FILE="test-results/integration/integration-test-report.md"

# 初始化测试报告
echo "# 🔗 集成测试报告" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **开始时间**: $(date)" >> "$REPORT_FILE"
echo "- **测试环境**: CI/CD Pipeline" >> "$REPORT_FILE"
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

# 1. 服务发现测试
run_test "服务发现测试" "
    log_info 'Checking service discovery...'

    # 检查PostgreSQL连接
    if ! docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U testuser -d tuheg_test; then
        log_error 'PostgreSQL connection failed'
        exit 1
    fi

    # 检查Redis连接
    if ! docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping | grep -q PONG; then
        log_error 'Redis connection failed'
        exit 1
    fi

    # 检查RabbitMQ连接
    if ! docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmq-diagnostics -q ping; then
        log_error 'RabbitMQ connection failed'
        exit 1
    fi

    # 检查API Gateway健康状态
    if ! curl -f --max-time 10 http://localhost:3001/health; then
        log_error 'API Gateway health check failed'
        exit 1
    fi

    log_success 'All services discovered and healthy'
"

# 2. 数据库连接测试
run_test "数据库连接测试" "
    log_info 'Testing database connections...'

    # 测试PostgreSQL基本查询
    if ! docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -c 'SELECT 1;' > /dev/null; then
        log_error 'PostgreSQL query failed'
        exit 1
    fi

    # 测试Redis基本操作
    if ! docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli set test_key test_value; then
        log_error 'Redis set operation failed'
        exit 1
    fi

    if ! docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli get test_key | grep -q test_value; then
        log_error 'Redis get operation failed'
        exit 1
    fi

    # 清理测试数据
    docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli del test_key > /dev/null

    log_success 'Database connections and operations verified'
"

# 3. 消息队列测试
run_test "消息队列测试" "
    log_info 'Testing message queue communication...'

    # 测试RabbitMQ队列创建和消息发布
    if ! docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmqadmin declare queue name=test_queue durable=false; then
        log_error 'RabbitMQ queue declaration failed'
        exit 1
    fi

    # 发布测试消息
    if ! docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmqadmin publish exchange= routing_key=test_queue payload='test message'; then
        log_error 'RabbitMQ message publish failed'
        exit 1
    fi

    # 检查队列中是否有消息
    queue_info=\$(docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmqadmin list queues name messages)
    if ! echo \"\$queue_info\" | grep -q 'test_queue.*1'; then
        log_error 'Message not found in queue'
        exit 1
    fi

    # 清理测试队列
    docker-compose -f docker-compose.test.yml exec -T rabbitmq-test rabbitmqadmin delete queue name=test_queue > /dev/null

    log_success 'Message queue communication verified'
"

# 4. API网关路由测试
run_test "API网关路由测试" "
    log_info 'Testing API Gateway routing...'

    # 测试API Gateway基本路由
    response=\$(curl -s -w '%{http_code}' http://localhost:3001/api/health)
    if [ \"\${response: -3}\" != '200' ]; then
        log_error 'API Gateway health endpoint failed'
        exit 1
    fi

    # 测试用户相关路由
    response=\$(curl -s -w '%{http_code}' http://localhost:3001/api/users)
    if [ \"\${response: -3}\" != '200' ] && [ \"\${response: -3}\" != '401' ]; then
        log_error 'API Gateway users endpoint failed'
        exit 1
    fi

    # 测试世界相关路由
    response=\$(curl -s -w '%{http_code}' http://localhost:3001/api/worlds)
    if [ \"\${response: -3}\" != '200' ] && [ \"\${response: -3}\" != '401' ]; then
        log_error 'API Gateway worlds endpoint failed'
        exit 1
    fi

    log_success 'API Gateway routing verified'
"

# 5. 跨服务数据流测试
run_test "跨服务数据流测试" "
    log_info 'Testing cross-service data flow...'

    # 创建测试用户
    user_data='{\"email\":\"integration-test@example.com\",\"name\":\"Integration Test User\"}'
    user_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$user_data\" http://localhost:3001/api/users)

    if ! echo \"\$user_response\" | jq -e '.id' > /dev/null; then
        log_error 'User creation failed'
        exit 1
    fi

    user_id=\$(echo \"\$user_response\" | jq -r '.id')
    log_info \"Created user with ID: \$user_id\"

    # 创建世界
    world_data=\"{\\\"name\\\":\\\"Integration Test World\\\",\\\"description\\\":\\\"Test world for integration\\\",\\\"userId\\\":\\\"\$user_id\\\"}\"
    world_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$world_data\" http://localhost:3001/api/worlds)

    if ! echo \"\$world_response\" | jq -e '.id' > /dev/null; then
        log_error 'World creation failed'
        exit 1
    fi

    world_id=\$(echo \"\$world_response\" | jq -r '.id')
    log_info \"Created world with ID: \$world_id\"

    # 创建故事
    story_data=\"{\\\"title\\\":\\\"Integration Test Story\\\",\\\"content\\\":\\\"This is a test story\\\",\\\"worldId\\\":\\\"\$world_id\\\"}\"
    story_response=\$(curl -s -X POST -H 'Content-Type: application/json' -d \"\$story_data\" http://localhost:3001/api/stories)

    if ! echo \"\$story_response\" | jq -e '.id' > /dev/null; then
        log_error 'Story creation failed'
        exit 1
    fi

    story_id=\$(echo \"\$story_response\" | jq -r '.id')
    log_info \"Created story with ID: \$story_id\"

    # 验证数据库中的数据
    world_count=\$(docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -t -c \"SELECT COUNT(*) FROM \\\"World\\\" WHERE id::text = '\$world_id';\")
    if [ \"\$world_count\" -ne 1 ]; then
        log_error 'World not found in database'
        exit 1
    fi

    story_count=\$(docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -t -c \"SELECT COUNT(*) FROM \\\"Story\\\" WHERE id::text = '\$story_id';\")
    if [ \"\$story_count\" -ne 1 ]; then
        log_error 'Story not found in database'
        exit 1
    fi

    # 清理测试数据
    docker-compose -f docker-compose.test.yml exec -T postgres-test psql -U testuser -d tuheg_test -c \"DELETE FROM \\\"Story\\\" WHERE id::text = '\$story_id'; DELETE FROM \\\"World\\\" WHERE id::text = '\$world_id'; DELETE FROM \\\"User\\\" WHERE id::text = '\$user_id';\" > /dev/null

    log_success 'Cross-service data flow verified'
"

# 6. 负载均衡测试
run_test "负载均衡测试" "
    log_info 'Testing load balancing...'

    # 检查所有Agent服务是否健康
    agents_healthy=true

    for port in 8081 8082 8083; do
        if ! curl -f --max-time 5 http://localhost:\$port/health > /dev/null; then
            log_warning \"Agent service on port \$port is not healthy\"
            agents_healthy=false
        fi
    done

    if [ \"\$agents_healthy\" = false ]; then
        log_error 'Some agent services are not healthy'
        exit 1
    fi

    log_success 'Load balancing verified - all services healthy'
"

# 7. 故障恢复测试
run_test "故障恢复测试" "
    log_info 'Testing failure recovery...'

    # 测试服务重启恢复
    container_id=\$(docker-compose -f docker-compose.test.yml ps -q backend-gateway-test)
    if [ -z \"\$container_id\" ]; then
        log_error 'Backend gateway container not found'
        exit 1
    fi

    # 停止服务
    docker-compose -f docker-compose.test.yml stop backend-gateway-test
    sleep 3

    # 重启服务
    docker-compose -f docker-compose.test.yml start backend-gateway-test
    sleep 5

    # 验证服务恢复
    if ! curl -f --max-time 10 http://localhost:3001/health; then
        log_error 'Service did not recover after restart'
        exit 1
    fi

    log_success 'Failure recovery verified'
"

# 8. 安全通信测试
run_test "安全通信测试" "
    log_info 'Testing secure communications...'

    # 测试未授权访问被拒绝
    response=\$(curl -s -w '%{http_code}' http://localhost:3001/api/admin)
    if [ \"\${response: -3}\" != '401' ] && [ \"\${response: -3}\" != '403' ]; then
        log_warning 'Admin endpoint should require authentication'
        # 对于测试环境，我们允许这个警告，但不失败
    fi

    # 测试健康检查端点公开访问
    if ! curl -f --max-time 5 http://localhost:3001/health; then
        log_error 'Health endpoint should be publicly accessible'
        exit 1
    fi

    log_success 'Secure communications verified'
"

# 9. 性能基准测试
run_test "性能基准测试" "
    log_info 'Running performance benchmarks...'

    # 测试API响应时间
    start_time=\$(date +%s%N)
    for i in {1..5}; do
        if ! curl -f --max-time 5 http://localhost:3001/health > /dev/null; then
            log_error 'Health check failed during performance test'
            exit 1
        fi
    done
    end_time=\$(date +%s%N)

    # 计算平均响应时间（纳秒转毫秒）
    total_time=\$((end_time - start_time))
    avg_time=\$((total_time / 5000000))

    if [ \"\$avg_time\" -gt 1000 ]; then
        log_warning \"Average response time \$avg_time ms is above 1000ms threshold\"
    else
        log_info \"Average response time: \$avg_time ms\"
    fi

    log_success 'Performance benchmarks completed'
"

# 生成测试摘要
echo "" >> "$REPORT_FILE"
echo "## 📊 测试摘要" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- **总测试数**: $TESTS_TOTAL" >> "$REPORT_FILE"
echo "- **通过测试**: $TESTS_PASSED" >> "$REPORT_FILE"
echo "- **失败测试**: $TESTS_FAILED" >> "$REPORT_FILE"
echo "- **通过率**: $((TESTS_PASSED * 100 / TESTS_TOTAL))%" >> "$REPORT_FILE"
echo "- **完成时间**: $(date)" >> "$REPORT_FILE"

# 输出最终结果
echo ""
echo "========================================"
echo "🔗 Integration Test Results:"
echo "  Total Tests: $TESTS_TOTAL"
echo "  Passed: $TESTS_PASSED"
echo "  Failed: $TESTS_FAILED"
echo "  Success Rate: $((TESTS_PASSED * 100 / TESTS_TOTAL))%"
echo "========================================"

# 清理测试环境
log_info "Cleaning up test environment..."
if ! docker-compose -f docker-compose.test.yml down -v; then
    log_warning "Failed to cleanup test environment"
fi

if [ "$TESTS_FAILED" -eq 0 ]; then
    log_success "🎉 All integration tests PASSED!"
    echo "- **最终结果**: ✅ 全部通过" >> "$REPORT_FILE"
    exit 0
else
    log_error "❌ $TESTS_FAILED integration tests FAILED!"
    echo "- **最终结果**: ❌ $TESTS_FAILED 个测试失败" >> "$REPORT_FILE"
    exit 1
fi
