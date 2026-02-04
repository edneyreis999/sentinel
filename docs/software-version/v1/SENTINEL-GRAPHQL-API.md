# Sentinel GraphQL API - Guia de Integração Frontend

> Documento técnico para integração do frontend Electron com a API GraphQL do Sentinel.

## Conexão

```
HTTP:      http://localhost:4000/graphql
Playground: http://localhost:4000/graphql (habilitado)
```

**Porta configurável via `PORT` env var (padrão: 4000 em Docker, fallback 3000 local).**

Sem autenticação (aplicação desktop single-user).

> **IMPORTANTE:** Subscriptions (WebSocket) estão definidas no schema mas **NÃO estão habilitadas** no backend atual. Ver seção "Subscriptions" para detalhes.

---

## Setup Apollo Client (Electron/React)

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

> **Nota:** Quando subscriptions forem habilitadas no backend, será necessário adicionar `graphql-ws` e configurar split link. Ver seção "Subscriptions (NÃO HABILITADAS)".

---

## Módulos de Domínio

### 1. RecentProjects

Gerencia a lista de projetos recentes abertos pelo usuário.

### 2. SimulationHistory

Histórico de execuções de simulação com máquina de estados para lifecycle.

### 3. UserPreferences

Preferências do usuário (tema, idioma, posição da janela, etc.).

### 4. Health

Verificação de saúde da API.

---

## Enums

```graphql
enum SimulationStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum ThemeMode {
  DARK
  LIGHT
  SYSTEM
}

enum HealthStatusEnum {
  DEGRADED
  HEALTHY
  UNHEALTHY
}
```

---

## Máquina de Estados: SimulationStatus

```
┌─────────┐
│ PENDING │──────────────────┐
└────┬────┘                  │
     │                       │
     ▼                       ▼
┌─────────┐            ┌───────────┐
│ RUNNING │            │ CANCELLED │ (terminal)
└────┬────┘            └───────────┘
     │
     ├──────────────────┐
     │                  │
     ▼                  ▼
┌───────────┐    ┌────────┐
│ COMPLETED │    │ FAILED │
│ (terminal)│    └────┬───┘
└───────────┘         │
                      │ retry
                      ▼
                ┌─────────┐
                │ RUNNING │
                └─────────┘
```

**Transições válidas:**

- `PENDING` → `RUNNING`, `CANCELLED`
- `RUNNING` → `COMPLETED`, `FAILED`, `CANCELLED`
- `FAILED` → `RUNNING` (retry)
- `COMPLETED`, `CANCELLED` → (estados terminais, sem transição)

**Importante:** O backend valida transições. Tentar transição inválida retorna `DomainError`.

---

## Schema GraphQL Completo

### Types

```graphql
scalar DateTime

type RecentProject {
  id: ID!
  name: String!
  path: String!
  gameVersion: String
  screenshotPath: String
  trechoCount: Int
  lastOpenedAt: DateTime!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PaginatedRecentProjects {
  data: [RecentProject!]!
  meta: PaginatedMeta!
}

type PaginatedMeta {
  page: Float!
  perPage: Float!
  total: Float!
  lastPage: Float!
}

type SimulationHistoryEntryGraphQL {
  id: String!
  projectPath: String!
  projectName: String!
  status: SimulationStatus!
  ttkVersion: String!
  configJson: String!
  summaryJson: String
  hasReport: Boolean!
  reportFilePath: String
  durationMs: Float!
  battleCount: Float!
  trechoCount: Float!
  timestamp: DateTime!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserPreferences {
  id: ID!
  userId: String!
  theme: ThemeMode!
  language: String!
  windowWidth: Int!
  windowHeight: Int!
  windowX: Int
  windowY: Int
  windowIsMaximized: Boolean!
  autoSaveInterval: Int!
  maxHistoryEntries: Int!
  lastProjectPath: String
  lastOpenDate: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type HealthStatus {
  status: HealthStatusEnum!
  timestamp: DateTime!
  uptime: Float!
  version: String!
}

type SuccessResponse {
  success: Boolean!
}
```

### Queries

