# Sumário para Pesquisa Técnica: Melhores Práticas de Implementação

Baseado nas decisões arquiteturais do projeto Sentinel, este documento identifica as tecnologias centrais e os cenários específicos que precisam de aprofundamento técnico.

## 🎯 Contexto do Sistema

**Objetivo:** Sistema RAG de alta fidelidade para GDDs narrativos de RPG
**Arquitetura:** Monolito NestJS com PostgreSQL unificado (grafos + vetores + relacional)
**Foco:** Simplicidade MVP, validação rápida, custo mínimo (<$100/mês)

---

## 📚 Tecnologias Escolhidas & Tópicos de Pesquisa

### 1. **PostgreSQL + Apache AGE (Grafos de Conhecimento)**

**Cenários:**
- Modelagem de ontologia narrativa (Personagem, Facção, Evento, Relacionamento, Arco, Tema)
- Queries multi-hop para raciocínio relacional (`MATCH` paths complexos)
- Extração automatizada de entidades/relações de GDD via LLM

**Tópicos para pesquisar:**
- [ ] **Setup e configuração de Apache AGE no Postgres 16**
  - Compilação e instalação via Docker
  - Configuração de `shared_preload_libraries`
  - Criação de grafos (`create_graph`)
- [ ] **Modelagem de ontologia em Cypher para AGE**
  - Schema design para entidades narrativas com propriedades JSONB
  - Tipos de relacionamentos (estruturais, temporais, emocionais)
  - Versionamento de GDD no grafo (relação `VERSÃO_DE`)
- [ ] **Queries Cypher eficientes para cenários narrativos**
  - Travessia multi-hop: "Personagens relacionados indiretamente com Facção X"
  - Agregações: "Todos os Eventos que mencionam Localização Y"
  - Path finding: "Cadeia de Relacionamentos entre Personagem A e B"
- [ ] **Performance tuning de AGE**
  - Índices em propriedades de nós/arestas
  - Materialização de subgrafos frequentes
  - Limites de profundidade de travessia (evitar explosão combinatória)
- [ ] **Integração AGE + NestJS via node-postgres**
  - Executar queries Cypher via `SELECT * FROM cypher(...)`
  - Parsing de resultados `agtype` para TypeScript
  - Pool de conexões e transações

---

### 2. **pgvector + Postgres Full-Text Search (Busca Híbrida)**

**Cenários:**
- Busca semântica em chunks narrativos (biografias, lore)
- Precisão em nomes próprios/keywords técnicos (BM25)
- Merge de rankings via Reciprocal Rank Fusion (RRF)

**Tópicos para pesquisar:**
- [ ] **Setup pgvector com HuggingFace embeddings**
  - Instalação de extensão `vector`
  - Tipos de índice: `ivfflat` vs `hnsw` (trade-offs latência/recall)
  - Dimensionalidade de embeddings: 384 (Sentence-Transformers) vs 768 vs 1536
- [ ] **Estratégias de indexação para escala**
  - Parâmetros de `ivfflat`: número de listas, samples
  - Parâmetros de `hnsw`: `m` (conectividade) e `ef_construction`
  - Quando re-indexar após inserções em massa
- [ ] **Postgres Full-Text Search (FTS) para nomes próprios**
  - Criação de `tsvector` com `to_tsvector('english', text)`
  - Dicionário customizado para nomes de personagens/lugares
  - GIN index em `tsvector` para performance
  - Ranking via `ts_rank` e `ts_rank_cd`
- [ ] **Implementação de Reciprocal Rank Fusion (RRF)**
  - Algoritmo: `score = Σ 1/(k + rank_i)` onde `k=60` (padrão)
  - Merge de resultados pgvector + FTS em TypeScript
  - Normalização de scores antes do merge
- [ ] **Chunking semântico por seção**
  - Parser Markdown: detectar headers (`#`, `##`, `###`)
  - Metadata de contexto: `section_name`, `level`, `parent_section`
  - Tamanho variável de chunks (100-2000 tokens): handling em embeddings

---

### 3. **Claude 3.5 Sonnet (Anthropic API)**

