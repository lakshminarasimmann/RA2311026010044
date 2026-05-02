# Notification System Design

## 1. Architecture Overview

The notification system follows a **layered microservice architecture** with centralized logging, decoupled processing, and scalable delivery pipelines.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                                │
│                    (Web / Mobile / Third-party APIs)                          │
└─────────────────────────────┬────────────────────────────────────────────────┘
                              │  HTTP / WebSocket
                              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY / LOAD BALANCER                          │
│                    (Rate limiting, Auth, Request routing)                     │
└─────────────────────────────┬────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth Service   │ │  Notification   │ │  Vehicle Maint. │
│                 │ │  Service        │ │  Scheduler      │
│ • Register      │ │ • Create        │ │ • Add Vehicle   │
│ • Get Token     │ │ • List          │ │ • Schedule Svc  │
│ • Refresh       │ │ • Mark Read     │ │ • Complete Svc  │
│ • Validate      │ │ • Preferences   │ │ • Upcoming      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │         ┌─────────┴─────────┐         │
         │         ▼                   ▼         │
         │  ┌─────────────┐   ┌──────────────┐  │
         │  │ Message     │   │ Delivery     │  │
         │  │ Queue       │   │ Workers      │  │
         │  │ (In-Memory) │   │              │  │
         │  │             │──▶│ • Email      │  │
         │  │ • Priority  │   │ • SMS        │  │
         │  │ • Retry     │   │ • Push       │  │
         │  │ • DLQ       │   │ • In-App     │  │
         │  └─────────────┘   └──────────────┘  │
         │                                       │
         └──────────────┬───────────────────────┘
                        ▼
         ┌──────────────────────────┐
         │  Centralized Logging     │
         │  Middleware              │
         │                          │
         │  Log(stack, level,       │
         │      package, message)   │
         │                          │
         │  → Console (local)       │
         │  → External API (remote) │
         └──────────────────────────┘
```

---

## 2. Logging Flow

The logging middleware is integrated at every architectural layer to provide full observability.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  HTTP Request │────▶│  Route Layer │────▶│  Controller  │
│  Arrives      │     │              │     │  (Handler)   │
└──────────────┘     │  Log: route  │     │  Log: handler│
                     └──────┬───────┘     └──────┬───────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  Service     │     │  Repository  │
                     │  Layer       │     │  (Data)      │
                     │  Log: service│     │  Log: repo   │
                     └──────┬───────┘     └──────┬───────┘
                            │                     │
                            ▼                     ▼
                     ┌─────────────────────────────────┐
                     │     Logging Middleware           │
                     │                                  │
                     │  1. Validate (stack/level/pkg)   │
                     │  2. Attach ISO timestamp         │
                     │  3. Console output (sync)        │
                     │  4. Remote API POST (async)      │
                     │     → Fire-and-forget            │
                     │     → Retry: none (non-blocking) │
                     │     → Timeout: 5s                │
                     └─────────────────────────────────┘
```

### Log Levels Usage:

| Level   | When to Use                                          | Example                                    |
|---------|------------------------------------------------------|--------------------------------------------|
| `debug` | Detailed tracing for development                     | `"Fetching all vehicles — count: 5"`       |
| `info`  | Normal operations, request handling                  | `"Create vehicle API called"`              |
| `warn`  | Recoverable issues, fallback behaviour               | `"Vehicle not found: abc123"`              |
| `error` | Failures that affect a single operation              | `"Invalid vehicle ID provided"`            |
| `fatal` | System-level failures requiring immediate attention  | `"Database connection failed"`             |

---

## 3. API Design

### 3.1 Auth Service APIs

| Method | Endpoint                           | Description             |
|--------|------------------------------------|-------------------------|
| POST   | `/evaluation-service/register`     | Register new client     |
| POST   | `/evaluation-service/auth`         | Obtain access token     |

### 3.2 Vehicle Maintenance APIs

| Method | Endpoint                        | Description                 | Auth     |
|--------|---------------------------------|-----------------------------|----------|
| GET    | `/health`                       | Service health check        | No       |
| POST   | `/vehicles`                     | Create a new vehicle        | Optional |
| GET    | `/vehicles`                     | List all vehicles           | Optional |
| POST   | `/maintenance`                  | Schedule maintenance        | Optional |
| GET    | `/maintenance/upcoming`         | Get upcoming services       | Optional |
| PUT    | `/maintenance/:id/complete`     | Mark service completed      | Optional |

### 3.3 Notification APIs (Proposed)

| Method | Endpoint                        | Description                        | Auth     |
|--------|---------------------------------|------------------------------------|----------|
| POST   | `/notifications`                | Create/send a notification         | Required |
| GET    | `/notifications`                | List notifications for a user      | Required |
| GET    | `/notifications/:id`            | Get notification details           | Required |
| PUT    | `/notifications/:id/read`       | Mark notification as read          | Required |
| DELETE | `/notifications/:id`            | Delete a notification              | Required |
| GET    | `/notifications/unread/count`   | Get unread count                   | Required |
| PUT    | `/preferences`                  | Update notification preferences    | Required |

### 3.4 Response Format Standard

All APIs follow a consistent JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "count": 10,
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## 4. Scalability Considerations

### 4.1 Horizontal Scaling

```
                    ┌──────────────────┐
                    │  Load Balancer   │
                    │  (Nginx / ALB)   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Instance │  │ Instance │  │ Instance │
        │    #1    │  │    #2    │  │    #3    │
        └────┬─────┘  └────┬─────┘  └────┬─────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                   ┌─────────────────┐
                   │  Shared State   │
                   │  (Redis / DB)   │
                   └─────────────────┘
```

