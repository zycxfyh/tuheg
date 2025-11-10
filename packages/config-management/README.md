# @tuheg/config-management

Configuration management and environment handling for the Creation Ring system.

This package provides centralized configuration management with type safety, validation, and environment variable handling.

## Features

- **Type-safe Configuration**: Zod-based validation schemas
- **Environment Loading**: Multi-file environment loading with expansion
- **Configuration Service**: Injectable configuration service
- **Validation**: Runtime configuration validation
- **Hot Reload**: Configuration change watching

## Usage

```typescript
import { ConfigModule, ConfigService } from '@tuheg/config-management';

@Module({
  imports: [ConfigModule],
  providers: [YourService],
})
export class YourModule {
  constructor(private config: ConfigService) {}

  async someMethod() {
    const dbConfig = this.config.getDatabaseConfig();
    const aiConfig = this.config.getAiProvidersConfig();
  }
}
```

## Environment Variables

The package loads environment variables from multiple files in order:

1. `.env.local` (highest priority)
2. `.env.development`, `.env.test`, `.env.production` (based on NODE_ENV)
3. `.env` (lowest priority)

## Configuration Validation

Use Zod schemas for runtime configuration validation:

```typescript
import { validateConfig, databaseConfigSchema } from '@tuheg/config-management';

const dbConfig = validateConfig(databaseConfigSchema, configData);
```

## Development

```bash
# Build
nx build config-management

# Test
nx test config-management

# Lint
nx lint config-management
```