**Cenários:**
- Extração de entidades/relações de GDD (offline, batch)
- Geração de respostas RAG (runtime, baixa latência)
- Prompting híbrido (chunks textuais + metadados do grafo)

**Tópicos para pesquisar:**
- [ ] **Uso eficiente de Claude 3.5 Sonnet no plano Pro**
  - Limites do plano Pro: ~150-200 mensagens/dia (compartilhado CLI + API)
  - Monitoramento de uso via dashboard Anthropic
  - Estratégias de cache de respostas comuns (evitar chamadas redundantes)
  - Quando migrar para pay-per-use ($3 input, $15 output por 1M tokens)
- [ ] **Extração estruturada de entidades com JSON parsing**
  - Prompt engineering para output JSON confiável
  - Handling de respostas malformadas (retry com `max_tokens` maior)
  - Function calling vs prompt engineering: trade-offs
  - Validação de schema (Zod/Joi) pós-extração
- [ ] **Prompt engineering para alta fidelidade em RAG**
  - System prompt: instruções de groundedness ("responda APENAS baseado no contexto")
  - Template de contexto: chunks textuais + metadados do grafo (ordem importa?)
  - Few-shot examples: exemplos de boas respostas vs alucinações
  - Parâmetros: `temperature=0.3` (baixa criatividade), `max_tokens=1000` (conciso)
- [ ] **Estratégias de detecção de alucinações via prompts**
  - Técnicas de chain-of-thought: "Liste evidências do contexto antes de responder"
  - Self-consistency: gerar N respostas, escolher mais consistente
  - Disclaimers explícitos: "Se não souber, diga 'Não encontrei no GDD'"
- [ ] **Integração NestJS + Anthropic SDK**
  - `@anthropic-ai/sdk`: configuração de API key via `ConfigService`
  - Error handling: rate limits, timeouts, falhas de rede
  - Streaming de respostas (se necessário para UX futura)

---

### 4. **HuggingFace Inference API (Embeddings)**

**Cenários:**
- Geração de embeddings para chunks durante ingestão (batch)
- Embedding de queries do usuário (runtime, sub-100ms)
- Free tier: ~30k requests/mês

**Tópicos para pesquisar:**
- [ ] **Modelos de Sentence-Transformers para narrativas**
  - `all-MiniLM-L6-v2`: 384 dim, rápido, boa baseline
  - `paraphrase-multilingual-mpnet-base-v2`: 768 dim, suporta português
  - `all-mpnet-base-v2`: 768 dim, melhor qualidade para inglês
  - Benchmarks em similaridade narrativa (personagens, eventos)
- [ ] **HuggingFace Inference API: limites e otimizações**
  - Rate limits do free tier: requests/segundo
  - Batch embeddings: enviar múltiplos textos de uma vez
  - Retry logic para erros 503 (modelo frio)
  - Fallback para OpenAI `text-embedding-3-small` se HF cair
- [ ] **Normalização e storage de embeddings**
  - Normalização L2 antes de inserir no pgvector (melhora similaridade)
  - Quantização de embeddings (reduzir storage): int8 vs float32
  - Compressão de índice: trade-offs de recall vs tamanho
- [ ] **Comparação com alternativas**
  - OpenAI `text-embedding-3-small/large`: custo vs qualidade
  - Voyage AI embeddings: especialização em RAG
  - Modelos locais (self-hosted): setup com ONNX/TensorRT

---

### 5. **NestJS (Backend Monolítico)**

**Cenários:**
- Orquestração de pipeline RAG (embedding → busca → grafo → LLM)
- Exposição de APIs REST (`/api/rag/query`, `/api/rag/entities`)
- Isolamento do módulo `gdd-rag` do resto do Sentinel

**Tópicos para pesquisar:**
- [ ] **Arquitetura de módulo isolado em NestJS**
  - Padrão de módulos isolados: `exports: []` (não expor para outros módulos)
  - Injeção de dependências: `@Injectable()` para services
  - DTOs e validação: `class-validator` para input/output
