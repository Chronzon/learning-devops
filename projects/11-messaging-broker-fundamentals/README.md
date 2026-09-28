# Session 11 — Messaging & Broker Fundamentals

## Goal

Understand asynchronous messaging and compare common broker models using hands-on labs with RabbitMQ, Kafka, and NATS/JetStream, plus Azure Service Bus concepts.

## RabbitMQ

Mental model:

```text
Producer → Exchange → Queue → Consumer
```

Covered:

- Direct, Fanout, and Topic exchanges
- Routing keys and bindings
- Durable queues and persistent messages
- Manual ACK and redelivery
- Competing consumers and `prefetch`
- Dead-letter queues
- RabbitMQ on Kubernetes with StatefulSet and PVC

Key lesson:

A message delivered to a consumer remains unacknowledged until processing succeeds. If the consumer disappears before ACK, RabbitMQ can requeue and redeliver it.

## Kafka

Mental model:

```text
Producer → Topic → Partitions
                     ↓
              Consumer Group
                     ↓
                  Consumers
```

Covered:

- Topics and partitions
- Message keys and per-partition ordering
- Consumer groups
- Partition assignment and rebalancing
- Offsets and consumer lag
- Replay using offset reset
- Persistent event history

Important rules:

- One partition can be assigned to only one consumer within the same consumer group at a time.
- One consumer may own multiple partitions.
- More consumers than partitions means some consumers remain idle.
- Different consumer groups maintain independent offsets and can independently read the same topic.

## Core NATS

Mental model:

```text
Publisher → Subject → Subscriber
```

Covered:

- Subject-based messaging
- Wildcards: `*` and `>`
- Broadcast subscriptions
- Queue groups for competing subscribers
- Request/Reply

Core NATS is useful for lightweight, low-latency live messaging when persistence and replay are not required.

## JetStream

JetStream adds persistence and durable messaging capabilities to NATS.

```text
Publisher → Subject → Stream → Consumer
```

Covered:

- File-backed Streams
- Kubernetes PVC persistence
- Durable consumers
- Explicit ACK
- AckWait and redelivery
- Independent consumer state
- Replay from retained Stream history

Important distinction:

```text
Stream sequence
= identity/order of stored messages

Consumer sequence
= number of deliveries made to that consumer
```

A redelivery can therefore increase the consumer sequence while referencing the same stream sequence.

## Azure Service Bus

Concepts covered:

```text
Producer → Queue → Consumer
```

and:

```text
Producer → Topic → Subscription → Consumer
```

Important features:

- Peek-Lock
- Complete / Abandon
- Redelivery
- Dead-Letter Queue
- Sessions
- Managed Azure messaging

Peek-Lock temporarily reserves a message for a receiver. Successful processing uses `Complete`; failure, lock expiration, or `Abandon` can make the message available again.

Sessions provide ordered/session-aware processing and should not be confused with idempotency.

## Broker Comparison

```text
RabbitMQ
→ work queues, routing, reliable task processing

Kafka
→ retained event log, replay, high-throughput streaming

Core NATS
→ lightweight low-latency live messaging

JetStream
→ NATS with persistence, ACK, redelivery, and replay

Azure Service Bus
→ managed Azure queue/topic messaging
```

## Key Reliability Lesson

At-least-once delivery means duplicate delivery is possible.

Reliable consumers should therefore combine broker acknowledgements with idempotent application logic.

## Session Status

Complete. The learner performed the hands-on labs manually; Azure Service Bus coverage was conceptual.

The learner confirmed that the `session-11` namespace was cleaned up after the labs. The reusable `kind` cluster is retained for future sessions.
