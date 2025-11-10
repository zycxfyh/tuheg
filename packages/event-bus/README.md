# @tuheg/event-bus

Event-driven architecture implementation for the Creation Ring system.

This package provides a complete event-driven architecture with publish-subscribe pattern, event sourcing, CQRS support, and Saga pattern for complex business transactions.

## Features

- **Event Publishing & Subscription**: RxJS-based reactive event handling
- **Event Sourcing**: Complete event store with replay capabilities
- **CQRS Support**: Command-Query Responsibility Segregation
- **Saga Pattern**: Complex transaction management
- **Event Decorators**: Type-safe event and handler definitions
- **Middleware Support**: Extensible event processing pipeline
- **Type Safety**: Full TypeScript support with decorators

## Architecture

```
Event Bus Architecture
├── EventBusService          # Core event bus implementation
├── Event Publishers         # Publish events to the bus
├── Event Subscribers        # Subscribe to event streams
├── Event Handlers          # Process specific events
├── Event Store            # Persistent event storage
├── Saga Manager           # Complex transaction orchestration
└── Middleware Pipeline    # Event processing pipeline
```

## Usage

### Basic Event Publishing

```typescript
import { EventBusService } from '@tuheg/event-bus';

@Injectable()
export class OrderService {
  constructor(private eventBus: EventBusService) {}

  async createOrder(orderData: any) {
    // Create order logic...

    // Publish domain event
    await this.eventBus.publish({
      eventId: 'evt_' + Date.now(),
      eventType: 'OrderCreated',
      timestamp: new Date(),
      data: { orderId, customerId, amount },
    });
  }
}
```

### Event Handlers

```typescript
import { EventHandler, HandlesEvent } from '@tuheg/event-bus';

@EventHandler()
@HandlesEvent('OrderCreated')
export class OrderCreatedHandler {
  async handle(event: any) {
    // Process order created event
    console.log('Order created:', event.data.orderId);
  }
}
```

### CQRS with Commands and Queries

```typescript
// Command
@Command('CreateOrder')
export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: OrderItem[]
  ) {}
}

// Command Handler
@CommandHandler('CreateOrder')
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  async execute(command: CreateOrderCommand): Promise<string> {
    // Create order and return ID
    return 'order-123';
  }
}

// Query
@Query('GetOrder')
export class GetOrderQuery {
  constructor(public readonly orderId: string) {}
}

// Query Handler
@QueryHandler('GetOrder')
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, Order> {
  async query(query: GetOrderQuery): Promise<Order> {
    // Return order data
    return { id: query.orderId, status: 'created' };
  }
}
```

### Saga Pattern

```typescript
@Saga()
export class OrderSaga {
  @SagaStep('OrderCreated')
  async onOrderCreated(event: any) {
    // Reserve inventory, charge payment, etc.
  }

  @SagaCompensation('OrderCreated')
  async compensateOrderCreated(event: any) {
    // Cancel inventory reservation, refund payment, etc.
  }
}
```

## Module Setup

```typescript
import { EventBusModule } from '@tuheg/event-bus';

@Module({
  imports: [
    EventBusModule.forRoot({
      enableEventStore: true,
      enableEventReplay: true,
    }),
  ],
})
export class AppModule {}
```

## Development

```bash
# Build
nx build event-bus

# Test
nx test event-bus

# Lint
nx lint event-bus
```

## Advanced Features

- **Event Replay**: Rebuild state from event history
- **Event Versioning**: Handle event schema evolution
- **Dead Letter Queue**: Handle failed event processing
- **Event Filtering**: Selective event processing
- **Metrics & Monitoring**: Built-in observability
- **Distributed Events**: Cross-service event communication