```graphql
type Query {
  # Health Check
  health: HealthStatus!
  hello: String!

  # Recent Projects (paginado offset/limit)
  recentProjects(
    limit: Int = 10
    offset: Int = 0
    nameFilter: String
    gameVersion: String
  ): PaginatedRecentProjects!

  # Simulation History (paginado page/perPage)
  simulationHistory(
    projectPath: String
    status: SimulationStatus
    ttkVersion: String
    dateFrom: DateTime
    dateTo: DateTime
    page: Float = 1
    perPage: Float = 20
  ): [SimulationHistoryEntryGraphQL!]!

  simulationHistoryEntry(id: String!): SimulationHistoryEntryGraphQL

  # User Preferences
  userPreferences: UserPreferences!
}
```

### Mutations

```graphql
type Mutation {
  echo(message: String!): String!

  # Recent Projects
  addRecentProject(
    path: String!
    name: String!
    gameVersion: String
    screenshotPath: String
    trechoCount: Int
  ): RecentProject!

  removeRecentProject(path: String!): SuccessResponse!

  # Simulation History
  createSimulationHistoryEntry(
    projectPath: String!
    projectName: String!
    ttkVersion: String!
    configJson: String!
    durationMs: Float!
    battleCount: Float!
    trechoCount: Float!
    status: SimulationStatus = PENDING
    summaryJson: String
    hasReport: Boolean = false
    reportFilePath: String
  ): SimulationHistoryEntryGraphQL!

  updateSimulationStatus(
    id: String!
    status: SimulationStatus!
    summaryJson: String
  ): SimulationHistoryEntryGraphQL!

  deleteSimulationHistory(id: String!): Boolean!

  # User Preferences
  updateUserPreferences(
    theme: ThemeMode
    language: String
    windowWidth: Float
    windowHeight: Float
    windowX: Float
    windowY: Float
    windowIsMaximized: Boolean
    autoSaveInterval: Float
    maxHistoryEntries: Float
    lastProjectPath: String
  ): UserPreferences!
}
```

### Subscriptions (NÃO HABILITADAS)

> **ATENÇÃO:** As subscriptions abaixo estão **definidas no schema** mas **NÃO FUNCIONAM** atualmente.
>
> **Motivo:** O backend não tem `graphql-ws` instalado nem configuração de WebSocket no `GraphQLModule`.
>
> **Para habilitar no backend (futuro):**
>
> 1. `pnpm add graphql-ws`
> 2. Configurar `subscriptions: { 'graphql-ws': true }` no `GraphQLModule.forRoot()`
>
> **Alternativa atual:** Use polling (refetch periódico) para simular real-time.

```graphql
type Subscription {
  # Mudança de status de uma simulação específica ou todas
  simulationStatusChanged(simulationId: String): SimulationHistoryEntryGraphQL!

  # Qualquer mudança no histórico (create, update, delete)
  simulationHistoryChanged: SimulationHistoryEntryGraphQL!

  # Mudanças nas preferências do usuário
  userPreferencesChanged: UserPreferences!
}
```

---

## Tratamento de Erros

Erros são retornados no formato padrão GraphQL:

```json
{
  "errors": [
    {
      "message": "Error message here",
      "extensions": {
        "code": "DOMAIN_ERROR",
        "statusCode": 400
      }
    }
  ]
}
```

### Tipos de Erro

| Tipo            | statusCode | Quando ocorre                                                   |
| --------------- | ---------- | --------------------------------------------------------------- |
| `DomainError`   | 400        | Violação de regra de negócio (ex: transição de status inválida) |
| `NotFoundError` | 404        | Entidade não encontrada (ex: simulação com ID inexistente)      |

---

## Exemplos Práticos

### Health Check

```graphql
query HealthCheck {
  health {
    status
    timestamp
    uptime
    version
  }
}
```

### Listar Projetos Recentes

```graphql
query ListRecentProjects($limit: Int, $offset: Int, $nameFilter: String) {
  recentProjects(limit: $limit, offset: $offset, nameFilter: $nameFilter) {
    data {
      id
      name
      path
      gameVersion
      screenshotPath
      trechoCount
      lastOpenedAt
    }
    meta {
      page
      perPage
      total
      lastPage
    }
  }
}
```

### Adicionar Projeto Recente

```graphql
mutation AddRecentProject($path: String!, $name: String!, $gameVersion: String) {
  addRecentProject(path: $path, name: $name, gameVersion: $gameVersion) {
    id
    name
    path
    lastOpenedAt
  }
}
```

### Criar Entrada de Simulação