**Strategies:**

1. **Stateless Services**: All application instances are stateless. In-memory stores would be replaced with Redis or PostgreSQL for production multi-instance deployments.

2. **Message Queue**: Notification delivery should be decoupled via a message queue (e.g., RabbitMQ, AWS SQS) to handle burst traffic without overwhelming delivery providers.

3. **Database Sharding**: For high-volume notification data, shard by `userId` to distribute read/write load evenly.

4. **Caching**: Use Redis for:
   - Unread notification counts (frequently queried)
   - User preference lookups
   - Rate limiting counters

5. **Connection Pooling**: Use connection pools for database and external API connections to prevent resource exhaustion.

### 4.2 Performance Optimizations

| Area               | Strategy                                              |
|--------------------|-------------------------------------------------------|
| Logging            | Async fire-and-forget with 5s timeout                 |
| API Responses      | Pagination for list endpoints                         |
| Delivery           | Worker pool with configurable concurrency             |
| Database           | Indexed queries on `vehicleId`, `status`, `scheduledDate` |
| Static Content     | CDN for web notification assets                       |

### 4.3 Auto-Scaling Rules

- **CPU > 70%** for 5 minutes → Scale up
- **CPU < 30%** for 10 minutes → Scale down
- **Queue depth > 1000** → Add delivery workers
- Minimum instances: 2 (for high availability)

---

## 5. Error Handling Strategy

### 5.1 Error Classification

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Categories                          │
├──────────────┬────────────────────┬─────────────────────────┤
│  Client      │  Service           │  Infrastructure         │
│  (4xx)       │  (5xx)             │  (Fatal)                │
├──────────────┼────────────────────┼─────────────────────────┤
│ • Validation │ • Business logic   │ • DB connection lost    │
│ • Auth       │ • Timeout          │ • Memory exhaustion     │
│ • Not found  │ • External API     │ • Disk full             │
│ • Rate limit │ • Data corruption  │ • Network partition     │
└──────────────┴────────────────────┴─────────────────────────┘
```

### 5.2 Error Handling Flow

```
  Request
     │
     ▼
  ┌──────────────┐   Validation Error    ┌──────────────┐
  │ Route Layer  │──────────────────────▶│ 400 Response │
  └──────┬───────┘                       └──────────────┘
         │
         ▼
  ┌──────────────┐   Business Error      ┌──────────────┐
  │ Controller   │──────────────────────▶│ 4xx/5xx Resp │
  └──────┬───────┘                       └──────────────┘
         │
         ▼
  ┌──────────────┐   Data Error          ┌──────────────┐
  │ Service      │──────────────────────▶│ Logged +     │
  └──────┬───────┘                       │ Propagated   │
         │                               └──────────────┘
         ▼
  ┌──────────────┐   Unhandled           ┌──────────────┐
  │ Repository   │──────────────────────▶│ Global Error │
  └──────────────┘                       │ Handler      │
                                         │ (500 + Log)  │
                                         └──────────────┘
```

### 5.3 Error Handling Principles

1. **Fail Fast**: Validate inputs at the earliest layer (controller). Don't let bad data propagate.

2. **Graceful Degradation**: If the remote logging API is down, the application continues to function with console-only logging.

3. **Structured Errors**: All errors follow a consistent JSON format with `success: false` and a human-readable `error` message.

4. **No Stack Traces in Production**: Stack traces are only included in responses when `NODE_ENV !== "production"`.

5. **Crash Recovery**: Uncaught exceptions and unhandled rejections are caught at the process level, logged as `fatal`, and trigger a graceful shutdown.

6. **Idempotency**: The `completeMaintenance` endpoint is idempotent — completing an already-completed record returns a 409 Conflict, not a 500.

### 5.4 Retry Strategy (Notification Delivery)

| Attempt | Delay    | Action                          |
|---------|----------|---------------------------------|
| 1       | 0s       | Immediate delivery attempt      |
| 2       | 30s      | First retry                     |
| 3       | 2min     | Second retry                    |
| 4       | 15min    | Third retry                     |
| 5       | 1hr      | Final retry                     |
| —       | —        | Move to Dead Letter Queue (DLQ) |

### 5.5 Monitoring & Alerting

| Metric                      | Threshold     | Action              |
|-----------------------------|---------------|----------------------|
| Error rate (5xx)            | > 1%          | Alert on-call        |
| Response time (p99)         | > 2s          | Investigate          |
| Log API failures            | > 10/min      | Alert DevOps         |
| DLQ depth                   | > 100         | Alert + investigate  |
| Unhandled rejections        | Any           | Page immediately     |

---

## 6. Security Considerations

1. **Environment Variables**: All secrets (tokens, client IDs) stored in `.env` — never hardcoded.
2. **Bearer Token Auth**: External logging API uses `Authorization: Bearer <token>`.
3. **Input Sanitization**: All user inputs are validated and trimmed before processing.
4. **Rate Limiting**: Recommended for production deployment via API gateway.
5. **HTTPS**: All external API communication should use TLS in production.

---

## 7. Technology Stack

| Component          | Technology                      |
|--------------------|--------------------------------|
| Runtime            | Node.js (v18+)                  |
| Framework          | Express.js                      |
| Logging            | Custom middleware (built-in http)|
| Data Store         | In-memory (Map) / Redis / PostgreSQL |
| Message Queue      | In-memory / RabbitMQ / AWS SQS  |
| Load Balancer      | Nginx / AWS ALB                 |
| Monitoring         | Custom logging + external API   |
| Container          | Docker (recommended)            |
| Orchestration      | Kubernetes / ECS (recommended)  |
