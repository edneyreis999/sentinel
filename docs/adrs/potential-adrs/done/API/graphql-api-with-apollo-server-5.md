# Potential ADR: GraphQL API with Apollo Server 5

## Context

The Sentinel backend requires a flexible API for the Electron main process to consume. REST APIs can lead to over-fetching or under-fetching data. The project needs real-time capabilities for simulation status updates.

Apollo Server 4 reaches End-of-Life on 2026-01-26, making Apollo Server 5 the current stable release.

## Decision

Adopt **GraphQL** with **Apollo Server 5** as the API protocol for the Sentinel backend.

### Technology Stack

- **GraphQL Server**: Apollo Server 5.3.0
- **NestJS GraphQL**: @nestjs/graphql@^12.2.0
- **Subscriptions**: graphql-ws@^6.0.0 (WebSocket)
- **Node.js**: 20.x+ (recommended: 24.x LTS)

### GraphQL Features

1. **Queries**: Data retrieval (`recentProjects`, `userPreferences`, `simulationHistory`)
2. **Mutations**: Data modifications (`addRecentProject`, `updateUserPreferences`, `createSimulationHistoryEntry`)
3. **Subscriptions**: Real-time updates via WebSocket
   - `userPreferencesChanged`: Preference updates
   - `simulationStatusChanged`: Simulation status changes
   - `simulationHistoryChanged`: History modifications

### Subscription Implementation

Uses PubSub pattern for real-time notifications:

```typescript
// In use case
this.pubSub.publish('simulationStatusChanged', {
  simulationStatusChanged: SimulationHistoryEntryOutputDTO.fromDomain(entry),
});

// In resolver
@Subscription(() => SimulationHistoryEntryOutputDTO)
simulationStatusChanged(): AsyncIterator<any> {
  return this.pubSub.asyncIterator(['simulationStatusChanged']);
}
```

## Consequences

**Positive:**
- Clients request exactly what they need (no over/under-fetching)
- Type-safe API with TypeScript
- Real-time capabilities built-in
- Self-documenting (GraphQL schema + Apollo Sandbox)
- Single endpoint for all operations

**Negative:**
- More complex than REST for simple CRUD
- Caching requires additional setup (e.g., DataLoader)
- Initial learning curve
- Need to handle N+1 query problems

## Alternatives Considered

1. **REST API** (ADR-001): Simpler but less flexible, no built-in real-time
2. **tRPC**: TypeScript-specific but requires shared types between frontend/backend
3. **GraphQL Yoga**: Alternative to Apollo, but Apollo has better NestJS integration

## Impact on Existing ADRs

- **ADR-API-001 (REST API Protocol)**: This decision supersedes or coexists with the REST-only approach. Consider marking as "Superseded" or documenting hybrid approach.

## References

- [Apollo Server 5 Documentation](https://www.apollographql.com/docs/apollo-server)
- [Apollo Server 4 EOL Notice](https://www.apollographql.com/docs/apollo-server/migration)
- Epic: `planos/001-kick-start/epico-kickstart.md`