```graphql
mutation CreateSimulation(
  $projectPath: String!
  $projectName: String!
  $ttkVersion: String!
  $configJson: String!
  $durationMs: Float!
  $battleCount: Float!
  $trechoCount: Float!
) {
  createSimulationHistoryEntry(
    projectPath: $projectPath
    projectName: $projectName
    ttkVersion: $ttkVersion
    configJson: $configJson
    durationMs: $durationMs
    battleCount: $battleCount
    trechoCount: $trechoCount
    status: PENDING
  ) {
    id
    status
    timestamp
  }
}
```

### Atualizar Status da Simulação

```graphql
mutation UpdateSimulationStatus($id: String!, $status: SimulationStatus!, $summaryJson: String) {
  updateSimulationStatus(id: $id, status: $status, summaryJson: $summaryJson) {
    id
    status
    summaryJson
    updatedAt
  }
}
```

### Listar Histórico de Simulações com Filtros

```graphql
query ListSimulations(
  $projectPath: String
  $status: SimulationStatus
  $page: Float
  $perPage: Float
) {
  simulationHistory(projectPath: $projectPath, status: $status, page: $page, perPage: $perPage) {
    id
    projectName
    status
    ttkVersion
    durationMs
    battleCount
    timestamp
  }
}
```

### Obter/Atualizar Preferências do Usuário

```graphql
query GetUserPreferences {
  userPreferences {
    id
    theme
    language
    windowWidth
    windowHeight
    windowX
    windowY
    windowIsMaximized
    autoSaveInterval
    maxHistoryEntries
    lastProjectPath
  }
}

mutation UpdatePreferences($theme: ThemeMode, $language: String) {
  updateUserPreferences(theme: $theme, language: $language) {
    id
    theme
    language
    updatedAt
  }
}
```

### Subscription: Monitorar Status de Simulação (NÃO FUNCIONA)

> **NÃO HABILITADO** - Use polling como alternativa

```graphql
# FUTURO - quando subscriptions forem habilitadas
subscription WatchSimulationStatus($simulationId: String) {
  simulationStatusChanged(simulationId: $simulationId) {
    id
    status
    summaryJson
    updatedAt
  }
}
```

**Alternativa com polling:**

```typescript
const { data, refetch } = useQuery(GET_SIMULATION_STATUS, {
  variables: { id: simulationId },
  pollInterval: 2000, // 2 segundos
});
```

### Subscription: Monitorar Todas as Mudanças de Histórico (NÃO FUNCIONA)

> **NÃO HABILITADO** - Use polling como alternativa

```graphql
# FUTURO - quando subscriptions forem habilitadas
subscription WatchSimulationHistory {
  simulationHistoryChanged {
    id
    projectName
    status
    timestamp
  }
}
```

### Subscription: Monitorar Preferências (NÃO FUNCIONA)

> **NÃO HABILITADO** - Use polling como alternativa

```graphql
# FUTURO - quando subscriptions forem habilitadas
subscription WatchUserPreferences {
  userPreferencesChanged {
    id
    theme
    language
    windowWidth
    windowHeight
  }
}
```

---

## Fluxo Típico: Executar Simulação

```
1. createSimulationHistoryEntry(status: PENDING)
   ↓
2. updateSimulationStatus(status: RUNNING)
   ↓
3a. updateSimulationStatus(status: COMPLETED, summaryJson: "...")
   OU
3b. updateSimulationStatus(status: FAILED)
   ↓
4. (opcional) Se FAILED, pode retry:
   updateSimulationStatus(status: RUNNING)
```

---

## Notas para Implementação Electron

1. **Porta dinâmica**: Leia `PORT` env ou use 4000 como fallback (Docker) / 3000 (local)
2. **Polling para real-time**: Use `pollInterval` em queries que precisam de atualização automática (subscriptions não disponíveis)
3. **Cache Apollo**: Configure políticas de cache por tipo (ex: UserPreferences pode ter cache mais longo)
4. **Offline**: Considere queue de mutations para quando o backend não estiver disponível
5. **DevTools**: Apollo DevTools funciona no Electron para debugging
6. **Health check**: Implemente verificação periódica de `health` para detectar se backend está disponível

---

## Changelog

| Versão | Data       | Descrição                                                                                      |
| ------ | ---------- | ---------------------------------------------------------------------------------------------- |
| 1.0.2  | 2026-02-04 | Corrigido: Porta padrão atualizada para 4000 (Docker)                                          |
| 1.0.1  | 2026-02-03 | Corrigido: Subscriptions NÃO estão habilitadas no backend. Adicionado polling como alternativa |
| 1.0.0  | 2026-02-03 | Documento inicial para integração Electron                                                     |