- [ ] **Integração com PostgreSQL via TypeORM ou Prisma**
  - TypeORM: suporte a queries raw SQL + Cypher (AGE)
  - Prisma: schema para tabelas relacionais, raw SQL para grafos
  - Pool de conexões: configuração para latência mínima
- [ ] **Pipeline sequencial vs paralelo**
  - Sequencial: embedding → busca → grafo → LLM (debugging fácil)
  - Paralelo: busca vetorial + FTS em paralelo, merge depois
  - Trade-offs de latência vs complexidade
- [ ] **Error handling e logging estruturado**
  - Winston ou Pino: logs JSON para queries/respostas/latência
  - Sentry para tracking de erros de LLM (rate limits, timeouts)
  - Métricas: Prometheus + Grafana (latência P50/P95/P99 por etapa)
- [ ] **Caching de respostas comuns**
  - Redis para cache de queries frequentes (TTL: 1 hora)
  - Cache de embeddings de queries (evitar chamadas HF redundantes)
  - Invalidação de cache ao atualizar GDD

---

### 6. **Docker Compose (Infraestrutura Local/VPS)**

**Cenários:**
- Desenvolvimento local reproduzível
- Deploy em VPS com infra-as-code
- Build de imagem custom (Postgres + AGE + pgvector)

**Tópicos para pesquisar:**
- [ ] **Dockerfile para Postgres custom (AGE + pgvector)**
  - Base image: `postgres:16`
  - Compilação de AGE: dependências, `make install`
  - Compilação de pgvector: `make && make install`
  - Multi-stage build para reduzir tamanho da imagem
- [ ] **docker-compose.yml para stack completa**
  - Services: `postgres`, `nestjs`
  - Volumes persistentes: `postgres_data`
  - Networks: comunicação entre containers
  - Health checks: `pg_isready` para garantir Postgres iniciado
- [ ] **Inicialização de schema via `init.sql`**
  - Script executado automaticamente em `/docker-entrypoint-initdb.d/`
  - Ordem de comandos: `CREATE EXTENSION` → `create_graph` → tabelas → índices
  - Idempotência: `IF NOT EXISTS` para re-runs
- [ ] **Deploy em VPS (DigitalOcean/Linode)**
  - Setup de Ubuntu 22.04: Docker, Docker Compose, PM2, Nginx
  - CI/CD básico: Git hooks ou GitHub Actions
  - Backup de volumes do Postgres: `pg_dump` + cron
  - SSL via Let's Encrypt (Certbot + Nginx)

---

### 7. **Prompt Engineering & Guardrails (Fase MVP)**

**Cenários:**
- Evitar alucinações via system prompts bem estruturados
- Rastreabilidade de respostas (citações de seções)
- Validação básica de output (regex, schema)

**Tópicos para pesquisar:**
- [ ] **System prompts eficazes para groundedness**
  - Estrutura: Papel → Regras → Formato de Contexto → Instruções de Resposta
  - Exemplos negativos: "NUNCA invente nomes de personagens..."
  - Técnicas de prompt: "Cite a seção do GDD de onde extraiu cada informação"
- [ ] **Templates de prompt híbrido (chunks + grafo)**
  - Ordem de apresentação: metadados do grafo primeiro vs chunks primeiro?
  - Formatação de relações: lista vs grafo textual (ASCII art)
  - Limite de contexto: quantos chunks + quantas entidades/relações?
- [ ] **Validações determinísticas leves**
  - Regex para detectar disclaimers indesejados: `/como ia eu não posso/i`
  - Validação de presença de nomes de personagens mencionados no contexto
  - Contagem de tokens de resposta (limitar verbose)
- [ ] **Roadmap de guardrails avançados (pós-MVP)**
  - LLM-as-a-judge: Claude Haiku valida groundedness da resposta principal
  - Frameworks: Guardrails AI, NeMo Guardrails (quando adicionar?)
  - Métricas de fidelidade: RAGAS (Faithfulness, Context Precision)

---

## 🔍 Áreas de Pesquisa por Prioridade

