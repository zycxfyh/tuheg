-- 测试数据库初始化脚本
-- 用于集成测试和回归测试

-- 创建测试数据库结构
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 世界表
CREATE TABLE IF NOT EXISTS "World" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    userId UUID REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 故事表
CREATE TABLE IF NOT EXISTS "Story" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    worldId UUID REFERENCES "World"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_world_user_id ON "World"(userId);
CREATE INDEX IF NOT EXISTS idx_story_world_id ON "Story"(worldId);

-- 插入测试数据
INSERT INTO "User" (id, email, name) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO "World" (id, name, description, userId) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Test World', 'A test world for integration testing', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Story" (id, title, content, worldId) VALUES
    ('550e8400-e29b-41d4-a716-446655440002', 'Test Story', 'This is a test story content for integration testing.', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;
