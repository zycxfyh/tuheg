# Centralized Configuration Management

This directory provides centralized, type-safe configuration management for the entire monorepo.

## Overview

The configuration system consists of:

- **Environment Schema** (`env.schema.ts`) - Zod schema for validating all environment variables
- **Configuration Service** (`configuration.service.ts`) - Type-safe service for accessing configuration values
- **Config Module** (`config.module.ts`) - NestJS module that provides configuration globally
- **Environment Loader** (`env-loader.ts`) - Advanced .env file loading with expansion support

## Features

### Type Safety
All environment variables are validated at startup using Zod schemas, preventing runtime errors from misconfigurations.

### Centralized Management
All apps use the same configuration system, eliminating inconsistencies between services.

### Environment Variable Expansion
Supports variable interpolation like `${DATABASE_HOST}:${DATABASE_PORT}` in .env files.

### Multiple Environment Support
Supports `.env`, `.env.local`, `.env.{environment}`, and `.env.{environment}.local` files.

## Usage

### Basic Usage

```typescript
import { ConfigurationService } from '@tuheg/common-backend'

@Injectable()
export class MyService {
  constructor(private readonly config: ConfigurationService) {}

  getDatabaseUrl(): string {
    return this.config.databaseUrl
  }

  getPort(): number {
    return this.config.backendGatewayPort
  }

  isDev(): boolean {
    return this.config.isDevelopment
  }
}
```

### Available Configuration Properties

#### Database
- `databaseUrl`: Database connection URL
- `dbConnectionLimit`: Connection pool limit
- `dbPoolTimeout`: Pool timeout in seconds
- `dbIdleTimeout`: Idle timeout in seconds

#### Redis
- `redisUrl`: Redis connection URL (optional)
- `redisHost`: Redis host (default: localhost)
- `redisPort`: Redis port (default: 6379)

#### Encryption
- `encryptionKey`: Encryption key (32+ chars)
- `encryptionUseSalt`: Whether to use salt
- `encryptionAlgorithm`: Algorithm (default: aes-256-gcm)

#### Monitoring
- `sentryDsn`: Sentry DSN (optional)
- `sentryEnvironment`: Environment name
- `sentryTracesSampleRate`: Tracing sample rate

#### AI Providers
- `fallbackApiKey`: Fallback API key
- `fallbackModelId`: Fallback model ID
- `fallbackBaseUrl`: Fallback base URL

#### Application
- `nodeEnv`: Environment (development/production/test)
- `port`: Application port (deprecated, use service-specific ports)
- `corsOrigin`: CORS origin

#### Vector Database
- `qdrantUrl`: Qdrant URL
- `qdrantApiKey`: Qdrant API key

#### Authentication
- `clerkSecretKey`: Clerk secret key
- `clerkPublishableKey`: Clerk publishable key
- `clerkWebhookSecretKey`: Clerk webhook secret key

#### Message Queue
- `rabbitmqUrl`: RabbitMQ connection URL

#### JWT (Legacy)
- `jwtSecret`: JWT signing secret
- `jwtExpirationSeconds`: Token expiration time

#### Service Ports
- `backendGatewayPort`: Backend gateway port
- `creationAgentHttpPort`: Creation agent port
- `logicAgentHttpPort`: Logic agent port
- `narrativeAgentHttpPort`: Narrative agent port

### Environment Files

The system loads environment files in this order:

1. `.env` - Base configuration
2. `.env.local` - Local overrides (not committed)
3. `.env.{environment}` - Environment-specific config
4. `.env.{environment}.local` - Environment-specific local overrides

Example `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET_KEY="whsec_..."

# Message Queue
RABBITMQ_URL="amqp://localhost:5672"

# Monitoring
SENTRY_DSN="https://..."
SENTRY_ENVIRONMENT="development"
```

### Migration Guide

If your app currently uses `ConfigModule.forRoot()`, replace it with:

```typescript
// Before
import { ConfigModule } from '@nestjs/config'

// After
import { ConfigModule } from '@tuheg/common-backend'

@Module({
  imports: [ConfigModule], // Now uses centralized config
})
export class MyModule {}
```

Replace direct `ConfigService` usage with `ConfigurationService`:

```typescript
// Before
constructor(private readonly config: ConfigService) {}

getPort() {
  return this.config.get('PORT', 3000)
}

// After
constructor(private readonly config: ConfigurationService) {}

getPort() {
  return this.config.backendGatewayPort // Type-safe, validated
}
```

## Validation

All environment variables are validated at application startup. If validation fails, the application will exit with a detailed error message showing which variables are missing or invalid.

## Best Practices

1. **Use the ConfigurationService** instead of direct ConfigService access
2. **Set appropriate defaults** in the schema for optional values
3. **Use environment-specific files** for different deployment environments
4. **Never commit secrets** to version control (use .env.local files)
5. **Document required environment variables** in your service README
