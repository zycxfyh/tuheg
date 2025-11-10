# @tuheg/abstractions

Core abstractions and interfaces for the Creation Ring system.

This package defines the contracts and interfaces that all domain services must implement. It serves as the abstraction layer between applications and domain implementations, enabling loose coupling and testability.

## Purpose

- Define service interfaces that domain implementations must fulfill
- Provide data transfer objects (DTOs) for inter-service communication
- Enable dependency injection and inversion of control
- Support multiple implementations of the same interface
- Facilitate testing through mock implementations

## Architecture

```
Applications (apps/*)
    ↓ (depend on interfaces)
Abstractions (this package)
    ↓ (implemented by)
Domain Services (packages/*-domain)
    ↓ (use)
Infrastructure (packages/infrastructure)
```

## Key Interfaces

### AI Services
- `IAiProvider`: Abstract AI provider interface
- `IConversationService`: Conversation management
- `IPromptManager`: Prompt template management

### Game Services
- `IGameCreationService`: Game world creation
- `IGameLogicService`: Game logic processing
- `IGameNarrativeService`: Narrative generation

### Infrastructure Services
- `ICacheService`: Caching abstraction
- `IEventBus`: Event-driven communication
- `IMessageQueue`: Message queuing abstraction

## Usage

```typescript
import { IAiProvider } from '@tuheg/abstractions';

// Inject interface, not implementation
constructor(
  @Inject('IAiProvider') private aiProvider: IAiProvider
) {}
```

## Development

```bash
# Build
nx build abstractions

# Test
nx test abstractions

# Lint
nx lint abstractions
```
