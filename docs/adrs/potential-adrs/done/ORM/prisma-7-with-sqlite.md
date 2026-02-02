# Potential ADR: Prisma 7 with SQLite for Local Storage

## Context

The Sentinel backend runs as a local server for the Electron app. A full database server like PostgreSQL would add complexity and resource overhead. The application needs a reliable, embedded database solution.

Prisma 7 was released in January 2026 with significant improvements including Rust-free implementation and multi-file schema support.

## Decision

Adopt **Prisma 7** with **SQLite** (via better-sqlite3) as the ORM and database for local storage.

### Technology Stack

- **ORM**: Prisma 7.3.0+
- **Database**: SQLite (better-sqlite3)
- **TypeScript**: 5.4+ (minimum for Prisma 7)
- **Node.js**: 20.19+ / 22.12+ / 24+ (recommended: 24.x)

### Schema Definition

Prisma schema at `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Key Models

1. **RecentProject**: Recent RPG Maker MZ projects
2. **UserPreferences**: Global user settings
3. **SimulationHistoryEntry**: TTK simulation history with status tracking

### Repository Pattern

Repositories use mappers for domain ↔ persistence conversion:

```typescript
export class SimulationHistoryPrismaRepository implements ISimulationHistoryRepository {
  async findById(id: string): Promise<SimulationHistoryEntry | null> {
    const model = await this.prisma.simulationHistoryEntry.findFirst({ where: { id } });
    return model ? SimulationHistoryMapper.toDomain(model) : null;
  }

  async create(entry: SimulationHistoryEntry): Promise<void> {
    const input = SimulationHistoryMapper.toPersistence(entry);
    await this.prisma.simulationHistoryEntry.create({ data: input });
  }
}
```

## Consequences

**Positive:**
- Zero-configuration embedded database
- Type-safe database client
- Excellent TypeScript integration
- Migrations built-in
- Prisma Studio for data inspection
- Prisma 7 removes Rust dependency (faster installs)

**Negative:**
- SQLite has limited concurrency (single writer)
- Not suitable for distributed systems
- Limited to local Electron app use case
- Cannot use advanced features like PostgreSQL's AGE/pgvector

## Alternatives Considered

1. **PostgreSQL** (ADR-DB-001): More powerful but requires separate server; overkill for local app
2. **TypeORM**: Less type-safe, more boilerplate
3. **Drizzle ORM**: Newer, less mature ecosystem
4. **LowDB**: JSON-based, no migrations, less type-safe

## Context Note

This decision is specific to the **local Electron backend**. The RAG system (different component) uses PostgreSQL with AGE/pgvector as documented in ADR-DB-001.

## References

- [Prisma 7 Documentation](https://www.prisma.io/docs)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- Epic: `planos/001-kick-start/epico-kickstart.md`