### **Alta Prioridade (Semana 1-2):**
1. Setup de Apache AGE + pgvector no Docker
2. Modelagem de ontologia narrativa em Cypher
3. Integração NestJS + node-postgres para queries Cypher
4. HuggingFace Inference API: autenticação, rate limits, batch embeddings
5. Claude 3.5 Sonnet: extração estruturada de entidades (JSON parsing confiável)

### **Média Prioridade (Semana 3-4):**
6. Busca híbrida: implementação de RRF em TypeScript
7. Tuning de índices pgvector (ivfflat vs hnsw)
8. Prompt engineering: templates híbridos (chunks + grafo)
9. Parser Markdown: chunking semântico preservando contexto
10. Error handling e logging estruturado no NestJS

### **Baixa Prioridade (Pós-MVP):**
11. Comparação de modelos de embeddings (HF vs OpenAI vs Voyage)
12. Reranking: Cohere Rerank API, ColBERT v2, cross-encoders
13. Guardrails avançados: LLM-as-a-judge, Guardrails AI
14. Métricas de avaliação: RAGAS, Faithfulness, Context Precision
15. CI/CD e deploy automatizado (GitHub Actions → VPS)

---

## 📖 Estrutura Sugerida para Próxima Pesquisa

```markdown
# Melhores Práticas Técnicas: Stack RAG para GDDs Narrativos

## 1. PostgreSQL + Apache AGE
### 1.1 Setup e Configuração
### 1.2 Modelagem de Ontologia Narrativa
### 1.3 Queries Cypher para Raciocínio Multi-hop
### 1.4 Performance Tuning

## 2. pgvector + Busca Híbrida
### 2.1 Indexação e Trade-offs (ivfflat vs hnsw)
### 2.2 Postgres Full-Text Search para Keywords
### 2.3 Reciprocal Rank Fusion (RRF)
### 2.4 Chunking Semântico

## 3. Claude 3.5 Sonnet (Anthropic)
### 3.1 Extração Estruturada de Entidades
### 3.2 Prompt Engineering para Groundedness
### 3.3 Gestão de API do Plano Pro
### 3.4 Integração com NestJS

## 4. HuggingFace Inference API
### 4.1 Modelos Sentence-Transformers
### 4.2 Rate Limits e Otimizações
### 4.3 Comparação com Alternativas

## 5. Arquitetura NestJS
### 5.1 Módulo Isolado (gdd-rag)
### 5.2 Pipeline RAG (Sequencial vs Paralelo)
### 5.3 Error Handling e Observability
### 5.4 Caching Estratégico

## 6. Docker + Deploy
### 6.1 Dockerfile Custom (Postgres + AGE + pgvector)
### 6.2 docker-compose.yml
### 6.3 Deploy em VPS
### 6.4 Backup e SSL

## 7. Guardrails e Validação
### 7.1 System Prompts Eficazes
### 7.2 Templates Híbridos (Chunks + Grafo)
### 7.3 Validações Determinísticas
### 7.4 Roadmap de Guardrails Avançados
```

---

## ✅ Critérios de Sucesso da Pesquisa

Para cada tecnologia, a pesquisa deve responder:

1. **Setup:** Como configurar? (comandos, dependências, gotchas)
2. **Best Practices:** Padrões recomendados para o cenário narrativo?
3. **Performance:** Tuning para latência <2s P95?
4. **Trade-offs:** Quando usar alternativas? (ex: AGE vs Neo4j, HF vs OpenAI)
5. **Código Exemplo:** Snippets prontos para copiar (TypeScript, SQL, Cypher, Python)
6. **Troubleshooting:** Erros comuns e soluções
7. **Custos:** Estimativas (storage, API calls) para 100 designers

---

## 📋 Referências aos Documentos Base

- **Pesquisa Original:** [Stack RAG Alta Fidelidade para GDDs.md](../docs/pesquisas/Stack%20RAG%20Alta%20Fidelidade%20para%20GDDs.md)
- **Decisões Arquiteturais:** [entrevista-stack-rag-gdd-2026-01-29.md](../docs/decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md)

---

**Documento gerado em:** 2026-01-30
**Próximo Passo:** Escolher 2-3 tópicos de alta prioridade e iniciar pesquisa técnica focada com exemplos de código práticos.
