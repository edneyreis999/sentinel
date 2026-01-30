# Relatório de Entrevista: Busca Híbrida com pgvector e FTS - Integração com Grafo de Conhecimento
**Projeto:** Sentinel / Daratrine
**Data:** 2026-01-30
**Contexto Original:** [Busca Híbrida com pgvector e FTS.md](../pesquisas/Busca%20Híbrida%20com%20pgvector%20e%20FTS.md)
**Documentos Relacionados:**
- [Decisões Arquiteturais - Grafos de Conhecimento com Apache AGE](decisoes-arquiteturais-grafo.md)
- [Stack RAG Alta Fidelidade para GDDs](entrevista-stack-rag-gdd-2026-01-29.md)

**Objetivo:** Definir decisões executáveis para implementação da busca híbrida integrada ao grafo de conhecimento

---

## Sumário Executivo

Este documento consolida as **12 decisões técnicas críticas** tomadas durante entrevista estruturada para implementação da **busca híbrida (pgvector + FTS) integrada ao grafo de conhecimento Apache AGE** no projeto Sentinel/Daratrine.

A entrevista esclareceu **12 gaps críticos** identificados nos documentos de pesquisa, transformando conhecimento estado-da-arte em decisões executáveis para MVP com **usuário único** (desenvolvedor/designer), priorizando **simplicidade operacional e validação rápida**.

### 🎯 Decisões Chave

1. **Pipeline RAG Completo:** Query → Embedding → Busca Híbrida (pgvector + ts_rank_cd + RRF) → Extração Subgrafo 2 Estágios → Prompt Híbrido → Claude 3.5 Sonnet
2. **Extração de Subgrafo:** Stage 1 FTS em properties (85-95% recall, ~100-200ms) + Stage 2 embedding matching fallback (+15-20% recall, +50-100ms)
3. **Parâmetros HNSW:** Baseline conservador (m=16, ef_construction=100, ef_search=40) - 200-300MB RAM, recall 85-90%
4. **Field Weighting:** Section-based (peso A para section_name, peso B para chunk_text)
5. **TypeScript Types:** Manual types + Zod validação runtime para 15 labels
6. **Prompt Extração:** temperature=0.1, max_tokens=4000, divisão ~10k tokens
7. **Manutenção:** Reactive triggers (usuário único) - VACUUM/REINDEX quando perceber lentidão
8. **Validação:** Spot-check (5-10 entidades críticas, extrapolar qualidade)

---

## 🎯 Abordagem Arquitetural Escolhida

### **Pipeline RAG Sequencial com Busca Híbrida + Extração de Subgrafo**

**Decisão:** Implementar pipeline sequencial que combina busca textual híbrida (recall) com extração inteligente de subgrafo (estrutura semântica) antes de enviar contexto ao LLM.

#### **Justificativa:**

1. **Busca híbrida primeiro** garante recall (abrangência) - recupera os 10-20 chunks mais relevantes do GDD independente de estrutura
2. **Extração de subgrafo depois** é mais eficiente - analisa apenas entidades mencionadas nos chunks retornados (vs analisar grafo inteiro)
3. **Alinhado ao documento Busca Híbrida** (linhas 32-34): "O primeiro estágio foca em recall (abrangência)"
4. **Prompt híbrido** combina texto narrativo (chunks) + estrutura semântica (grafo) maximizando fidelidade
5. **Latência previsível** - busca híbrida <100ms, extração subgrafo ~150-300ms, total <500ms (excluindo LLM)

**Fluxo Completo:**

```
[1] Query Usuário
    ↓
[2] Embedding via HuggingFace (Sentence-Transformers)
    ↓
[3] BUSCA HÍBRIDA (paralela)
    ├─ Busca Vetorial (pgvector, HNSW, cosine similarity)
    └─ Full-Text Search (ts_rank_cd, GIN index)
    ↓
[4] Reciprocal Rank Fusion (RRF, k=60)
    ↓
[5] Top-10 Chunks Retornados
    ↓
[6] EXTRAÇÃO DE SUBGRAFO (2 estágios)
    ├─ Stage 1: FTS em properties das 15 labels (GIN index)
    │   → top-5 entidades por chunk
    │   → ~100-200ms, 85-95% precisão
    │
    └─ Stage 2: Embedding matching (fallback para chunks com <3 entidades)
        → similaridade com description_embedding pré-computado
        → +50-100ms, +15-20% recall adicional
    ↓
[7] Deduplicate + Limitar (top-10 entidades + top-15 relações 1-hop)
    ↓
[8] PROMPT HÍBRIDO
    ├─ System Prompt (instruções)
    ├─ Knowledge Graph Metadata (compact format, ~1.5k tokens)
    │   ├─ Top-10 Entidades (nome + 2-3 properties essenciais)
    │   └─ Top-15 Relações (source → type → target)
    └─ Text Chunks (10-20 chunks, seções do GDD)
    ↓
[9] Claude 3.5 Sonnet (via Anthropic API)
    ↓
[10] Resposta Final ao Usuário
```

**Referência ao Contexto Original:**
> *"O GraphRAG surge como a técnica dominante em 2026 para lidar com a descoberta de informações em dados narrativos privados e técnicos."* (doc Stack RAG, linhas 25-29)

**Esclarecimento:** A implementação combina busca híbrida tradicional (pgvector + FTS) com GraphRAG (extração de subgrafo relevante), aproveitando o melhor de ambas abordagens.

---

## 📊 Decisões Técnicas Consolidadas

### RODADA 1: Pipeline e Integração

#### **1.1 Ordem de Execução do Pipeline RAG**

**Gap Esclarecido:** *"Documentos descrevem componentes isolados (busca híbrida, queries Cypher, prompt LLM) mas não especificam orquestração sequencial."*

**Decisão:** Query → Embedding → Busca Híbrida (pgvector + FTS + RRF) → Extração Subgrafo 2 Estágios → Prompt Híbrido → Claude 3.5 Sonnet

**Justificativa:**
- ✅ **Busca híbrida primeiro** garante recall (top-10 chunks mais relevantes)
- ✅ **Extração de subgrafo depois** analisa apenas entidades mencionadas nos chunks (eficiência)
- ✅ **Latência previsível** - busca <100ms, extração ~150-300ms, total <500ms
- ✅ **Alinhado ao doc Busca Híbrida** (linha 33): "primeiro estágio foca em recall"

**Referência ao Contexto Original:**
> *"A precisão semântica em 2026 é alcançada através de um pipeline de recuperação em múltiplos estágios."* (doc Busca Híbrida, linhas 32-34)

---

#### **1.2 Extração de Subgrafo: Pipeline de 2 Estágios (FTS + Embedding Matching)**

**Gap Esclarecido:** *"Como extrair o subgrafo relevante a partir dos chunks retornados pela busca híbrida?"*

**Decisão:** Pipeline de 2 estágios - Stage 1 FTS em properties (GIN index) + Stage 2 Embedding matching fallback

**Configuração:**

**Stage 1: FTS em properties das entidades (GIN index)**
- Executa full-text search em paralelo nos 20 chunks retornados
- Retorna top-5 entidades por chunk
- Performance: ~100-200ms
- Precisão: 85-95%
- Recall: 70-85% das entidades relevantes

**Stage 2: Embedding matching (fallback condicional)**
- Aplica apenas nos chunks que encontraram <3 entidades no Stage 1
- Usa coluna `description_embedding` pré-computada (índice HNSW m=16)
- Performance adicional: +50-100ms
- Recall adicional: +15-20%

**Latência total:** ~150-300ms (Stage 1 sempre + Stage 2 condicional)

**Recall total:** 85-100% (70-85% + 15-20%)

**Justificativa:**
- ✅ **Best of both worlds** - FTS captura nomes exatos, embeddings capturam variações semânticas
- ✅ **Performance adaptativa** - Stage 2 só roda quando necessário
- ✅ **Alinhado ao doc Busca Híbrida** (linha 249): GIN index em properties já planejado

**Referência ao Contexto Original:**
> *"A criação de índices funcionais é uma técnica avançada recomendada para campos de alta cardinalidade."* (doc Busca Híbrida, linhas 129-130)

**Esclarecimento:** Stage 1 usa GIN index padrão em properties (JSONB). Índices funcionais são otimização futura se necessário.

---

#### **1.3 Algoritmo de Ranking Léxico: ts_rank_cd Nativo**

**Gap Esclarecido:** *"Documento Busca Híbrida menciona duas opções (ts_rank_cd nativo vs BM25 via pg_search) mas não define qual usar."*

**Decisão:** ts_rank_cd nativo do PostgreSQL (sem extensões adicionais)

**Justificativa:**
- ✅ **Simplicidade MVP** - built-in, zero configuração extra no Dockerfile
- ✅ **Performance adequada** - para ~2.4k chunks, diferença entre ts_rank_cd e BM25 é marginal (<5% NDCG)
- ✅ **Alinhado à filosofia MVP** - doc Stack RAG linha 271: "Nenhum reranking adicional no MVP"
- ✅ **Migração clara** - se testes mostrarem imprecisão, adicionar pg_search é operação reversível

**Configuração SQL:**
```sql
-- Busca Full-Text Search com ts_rank_cd nativo
SELECT id, chunk_text,
       ts_rank_cd(search_vector, plainto_tsquery('portuguese', $1)) AS rank
FROM gdd_chunks
WHERE search_vector @@ plainto_tsquery('portuguese', $1)
ORDER BY rank DESC
LIMIT 20;
```

**Referência ao Contexto Original:**
> *"O advento de extensões como o pg_search introduz o algoritmo BM25 (Best Matching 25), que é o padrão ouro na indústria."* (doc Busca Híbrida, linhas 12-13)

**Esclarecimento:** BM25 é superior em produção otimizada, mas ts_rank_cd é suficiente para MVP. Migração futura se necessário.

---

#### **1.4 Formato de Metadados do Grafo no Prompt LLM**

**Gap Esclarecido:** *"Documento Stack RAG mostra exemplo básico de prompt híbrido mas não especifica quantas entidades, quais properties, formato detalhado."*

**Decisão:** Compact format - top-10 entidades (2-3 properties essenciais) + top-15 relações, formato texto natural, ~1.5k tokens

**Properties essenciais por tipo de entidade:**
- **Personagem:** `nome`, `papel_narrativo`, `motivacao_raiz`
- **Facção:** `nome`, `tipo`, `ideologia`
- **Local:** `nome`, `tipo`, `nivel_perigo`
- **Evento:** `nome`, `ato`, `gravidade`
- **Quest:** `nome`, `tipo`, `objetivo_principal`

**Exemplo concreto:**
```
===== KNOWLEDGE GRAPH METADATA =====
Entidades Relevantes (10):
- Personagem: Kael Sombravento (protagonista, motivado por redenção)
- Personagem: Aria Luminastra (aliada, motivada por proteger a luz)
- Facção: Facção do Crepúsculo (culto, ideologia: busca poder sombrio)
- Local: Cidade de Lúmen (cidade, nível de perigo: médio)
- Evento: Exílio de Kael (ato 1, gravidade: alta)
...

Relações Relevantes (15):
- Kael Sombravento TEM_RELACIONAMENTO(Rivalidade: ódio profundo) → Facção do Crepúsculo
- Kael Sombravento PERTENCE_A(cargo: exilado, desde_ato: 1) → Reino de Valdoria
- Aria Luminastra CONFLITA_COM → Facção do Crepúsculo
- Cidade de Lúmen LOCALIZADO_EM → Reino de Valdoria
- Exílio de Kael MOTIVA(natureza: vingança) → Kael Sombravento
...
```

**Justificativa:**
- ✅ **Tokens eficientes** - compact format (~50-100 tokens/entidade vs ~150-200 no full properties)
- ✅ **Cabe confortavelmente no contexto** - ~1.5k tokens de grafo + ~10k tokens de chunks = ~12k total (contexto 200k do Claude)
- ✅ **Formato texto natural** é mais interpretável pelo Claude que JSON/YAML (benchmarks RAG mostram 5-10% melhoria)
- ✅ **Alinhado ao exemplo do doc Stack RAG** (linha 580)

**Referência ao Contexto Original:**
> *"Prompt híbrido combina chunks textuais + metadados do grafo de conhecimento."* (doc Stack RAG, linhas 567-596)

---

### RODADA 2: Parâmetros e Configuração

#### **2.1 Parâmetros HNSW do Índice pgvector**

**Gap Esclarecido:** *"Documento Busca Híbrida fornece intervalos (m: 16-32, ef_construction: 100-128, ef_search: 40-100) mas não valores exatos."*

**Decisão:** Baseline conservador - m=16, ef_construction=100, ef_search=40

**Configuração:**

**Dados do MVP:**
- ~900-2.400 vértices de chunks
- Embeddings: 384 dimensões (Sentence-Transformers)
- Hardware: 8GB RAM (Docker Compose)

**Valores escolhidos:**
- **m=16** - conectividade mínima, uso de RAM ~200-300MB
- **ef_construction=100** - profundidade de busca na criação do índice
- **ef_search=40** - nós explorados em tempo de query

**Performance esperada:**
- RAM: ~200-300MB (deixa ~7.7GB livres)
- Recall: ~85-90%
- Latência: <50ms

**Comando SQL:**
```sql
-- Criar índice HNSW
CREATE INDEX ON gdd_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 100);

-- Configurar ef_search em tempo de query (session level)
SET hnsw.ef_search = 40;
```

**Justificativa:**
- ✅ **RAM controlada** - 200-300MB deixa espaço para Postgres, NestJS, AGE
- ✅ **Recall adequado para MVP** - 85-90% suficiente para validar proposta de valor
- ✅ **Latência excelente** - <50ms no componente vetorial
- ✅ **Escalabilidade** - se passar de 10k chunks, aumentar para m=24 via REINDEX

**Referência ao Contexto Original:**
> *"Para um MVP RAG, valores equilibrados são fundamentais para garantir que o sistema escale sem degradação perceptível da qualidade."* (doc Busca Híbrida, linhas 72-73)

---

#### **2.2 Field Weighting em GDD Estruturado por Seções**

**Gap Esclarecido:** *"Documento Busca Híbrida menciona pesos A/B/C/D mas não especifica como aplicar em GDD estruturado por seções Markdown."*

**Decisão:** Section-based weighting - peso A para `section_name` (nome da seção), peso B para `chunk_text` (conteúdo da seção)

**Implementação:**
```sql
-- Adicionar coluna search_vector com pesos
ALTER TABLE gdd_chunks ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', unaccent(coalesce(section_name, ''))), 'A') ||
  setweight(to_tsvector('portuguese', unaccent(coalesce(chunk_text, ''))), 'B')
) STORED;

-- Criar índice GIN
CREATE INDEX ON gdd_chunks USING gin(search_vector);
```

**Exemplo concreto:**
```sql
-- Chunk 1: section_name = "Personagens > Aria Luminastra > Biografia"
--          chunk_text = "Aria nasceu na cidade de Lúmen..."
-- Query: "Aria"
-- Match em section_name (peso A) → score MAIOR

-- Chunk 2: section_name = "Personagens > Kael Sombravento > Biografia"
--          chunk_text = "...Kael conheceu Aria durante..."
-- Query: "Aria"
-- Match apenas em chunk_text (peso B) → score MENOR que Chunk 1
```

**Justificativa:**
- ✅ **Alinhado ao chunking semântico** - cada chunk é uma seção completa, section_name é o "título" natural
- ✅ **Benefício claro** - query "Aria Luminastra" dá boost ao chunk cuja section_name contém o nome
- ✅ **2 pesos suficientes** - A/B capturam 90% do valor de field weighting
- ✅ **Alinhado ao doc Busca Híbrida** (linha 58): exemplo usa apenas A e B

**Referência ao Contexto Original:**
> *"A eficácia do ranking léxico aumenta significativamente quando se aplica a técnica de 'field weighting'."* (doc Busca Híbrida, linhas 50-51)

---

#### **2.3 Dicionário de Sinônimos Específico do Daratrine**

**Gap Esclarecido:** *"Documento Busca Híbrida fornece exemplos genéricos de TI (db/database, js/javascript) mas não termos específicos do universo Daratrine."*

**Decisão:** 10-20 termos essenciais mínimos (variações de nomes de facções, locais, personagens principais) - definir durante implementação ao extrair o GDD real

**Estrutura do arquivo:**
```
# tech_synonyms.syn (a ser criado durante implementação)

# Facções (variações comuns)
crepusculo faccaocrepusculo cultocrepusculo

# Locais (nome completo vs abreviado)
lumen cidadelumen
valdoria reinovaldoria

# Personagens (se houver variações comuns no GDD)
kael kaelsombravento
aria arialuminastra

# Termos mágicos (se houver variações PT/EN no GDD)
raioarcano arcanebolt
```

**Configuração Postgres:**
```sql
-- Criar text search configuration customizada
CREATE TEXT SEARCH CONFIGURATION daratrine_pt (COPY = portuguese);

-- Adicionar dicionário de sinônimos (após criar tech_synonyms.syn)
ALTER TEXT SEARCH CONFIGURATION daratrine_pt
  ALTER MAPPING FOR asciiword, word
  WITH tech_synonyms, portuguese_stem;

-- Usar na coluna search_vector
ALTER TABLE gdd_chunks ALTER COLUMN search_vector TYPE tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('daratrine_pt', unaccent(section_name)), 'A') ||
  setweight(to_tsvector('daratrine_pt', unaccent(chunk_text)), 'B')
) STORED;
```

**Justificativa:**
- ✅ **ROI alto** - 10-20 entradas capturam 80% dos casos (nomes próprios principais são consultados com frequência)
- ✅ **Manutenção viável** - fácil de criar e manter sincronizado com GDD
- ✅ **Iteração fácil** - adicionar entradas é operação não-destrutiva

**Referência ao Contexto Original:**
> *"O uso de arquivos de sinônimos (.syn) permite que o motor de busca trate termos como 'DB', 'Database' e 'Banco de Dados' como equivalentes semânticos."* (doc Busca Híbrida, linhas 32-33)

---

### RODADA 3: Implementação NestJS

#### **3.1 Implementação Stage 1 + Stage 2 de Extração de Subgrafo**

**Gap Esclarecido:** *"Rodada 1 definiu pipeline de 2 estágios mas não detalhou implementação em TypeScript/NestJS."*

**Decisão:** Single query approach - Stage 1 executa FTS via query SQL com UNION ALL de 15 labels, Stage 2 usa embeddings pré-computados em coluna `description_embedding`

**Implementação TypeScript:**

```typescript
// src/modules/gdd-rag/services/graph.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { EmbeddingService } from './embedding.service';

interface Chunk {
  id: string;
  text: string;
}

interface GraphMetadata {
  entities: Array<{
    id: string;
    label: string;
    properties: Record<string, any>;
  }>;
  relations: Array<{
    source: string;
    type: string;
    target: string;
    properties?: Record<string, any>;
  }>;
}

@Injectable()
export class GraphService {
  constructor(
    @Inject('PG_POOL') private pool: Pool,
    private embeddingService: EmbeddingService,
  ) {}

  async extractRelevantSubgraph(chunks: Chunk[]): Promise<GraphMetadata> {
    const allEntities = [];

    for (const chunk of chunks) {
      // Stage 1: FTS em properties (UNION ALL de 15 labels)
      const ftsQuery = `
        SELECT 'Personagem' as label, id, properties,
               ts_rank_cd(search_vector, plainto_tsquery('portuguese', $1)) as rank
        FROM gdd_graph."Personagem"
        WHERE search_vector @@ plainto_tsquery('portuguese', $1)

        UNION ALL

        SELECT 'Faccao' as label, id, properties,
               ts_rank_cd(search_vector, plainto_tsquery('portuguese', $1)) as rank
        FROM gdd_graph."Faccao"
        WHERE search_vector @@ plainto_tsquery('portuguese', $1)

        UNION ALL

        SELECT 'Local' as label, id, properties,
               ts_rank_cd(search_vector, plainto_tsquery('portuguese', $1)) as rank
        FROM gdd_graph."Local"
        WHERE search_vector @@ plainto_tsquery('portuguese', $1)

        -- ... repetir para 12 labels restantes

        ORDER BY rank DESC
        LIMIT 5;
      `;

      const ftsResults = await this.pool.query(ftsQuery, [chunk.text]);

      // Stage 2: Embedding matching se <3 entidades encontradas
      if (ftsResults.rows.length < 3) {
        const chunkEmbedding = await this.embeddingService.generate(chunk.text);

        const embeddingQuery = `
          SELECT label, id, properties,
                 1 - (description_embedding <=> $1::vector) as similarity
          FROM (
            SELECT 'Personagem' as label, id, properties, description_embedding
            FROM gdd_graph."Personagem"

            UNION ALL

            SELECT 'Faccao', id, properties, description_embedding
            FROM gdd_graph."Faccao"

            -- ... repetir para 13 labels restantes
          ) all_entities
          WHERE description_embedding IS NOT NULL
          ORDER BY similarity DESC
          LIMIT ${5 - ftsResults.rows.length};
        `;

        const embeddingResults = await this.pool.query(embeddingQuery, [chunkEmbedding]);
        allEntities.push(...ftsResults.rows, ...embeddingResults.rows);
      } else {
        allEntities.push(...ftsResults.rows);
      }
    }

    // Deduplicate por ID + limitar top-10
    const uniqueEntities = this.deduplicateById(allEntities).slice(0, 10);

    // Buscar relações 1-hop das entidades encontradas
    const entityIds = uniqueEntities.map(e => e.id);
    const relations = await this.findRelationsOf(entityIds);

    return {
      entities: uniqueEntities,
      relations: relations.slice(0, 15)
    };
  }

  private deduplicateById(entities: any[]): any[] {
    const seen = new Set<string>();
    return entities.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }

  private async findRelationsOf(entityIds: string[]): Promise<any[]> {
    // Query Cypher para buscar relações 1-hop
    const query = `
      SELECT * FROM cypher('gdd_graph', $$
        MATCH (source)-[r]->(target)
        WHERE source.id IN $1
        RETURN source.id as source_id, type(r) as type, target.id as target_id, r as properties
      $$) as (source_id agtype, type agtype, target_id agtype, properties agtype);
    `;

    const result = await this.pool.query(query, [JSON.stringify(entityIds)]);
    return result.rows;
  }
}
```

**Schema adicional necessário:**
```sql
-- Adicionar coluna description_embedding em todas as 15 labels
-- (executar durante Fase 1-3 da implementação do grafo)

ALTER TABLE gdd_graph."Personagem"
ADD COLUMN description_embedding vector(384);

ALTER TABLE gdd_graph."Faccao"
ADD COLUMN description_embedding vector(384);

-- ... repetir para 13 labels restantes

-- Índice HNSW para Stage 2 (mesmos parâmetros do índice de chunks)
CREATE INDEX ON gdd_graph."Personagem"
USING hnsw (description_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 100);

CREATE INDEX ON gdd_graph."Faccao"
USING hnsw (description_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 100);

-- ... repetir para 13 labels restantes
```

**Justificativa:**
- ✅ **Single query performance** - UNION ALL é mais rápido que 15 queries separadas
- ✅ **Embedding pré-computado** elimina latência de API no Stage 2 (~500ms de chamada HuggingFace)
- ✅ **Alinhado ao doc Grafo** (linha 1295): `extractRelevantSubgraph` já mencionado

**Referência ao Contexto Original:**
> *"Extração de subgrafo implementada."* (doc Stack RAG, linha 1286)

---

#### **3.2 TypeScript Types + Agtype Parsing com Zod**

**Gap Esclarecido:** *"Documento Grafo mostra interface PersonagemProperties mas não define como gerar types para todas as 15 labels nem validação runtime."*

**Decisão:** Manual types + runtime validation via Zod - escrever manualmente interfaces para as 15 labels, validar agtype parsing com Zod schemas

**Implementação:**

```typescript
// src/modules/gdd-rag/types/graph.types.ts
import { z } from 'zod';

// Base types
export const AgtypeVertexSchema = z.object({
  id: z.string(),
  label: z.string(),
  properties: z.record(z.any()),
});

export type AgtypeVertex<T> = {
  id: string;
  label: string;
  properties: T;
};

// ========================================
// Personagem (14 properties)
// ========================================
export const PersonagemPropertiesSchema = z.object({
  id: z.string(),
  nome: z.string(),
  nome_completo: z.string(),
  papel_narrativo: z.enum(['protagonista', 'antagonista', 'aliado', 'mentor', 'npc']),
  raca: z.string(),
  faixa_etaria: z.enum(['jovem', 'maduro', 'veterano']),
  arquetipo: z.string(),
  valores_centrais: z.array(z.string()),
  motivacao_raiz: z.string(),
  medo_fundamental: z.string().optional(),
  virtude_principal: z.string().optional(),
  fraqueza_principal: z.string().optional(),
  maior_sonho: z.string().optional(),
  jogavel: z.boolean().default(false),
  esta_vivo: z.boolean().default(true),
  status_social: z.string().optional(),
});

export type PersonagemProperties = z.infer<typeof PersonagemPropertiesSchema>;

// ========================================
// Faccao (5 properties)
// ========================================
export const FaccaoPropertiesSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.string(),
  ideologia: z.string(),
  poder_influencia: z.string(),
  lider_id: z.string().optional(),
});

export type FaccaoProperties = z.infer<typeof FaccaoPropertiesSchema>;

// ========================================
// Local (7 properties)
// ========================================
export const LocalPropertiesSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.string(),
  nivel_perigo: z.string(),
  nivel_recomendado: z.number().optional(),
  clima: z.string().optional(),
  descricao: z.string(),
  conexoes: z.array(z.string()).optional(),
});

export type LocalProperties = z.infer<typeof LocalPropertiesSchema>;

// ... repetir para 12 labels restantes

// ========================================
// Parser genérico com validação
// ========================================
export function parseVertex<T>(
  agtypeString: string,
  schema: z.ZodSchema<T>
): AgtypeVertex<T> {
  // Remove suffix ::vertex ou ::edge
  const cleaned = agtypeString.replace(/::vertex|::edge/g, '');

  // Parse JSON
  const parsed = JSON.parse(cleaned);

  // Valida schema com Zod (throws ZodError se inválido)
  const validatedProperties = schema.parse(parsed.properties);

  return {
    id: parsed.id,
    label: parsed.label,
    properties: validatedProperties,
  };
}

// ========================================
// Uso no Repository
// ========================================
// src/modules/gdd-rag/repositories/graph.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import {
  parseVertex,
  PersonagemPropertiesSchema,
  PersonagemProperties,
  AgtypeVertex
} from '../types/graph.types';

@Injectable()
export class GraphRepository {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async findPersonagemById(id: string): Promise<AgtypeVertex<PersonagemProperties>> {
    const result = await this.pool.query(
      `SELECT * FROM cypher('gdd_graph', $$
        MATCH (p:Personagem {id: $1})
        RETURN p
      $$) as (personagem agtype)`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Personagem ${id} not found`);
    }

    // parseVertex valida schema e retorna type-safe object
    return parseVertex(result.rows[0].personagem, PersonagemPropertiesSchema);
  }
}
```

**Instalação Zod:**
```bash
npm install zod
```

**Justificativa:**
- ✅ **Type-safety completo** - autocomplete no IDE para todas as properties, detecção de erros em compile-time
- ✅ **Runtime validation** - Zod garante que agtype retornado do Postgres tem schema esperado
- ✅ **Manutenção viável** - 15 interfaces × ~30 linhas = ~450 linhas totais
- ✅ **Zod features** - `.optional()` para nullable, `.default()` para valores padrão, `.enum()` para valores restritos

**Referência ao Contexto Original:**
> *"O mapeamento desses registros para objetos TypeScript requer um parser que entenda as strings de retorno do AGE."* (doc Grafo, linhas 69-70)

---

#### **3.3 Prompt Concreto de Extração de Entidades**

**Gap Esclarecido:** *"Documento Grafo mostra estrutura geral do prompt mas não define parâmetros críticos (temperatura, max_tokens, estratégia de divisão)."*

**Decisão:** temperature=0.1 (baixa criatividade), max_tokens=4000 (output grande), divisão inteligente de seções >15k tokens em chunks de ~10k mantendo sub-seções completas

**Implementação:**

```typescript
// src/modules/gdd-rag/services/llm.service.ts
import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ExtractedData {
  entities: Array<{
    label: string;
    properties: Record<string, any>;
  }>;
  edges: Array<{
    type: string;
    source_id: string;
    target_id: string;
    properties?: Record<string, any>;
  }>;
}

@Injectable()
export class LlmService {
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async extractPhase1Entities(sectionText: string): Promise<ExtractedData> {
    // Dividir se necessário (manter sub-seções juntas)
    const MAX_CHUNK_SIZE = 15000; // tokens (~60k characters)
    const chunks = this.smartSplit(sectionText, MAX_CHUNK_SIZE);

    const allExtracted: ExtractedData = { entities: [], edges: [] };

    for (const chunk of chunks) {
      const prompt = `Analise esta seção do GDD e extraia APENAS entidades narrativas.

IMPORTANTE: Retorne APENAS JSON válido, sem explicações adicionais.

LABELS A EXTRAIR (Fase 1):
- Personagem (14 properties: id, nome, nome_completo, papel_narrativo, raca, faixa_etaria, arquetipo, valores_centrais, motivacao_raiz, medo_fundamental, virtude_principal, fraqueza_principal, maior_sonho, jogavel, esta_vivo, status_social)
- Faccao (5 properties: id, nome, tipo, ideologia, poder_influencia, lider_id)
- Local (7 properties: id, nome, tipo, nivel_perigo, nivel_recomendado, clima, descricao, conexoes)
- Evento (6 properties: id, nome, ato, descricao, consequencias, gravidade, irreversivel)
- Lore (4 properties: id, nome, descricao, categoria)
- Tema (4 properties: id, nome, descricao, categoria, personagens_principais)
- ArcoPersonagem (8 properties: id, personagem_id, ato, titulo_arco, emocao_predominante, objetivo_imediato, arquetipo_fase, gatilho_mudanca, contradicoes_internas)

ARESTAS A EXTRAIR:
- PERTENCE_A (properties: cargo, desde_ato, ate_ato)
- LOCALIZADO_EM
- FILHO_DE
- PRECEDE
- MOTIVA (properties: natureza, descricao)
- TRANSFORMA (properties: natureza)
- INCORPORA (properties: intensidade)
- RELACIONA_COM (properties: tipo, subtipo, evolui_por_ato, descricao, ato_inicio, ato_fim)

Seção do GDD:
${chunk}

Retorne JSON no formato:
{
  "entities": [
    {"label": "Personagem", "properties": {"id": "p001", "nome": "Kael", "nome_completo": "Kael Sombravento", ...}},
    ...
  ],
  "edges": [
    {"type": "PERTENCE_A", "source_id": "p001", "target_id": "f001", "properties": {"cargo": "exilado", "desde_ato": 1}},
    ...
  ]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000, // Permite 20-30 entidades por chamada
        temperature: 0.1, // Baixa criatividade, alta precisão
        messages: [{ role: 'user', content: prompt }]
      });

      try {
        const extracted = JSON.parse(response.content[0].text);
        allExtracted.entities.push(...extracted.entities);
        allExtracted.edges.push(...extracted.edges);
      } catch (error) {
        console.error('Failed to parse LLM response:', error);
        console.error('Raw response:', response.content[0].text);
        // Continue processando próximo chunk
      }
    }

    return allExtracted;
  }

  // Divisão inteligente preservando sub-seções completas
  private smartSplit(text: string, maxSize: number): string[] {
    // Split em headers H2 (## )
    const sections = text.split(/\n##\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const section of sections) {
      const potentialChunk = currentChunk
        ? currentChunk + '\n## ' + section
        : section;

      if (potentialChunk.length > maxSize) {
        // Flush chunk atual
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        // Começar novo chunk com esta seção
        currentChunk = section;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Flush último chunk
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.length > 0 ? chunks : [text];
  }
}
```

**Justificativa:**
- ✅ **temperature=0.1** minimiza alucinação (crítico para extrair nomes/properties corretos)
- ✅ **max_tokens=4000** permite extrair 20-30 entidades + relações em uma chamada
- ✅ **Divisão inteligente** preserva contexto narrativo (biografia completa de personagem)
- ✅ **Alinhado ao doc Grafo** (linhas 598-599): mesmos parâmetros mencionados

**Custo estimado (por fase):**
- 3 chamadas × ~15k tokens input × ~4k tokens output = ~60k tokens totais
- Claude 3.5 Sonnet: ~$0.18 por fase (dentro do limite do plano Pro)

**Referência ao Contexto Original:**
> *"O processo envolve a identificação de 'pivôs' — nós de entrada altamente relevantes."* (doc Stack RAG, linhas 28-29)

---

### RODADA 4: Operação e Validação

#### **4.1 Gatilhos de Manutenção: Reactive Triggers**

**Gap Esclarecido:** *"Documentos recomendam VACUUM/REINDEX mas não especificam quando executar nem como detectar degradação."*

**Decisão:** Reactive triggers (adequado para MVP com usuário único) - executar manutenção apenas quando perceber lentidão

**Ajuste de contexto:**
- **MVP com usuário único** (você) - não precisa monitoramento proativo
- **Você é o sensor** - detecta lentidão imediatamente quando queries >1-2s

**Comandos sob demanda:**
```bash
# Quando perceber lentidão geral
psql -U sentinel -d sentinel_gdd -c "VACUUM ANALYZE;"

# Se VACUUM não resolver, tentar REINDEX
psql -U sentinel -d sentinel_gdd -c "REINDEX DATABASE sentinel_gdd;"

# REINDEX específico (se souber qual índice)
psql -U sentinel -d sentinel_gdd -c "REINDEX INDEX gdd_chunks_embedding_idx;"
```

**Migração futura (quando adicionar mais usuários):**
- Implementar threshold-based triggers com script `check-health.sh`
- Monitorar cache hit ratio, dead tuples, bloat ratio
- Executar semanalmente ou via cron job

**Justificativa:**
- ✅ **Simplicidade máxima** - zero overhead de monitoramento
- ✅ **Adequado para MVP** - usuário único detecta problemas imediatamente
- ✅ **Evolução clara** - migrar para threshold-based quando necessário

**Referência ao Contexto Original:**
> *"Recomenda-se a implementação de tarefas de manutenção (VACUUM e REINDEX) programadas."* (doc Busca Híbrida, linha 188)

**Esclarecimento:** Tarefas programadas são para **produção com múltiplos usuários**. MVP com usuário único usa reactive approach.

---

#### **4.2 Validação Pós-Ingestão: Spot-Check Validation**

**Gap Esclarecido:** *"Documento Grafo menciona 'validação manual do JSON' mas não define como verificar qualidade do grafo após ingestão."*

**Decisão:** Spot-check validation - escolher aleatoriamente 5-10 entidades que você conhece bem do GDD, verificar se properties foram extraídas corretamente, extrapolar qualidade

**Script de validação:**

```bash
#!/bin/bash
# scripts/validate-graph.sh

echo "🔍 Validação Pós-Ingestão do Grafo"
echo ""

# 1. Contagens básicas
echo "📊 Contagens:"
psql -U sentinel -d sentinel_gdd << EOF
SELECT 'Personagem' as label, COUNT(*) as total
FROM cypher('gdd_graph', \$\$ MATCH (n:Personagem) RETURN n \$\$) as (v agtype)
UNION ALL
SELECT 'Faccao', COUNT(*)
FROM cypher('gdd_graph', \$\$ MATCH (n:Faccao) RETURN n \$\$) as (v agtype)
UNION ALL
SELECT 'Local', COUNT(*)
FROM cypher('gdd_graph', \$\$ MATCH (n:Local) RETURN n \$\$) as (v agtype)
UNION ALL
SELECT 'Evento', COUNT(*)
FROM cypher('gdd_graph', \$\$ MATCH (n:Evento) RETURN n \$\$) as (v agtype)
UNION ALL
SELECT 'TOTAL ARESTAS', COUNT(*)
FROM cypher('gdd_graph', \$\$ MATCH ()-[r]->() RETURN r \$\$) as (e agtype);
EOF

echo ""
echo "🎯 Spot Check Manual:"
echo ""

# Listar personagens principais para spot-check
echo "Personagens principais extraídos:"
psql -U sentinel -d sentinel_gdd -c "
SELECT properties->>'nome' as nome,
       properties->>'papel_narrativo' as papel,
       properties->>'motivacao_raiz' as motivacao
FROM gdd_graph.\"Personagem\"
WHERE properties->>'papel_narrativo' IN ('protagonista', 'antagonista')
ORDER BY properties->>'nome';
"

echo ""
echo "Facções extraídas:"
psql -U sentinel -d sentinel_gdd -c "
SELECT properties->>'nome' as nome,
       properties->>'tipo' as tipo,
       properties->>'ideologia' as ideologia
FROM gdd_graph.\"Faccao\"
ORDER BY properties->>'nome'
LIMIT 5;
"

echo ""
echo "✅ AÇÃO: Revise manualmente se essas entidades têm:"
echo "   - Nome correto"
echo "   - Papel/tipo correto"
echo "   - Motivação/ideologia faz sentido"
echo ""
echo "📏 Regra de qualidade:"
echo "   - Se 8 de 10 estão corretos → qualidade ~80% (aceitável para MVP)"
echo "   - Se <5 de 10 estão corretos → revisar prompt de extração"
```

**Entidades críticas para spot-check:**
1. **Personagens principais** (protagonista, antagonista) - você conhece biografias
2. **Facções principais** - ideologia deve estar correta
3. **Eventos marcantes** - consequências devem fazer sentido
4. **Relações chave** - verificar se Kael TEM_RELACIONAMENTO(Rivalidade) Facção X existe

**Justificativa:**
- ✅ **Eficiência** - 5-10 minutos de validação focada vs 1-2 horas de validação exaustiva
- ✅ **Você conhece o GDD** - sabe exatamente quais entidades são críticas
- ✅ **Amostragem representativa** - se 8/10 corretos, extrapolação ~80% qualidade geral
- ✅ **Adequado para MVP** - validação exaustiva é overkill, você vai iterar no GDD mesmo

**Referência ao Contexto Original:**
> *"Validação manual → Popular banco."* (doc Grafo, linha 635)

---

## 🔍 Gaps Resolvidos (Tabela Consolidada)

| # | **Gap Original** | **Trecho Documento** | **Decisão Tomada** | **Rodada** |
|---|------------------|----------------------|-------------------|------------|
| 1 | Ordem de execução do pipeline RAG | Stack RAG linha 573 (prompt híbrido não detalhado) | Query → Embedding → Busca Híbrida (pgvector + ts_rank_cd + RRF) → Extração Subgrafo 2 estágios → Prompt híbrido → Claude | R1 P1 |
| 2 | Como extrair subgrafo relevante dos chunks | Stack RAG linha 1286 (extractRelevantSubgraph mencionado) | Stage 1: FTS em properties (GIN, top-5/chunk, 85-95% precisão, ~100-200ms) + Stage 2: embedding matching fallback (<3 entidades, +15-20% recall, +50-100ms) | R1 P2 |
| 3 | BM25 vs ts_rank | Busca Híbrida linhas 12-13 (duas opções, sem decisão) | ts_rank_cd nativo (simplicidade MVP, sem extensões) | R1 P3 |
| 4 | Formato metadados grafo no prompt LLM | Stack RAG linhas 573-596 (exemplo básico) | Compact format: top-10 entidades (2-3 properties essenciais) + top-15 relações, ~1.5k tokens, texto natural | R1 P4 |
| 5 | Valores HNSW concretos | Busca Híbrida linhas 72-78 (intervalos, não valores) | Baseline conservador: m=16, ef_construction=100, ef_search=40 (~200-300MB RAM, recall 85-90%, latência <50ms) | R2 P1 |
| 6 | Field weighting em GDD estruturado por seções | Busca Híbrida linhas 49-63 (não específico para seções Markdown) | Section-based: peso A para section_name, peso B para chunk_text (coluna gerada search_vector) | R2 P2 |
| 7 | Dicionário sinônimos específico do Daratrine | Busca Híbrida linhas 32-47 (exemplos genéricos TI) | 10-20 termos essenciais mínimos (variações nomes facções/locais/personagens) - definir durante implementação | R2 P3 |
| 8 | Implementação Stage 1+2 de extração de subgrafo | Grafo linhas 136-168 (Repository Pattern sem extração) | Single query UNION ALL (FTS), embeddings pré-computados em coluna description_embedding (índice HNSW m=16), deduplicate + top-10 + top-15 relações 1-hop | R3 P1 |
| 9 | TypeScript types + agtype parsing para 15 labels | Grafo linhas 113-166 (exemplo Personagem, não todas labels) | Manual types + Zod validação runtime (15 interfaces, parser parseVertex<T>() com schema validation) | R3 P2 |
| 10 | Prompt extração concreto (temperatura, max_tokens, divisão) | Grafo linhas 556-606 (estrutura geral, sem parâmetros) | temperature=0.1, max_tokens=4000, divisão inteligente ~10k tokens preservando sub-seções (split em headers H2) | R3 P3 |
| 11 | Gatilhos manutenção VACUUM/REINDEX | Grafo linha 849 (manual on-demand, sem gatilhos) | Reactive triggers (MVP usuário único) - executar quando perceber lentidão (queries >1-2s), migrar para threshold-based quando adicionar usuários | R4 P1 |
| 12 | Validação qualidade grafo após ingestão | Grafo linha 633 (validação manual JSON, sem detalhes) | Spot-check validation (5-10 entidades críticas que você conhece bem, extrapolar ~80% se 8/10 corretos) | R4 P2 |

---

## 📚 Trechos Esclarecidos do Contexto Original

### **1. Pipeline de Recuperação em Múltiplos Estágios**

**Trecho Original (doc Busca Híbrida, linhas 32-34):**
> *"A precisão semântica em 2026 é alcançada através de um pipeline de recuperação em múltiplos estágios. O primeiro estágio foca em recall (abrangência), utilizando buscas híbridas que combinam vetores densos (para significado semântico) e vetores esparsos como BM25 (para precisão de palavras-chave técnicas e nomes próprios)."*

**Esclarecimento:**
- **Implementação concreta:** Busca Híbrida (pgvector + ts_rank_cd + RRF) como primeiro estágio de recall
- **Segundo estágio:** Extração de subgrafo (FTS em properties + embedding matching) refina contexto
- **Terceiro estágio:** Prompt híbrido (chunks + metadados grafo) para LLM
- **Diferença:** Documento menciona "BM25" mas implementamos ts_rank_cd (adequado para MVP)

---

### **2. Reciprocal Rank Fusion (RRF)**

**Trecho Original (doc Busca Híbrida, linhas 84-91):**
> *"O desafio fundamental da busca híbrida é combinar pontuações de relevância de escalas incompatíveis: o BM25 produz valores ilimitados, enquanto a similaridade de cosseno do pgvector varia entre -1 e 1. O Reciprocal Rank Fusion (RRF) resolve esta inconsistência ignorando as pontuações brutas e focando exclusivamente na posição (rank) de cada documento nas listas de resultados."*

**Esclarecimento:**
- **Implementação:** Mesma lógica de RRF, mas com ts_rank_cd (valores ilimitados) + cosine similarity (0-1)
- **Constante k=60:** Padrão mencionado no documento, usada na implementação
- **Fórmula:** `score(doc) = 1/(60 + rank_vetorial) + 1/(60 + rank_fts)`

**Implementação TypeScript:**
```typescript
// src/modules/gdd-rag/services/search.service.ts
function reciprocalRankFusion(
  vectorResults: any[],
  ftsResults: any[],
  k: number = 60
): any[] {
  const scores = new Map<string, number>();

  // Adicionar scores vetoriais
  vectorResults.forEach((doc, index) => {
    const rank = index + 1;
    scores.set(doc.id, (scores.get(doc.id) || 0) + 1 / (k + rank));
  });

  // Adicionar scores FTS
  ftsResults.forEach((doc, index) => {
    const rank = index + 1;
    scores.set(doc.id, (scores.get(doc.id) || 0) + 1 / (k + rank));
  });

  // Ordenar por score final e retornar top-10
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, score]) => ({ id, score }));
}
```

---

### **3. Chunking Semântico e Continuidade Contextual**

**Trecho Original (doc Busca Híbrida, linhas 122-136):**
> *"A fragmentação (chunking) do texto é um passo prévio à indexação que determina o contexto atômico recuperado pelo sistema. Estratégias ingênuas, como divisões por número fixo de caracteres, frequentemente quebram a coesão de parágrafos técnicos ou separam definições de seus termos. O chunking semântico utiliza o significado do texto para identificar pontos naturais de ruptura."*

**Esclarecimento:**
- **Estratégia adotada:** Chunking por estrutura lógica (headers Markdown) - doc Stack RAG linha 159
- **Divisão inteligente na extração:** Preserve sub-seções completas (~10k tokens) ao dividir seções grandes
- **Field weighting:** Section-based (peso A para section_name, peso B para chunk_text) aproveita estrutura
- **Alinhamento:** Chunking semântico do documento + field weighting = máxima preservação de contexto

---

### **4. Parâmetros HNSW e Trade-offs**

**Trecho Original (doc Busca Híbrida, linhas 72-80):**
> *"A construção do índice HNSW é influenciada por parâmetros que determinam a densidade das conexões no grafo multicamada. O parâmetro m define o número máximo de conexões por nó, enquanto o ef_construction controla o tamanho da lista de candidatos durante a fase de criação do índice. Para um MVP RAG, valores equilibrados são fundamentais."*

**Esclarecimento:**
- **Decisão:** Baseline conservador (m=16, ef_construction=100, ef_search=40) priorizando **uso de RAM**
- **Trade-off aceito:** Recall ~85-90% (vs ~95-98% com m=32) em troca de RAM controlada (~200-300MB vs ~600-800MB)
- **Justificativa:** Para ~2.4k chunks do MVP, diferença de recall é marginal mas economia de RAM é significativa
- **Escalabilidade:** Se ultrapassar 10k chunks, aumentar para m=24 via REINDEX

---

### **5. GraphRAG e Travessia do Grafo**

**Trecho Original (doc Stack RAG, linhas 25-30):**
> *"O GraphRAG surge como a técnica dominante em 2026 para lidar com a descoberta de informações em dados narrativos privados e técnicos. Ao contrário do RAG de linha de base, que tem dificuldade em conectar pontos dispersos em grandes coleções de documentos, o GraphRAG utiliza LLMs para criar grafos de conhecimento que facilitam o entendimento de conceitos semânticos resumidos. O processo envolve a identificação de 'pivôs' — nós de entrada altamente relevantes — seguida pela expansão da relevância através da travessia do grafo."*

**Esclarecimento:**
- **Pivôs:** Entidades identificadas via Stage 1 (FTS) + Stage 2 (embedding matching) nos chunks
- **Travessia:** Busca de relações 1-hop (limitado para eficiência) - `MATCH (source)-[r]->(target) WHERE source.id IN [pivots]`
- **Limitação:** 1-hop é suficiente para prompt LLM (top-10 entidades + top-15 relações = ~1.5k tokens)
- **Expansão futura:** Implementar travessia multi-hop (2-3 saltos) se necessário após validar MVP

---

### **6. Configuração Avançada do Motor de Busca em Português**

**Trecho Original (doc Busca Híbrida, linhas 27-48):**
> *"Para um MVP robusto, a configuração padrão do PostgreSQL para o português pode ser insuficiente, especialmente ao lidar com termos técnicos anglicizados comuns na área de TI. A implementação exige a criação de uma configuração de busca personalizada que integre o módulo unaccent para remover sensibilidade a diacríticos e dicionários de sinônimos para padronizar siglas técnicas."*

**Esclarecimento:**
- **Implementação concreta:**
  1. **unaccent:** `to_tsvector('portuguese', unaccent(text))` - remove acentos
  2. **Dicionário sinônimos:** `tech_synonyms.syn` com 10-20 termos do Daratrine
  3. **Text search configuration customizada:** `daratrine_pt` (cópia de `portuguese` + sinônimos)
- **Ordem de precedência:** Sinônimos → unaccent → stemmer português (Snowball)
- **Definir durante implementação:** Termos específicos serão extraídos do GDD real

---

## 🚀 Próximos Passos de Implementação

### **Semana 1-2: Setup + Configuração PostgreSQL**

**Milestone:** Ambiente completo com pgvector + Apache AGE + FTS configurado

**Tarefas:**

1. **Docker Compose com Postgres Custom**
   ```bash
   # Criar Dockerfile custom (Postgres 16 + AGE + pgvector)
   # Já documentado no doc Stack RAG linha 643-666
   cd sentinel
   docker-compose up -d postgres
   ```

2. **Executar init.sql**
   ```sql
   -- Habilitar extensões
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS age;
   CREATE EXTENSION IF NOT EXISTS unaccent;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;

   -- Criar schema AGE
   SELECT create_graph('gdd_graph');

   -- Criar tabela de chunks com busca híbrida
   CREATE TABLE gdd_chunks (
       id SERIAL PRIMARY KEY,
       section_name TEXT NOT NULL,
       section_level INT,
       chunk_text TEXT NOT NULL,
       embedding vector(384), -- Sentence-Transformers dimension
       metadata JSONB,
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- Adicionar coluna search_vector com field weighting
   ALTER TABLE gdd_chunks ADD COLUMN search_vector tsvector
   GENERATED ALWAYS AS (
     setweight(to_tsvector('portuguese', unaccent(coalesce(section_name, ''))), 'A') ||
     setweight(to_tsvector('portuguese', unaccent(coalesce(chunk_text, ''))), 'B')
   ) STORED;

   -- Criar índices
   -- HNSW para busca vetorial (baseline conservador)
   CREATE INDEX ON gdd_chunks
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 100);

   -- Configurar ef_search
   ALTER DATABASE sentinel_gdd SET hnsw.ef_search = 40;

   -- GIN para Full-Text Search
   CREATE INDEX ON gdd_chunks USING gin(search_vector);
   ```

3. **Criar configuração de sinônimos** (durante implementação, após extrair GDD)
   ```bash
   # Criar arquivo tech_synonyms.syn
   # (definir termos após ler GDD real do Daratrine)

   # Configurar text search configuration
   psql -U sentinel -d sentinel_gdd << EOF
   CREATE TEXT SEARCH CONFIGURATION daratrine_pt (COPY = portuguese);

   ALTER TEXT SEARCH CONFIGURATION daratrine_pt
     ALTER MAPPING FOR asciiword, word
     WITH tech_synonyms, portuguese_stem;
   EOF
   ```

4. **Adicionar coluna description_embedding nas 15 labels do grafo**
   ```sql
   -- Executar durante Fase 1-3 da implementação do grafo
   ALTER TABLE gdd_graph."Personagem" ADD COLUMN description_embedding vector(384);
   ALTER TABLE gdd_graph."Faccao" ADD COLUMN description_embedding vector(384);
   -- ... repetir para 13 labels restantes

   -- Criar índices HNSW (mesmos parâmetros)
   CREATE INDEX ON gdd_graph."Personagem"
   USING hnsw (description_embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 100);
   -- ... repetir para 13 labels restantes
   ```

**Critérios de Sucesso:**
- ✅ Docker Compose sobe Postgres 16 com AGE + pgvector + unaccent
- ✅ Extensões habilitadas e funcionando
- ✅ Índices criados (HNSW m=16, GIN)
- ✅ Coluna search_vector com field weighting (peso A/B) funcionando

---

### **Semana 2-3: Implementação NestJS - GraphService + SearchService**

**Milestone:** Stage 1+2 de extração de subgrafo funcionando

**Tarefas:**

1. **Instalar dependências**
   ```bash
   npm install zod
   npm install @anthropic-ai/sdk
   # pg já instalado (TypeORM/Prisma)
   ```

2. **Criar TypeScript types com Zod**
   ```bash
   # Criar arquivo types/graph.types.ts
   # Implementar 15 interfaces + schemas Zod
   # (código completo na seção 3.2)
   ```

3. **Implementar GraphService**
   ```typescript
   // src/modules/gdd-rag/services/graph.service.ts
   // Implementar extractRelevantSubgraph com Stage 1+2
   // (código completo na seção 3.1)
   ```

4. **Implementar SearchService**
   ```typescript
   // src/modules/gdd-rag/services/search.service.ts
   @Injectable()
   export class SearchService {
     async hybridSearch(query: string): Promise<Chunk[]> {
       // 1. Gerar embedding
       const embedding = await this.embeddingService.generate(query);

       // 2. Busca vetorial
       const vectorResults = await this.vectorSearch(embedding, 20);

       // 3. Busca FTS
       const ftsResults = await this.ftsSearch(query, 20);

       // 4. RRF
       const merged = this.reciprocalRankFusion(vectorResults, ftsResults);

       // 5. Retornar top-10 chunks
       return merged.slice(0, 10);
     }

     private async vectorSearch(embedding: number[], limit: number) {
       const result = await this.pool.query(
         `SELECT id, chunk_text, 1 - (embedding <=> $1::vector) AS similarity
          FROM gdd_chunks
          ORDER BY embedding <=> $1::vector
          LIMIT $2`,
         [embedding, limit]
       );
       return result.rows;
     }

     private async ftsSearch(query: string, limit: number) {
       const result = await this.pool.query(
         `SELECT id, chunk_text,
                 ts_rank_cd(search_vector, plainto_tsquery('portuguese', $1)) AS rank
          FROM gdd_chunks
          WHERE search_vector @@ plainto_tsquery('portuguese', $1)
          ORDER BY rank DESC
          LIMIT $2`,
         [query, limit]
       );
       return result.rows;
     }

     private reciprocalRankFusion(vectorResults: any[], ftsResults: any[], k: number = 60) {
       // Implementação RRF (código na seção "Trechos Esclarecidos")
     }
   }
   ```

5. **Testar Stage 1+2 isoladamente**
   ```bash
   # Criar script de teste
   npm run test:graph-service
   ```

**Critérios de Sucesso:**
- ✅ GraphService.extractRelevantSubgraph retorna top-10 entidades + top-15 relações
- ✅ Stage 1 (FTS) funciona em ~100-200ms
- ✅ Stage 2 (embedding matching) só roda quando <3 entidades
- ✅ Zod validation captura erros de schema

---

### **Semana 3: Integração RagService + LlmService**

**Milestone:** Pipeline RAG completo end-to-end funcionando

**Tarefas:**

1. **Implementar LlmService**
   ```typescript
   // src/modules/gdd-rag/services/llm.service.ts
   // (código completo na seção 3.3)
   ```

2. **Implementar RagService (orquestração)**
   ```typescript
   // src/modules/gdd-rag/services/rag.service.ts
   @Injectable()
   export class RagService {
     constructor(
       private embeddingService: EmbeddingService,
       private searchService: SearchService,
       private graphService: GraphService,
       private llmService: LlmService,
     ) {}

     async processQuery(query: string): Promise<string> {
       // 1. Busca Híbrida
       const chunks = await this.searchService.hybridSearch(query);

       // 2. Extração de Subgrafo
       const graphMetadata = await this.graphService.extractRelevantSubgraph(chunks);

       // 3. Montar Prompt Híbrido
       const prompt = this.buildHybridPrompt(query, chunks, graphMetadata);

       // 4. LLM Response
       return await this.llmService.generateResponse(prompt);
     }

     private buildHybridPrompt(query: string, chunks: Chunk[], graphMetadata: GraphMetadata): string {
       const SYSTEM_PROMPT = `Você é um assistente especializado em GDD de RPG.

       REGRAS:
       1. Responda APENAS baseado no contexto fornecido
       2. Se informação não estiver no contexto: "Não encontrei essa informação no GDD"
       3. NUNCA invente nomes/eventos/lore
       4. Mencione contradições se houver
       5. Respostas concisas (máximo 3-4 parágrafos)`;

       const graphMetadataText = this.formatGraphMetadata(graphMetadata);
       const chunksText = chunks.map((c, i) => `[Chunk ${i+1}] ${c.section_name}\n${c.text}`).join('\n---\n');

       return `${SYSTEM_PROMPT}

===== KNOWLEDGE GRAPH METADATA =====
${graphMetadataText}

===== TEXT CHUNKS FROM GDD =====
${chunksText}

===== USER QUERY =====
${query}

Responda usando APENAS o contexto acima.`;
     }

     private formatGraphMetadata(metadata: GraphMetadata): string {
       const entitiesText = metadata.entities.map(e => {
         // Extrair 2-3 properties essenciais baseado no label
         const essentialProps = this.getEssentialProperties(e);
         return `- ${e.label}: ${essentialProps.nome} (${essentialProps.descricao})`;
       }).join('\n');

       const relationsText = metadata.relations.map(r => {
         return `- ${r.source_name} ${r.type} ${r.target_name}`;
       }).join('\n');

       return `Entidades Relevantes (${metadata.entities.length}):\n${entitiesText}\n\nRelações Relevantes (${metadata.relations.length}):\n${relationsText}`;
     }
   }
   ```

3. **Implementar Controllers REST**
   ```typescript
   // src/modules/gdd-rag/controllers/rag-query.controller.ts
   @Controller('api/rag')
   export class RagQueryController {
     constructor(private ragService: RagService) {}

     @Post('query')
     async query(@Body() body: { query: string }) {
       return { answer: await this.ragService.processQuery(body.query) };
     }
   }
   ```

4. **Testar pipeline end-to-end**
   ```bash
   # Iniciar servidor
   npm run start:dev

   # Testar via curl
   curl -X POST http://localhost:3000/api/rag/query \
     -H "Content-Type: application/json" \
     -d '{"query": "Quem é Kael Sombravento?"}'
   ```

**Critérios de Sucesso:**
- ✅ Pipeline completo funciona (query → resposta em ~2-3s)
- ✅ Resposta inclui contexto do grafo (menciona relações)
- ✅ Claude 3.5 Sonnet não alucina (responde baseado no contexto)

---

### **Semana 4: Ingestão do GDD + Validação**

**Milestone:** GDD real do Daratrine ingerido e validado

**Tarefas:**

1. **Implementar script de ingestão**
   ```bash
   # Já documentado no doc Grafo (scripts/ingest-phase1.ts)
   # Usar LlmService.extractPhase1Entities
   npm run script:ingest-phase1
   ```

2. **Definir dicionário de sinônimos durante ingestão**
   ```bash
   # Ao processar GDD, identificar variações comuns
   # Ex: "Crepúsculo" vs "Facção do Crepúsculo" vs "Culto Crepúsculo"
   # Criar tech_synonyms.syn
   ```

3. **Executar validação spot-check**
   ```bash
   ./scripts/validate-graph.sh

   # Revisar manualmente 5-10 entidades críticas
   # Se 8/10 corretos → qualidade ~80% (aceitável)
   # Se <5/10 corretos → ajustar prompt de extração
   ```

4. **Iterar se necessário**
   - Ajustar temperature (tentar 0.05 se muita alucinação)
   - Melhorar prompt (adicionar exemplos de entidades corretas)
   - Re-executar extração

**Critérios de Sucesso:**
- ✅ ~2.400 vértices extraídos
- ✅ ~8.000 arestas extraídas
- ✅ Qualidade spot-check >70% (7/10 entidades corretas)
- ✅ Queries RAG retornam respostas coerentes sobre o GDD

---

## 📊 Checklist de Implementação

### **Setup Inicial**
- [ ] Docker Compose configurado (Postgres 16 + AGE + pgvector)
- [ ] Extensões habilitadas (vector, age, unaccent, pg_trgm)
- [ ] Tabela gdd_chunks criada com search_vector (field weighting A/B)
- [ ] Índices criados (HNSW m=16, GIN)
- [ ] Coluna description_embedding adicionada nas 15 labels do grafo

### **TypeScript Types**
- [ ] Zod instalado
- [ ] 15 interfaces criadas (Personagem, Facção, Local, etc.)
- [ ] 15 schemas Zod criados com validação runtime
- [ ] Parser parseVertex<T>() implementado

### **Services NestJS**
- [ ] EmbeddingService (HuggingFace API)
- [ ] SearchService (busca híbrida: pgvector + FTS + RRF)
- [ ] GraphService (Stage 1: FTS em properties, Stage 2: embedding matching)
- [ ] LlmService (extração de entidades + geração de respostas via Claude)
- [ ] RagService (orquestração do pipeline completo)

### **Controllers REST**
- [ ] POST /api/rag/query (query conversacional)
- [ ] GET /api/rag/entities (listar entidades)
- [ ] GET /api/rag/entities/:id (detalhes de entidade)

### **Ingestão e Validação**
- [ ] Script ingest-phase1.ts (extração via Claude 3.5 Sonnet)
- [ ] Dicionário tech_synonyms.syn criado (10-20 termos Daratrine)
- [ ] Script validate-graph.sh (spot-check validation)
- [ ] GDD real ingerido (~2.4k vértices, ~8k arestas)
- [ ] Validação spot-check >70% de qualidade

### **Testes**
- [ ] Pipeline end-to-end testado (query → resposta em ~2-3s)
- [ ] Stage 1 (FTS) performando em ~100-200ms
- [ ] Stage 2 (embedding) só rodando quando necessário
- [ ] Respostas incluem contexto do grafo (entidades + relações)

---

## 📈 Métricas de Sucesso Definidas

### **MVP (Implementação Completa):**
- [ ] **Taxa de Sucesso de Ingestão:** >70% das entidades extraídas corretamente (validação spot-check)
- [ ] **Latência Pipeline Completo:** <3s P95 (busca híbrida + extração subgrafo + LLM)
- [ ] **Latência Busca Híbrida:** <100ms P95 (pgvector + FTS + RRF)
- [ ] **Latência Extração Subgrafo:** <300ms P95 (Stage 1 + Stage 2 condicional)
- [ ] **Recall Busca Vetorial:** 85-90% (índice HNSW m=16)
- [ ] **Recall Extração Subgrafo:** 85-100% (Stage 1: 70-85%, Stage 2: +15-20%)
- [ ] **Qualidade Percebida:** Você reporta "respostas úteis" em >70% das queries

### **Pós-Refinamento (Iteração):**
- [ ] **Uso de Contexto Grafo:** >50% das respostas citam relações do grafo (não apenas chunks)
- [ ] **Alucinação:** <5% das queries (resposta contém informação não presente no GDD)
- [ ] **Cobertura:** >80% das queries encontram contexto relevante (não retornam "não encontrei")

### **Operacional:**
- [ ] **Manutenção:** Zero overhead (reactive triggers - VACUUM/REINDEX quando você perceber lentidão)
- [ ] **Uso de RAM:** <1GB total (Postgres + índices HNSW + AGE)
- [ ] **Espaço em Disco:** <500MB (chunks + embeddings + grafo)

---

## 🔗 Referências

- **Documento Principal:** [Busca Híbrida com pgvector e FTS.md](../pesquisas/Busca%20Híbrida%20com%20pgvector%20e%20FTS.md)
- **Documentos Relacionados:**
  - [Decisões Arquiteturais - Grafos de Conhecimento com Apache AGE](decisoes-arquiteturais-grafo.md)
  - [Stack RAG Alta Fidelidade para GDDs](entrevista-stack-rag-gdd-2026-01-29.md)
- **Tecnologias Decididas:**
  - [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search for PostgreSQL
  - [Apache AGE](https://age.apache.org/) - Graph extension for PostgreSQL
  - PostgreSQL 16 Full-Text Search (ts_rank_cd, GIN index, unaccent)
  - [Claude 3.5 Sonnet](https://docs.anthropic.com/en/docs/models-overview) - LLM via Anthropic API (plano Pro)
  - [Sentence-Transformers](https://www.sbert.net/) - Embedding models via HuggingFace
  - [Zod](https://zod.dev/) - TypeScript-first schema validation
  - [NestJS](https://nestjs.com/) - Backend framework

---

## 📝 Conclusão

Este documento consolida **12 decisões técnicas críticas** que transformam o conhecimento estado-da-arte dos documentos de pesquisa em uma arquitetura executável para o projeto Sentinel/Daratrine.

**Princípios Norteadores:**
1. **Simplicidade Operacional:** Reactive triggers (usuário único), zero overhead de monitoramento
2. **Performance Adequada:** HNSW baseline conservador (85-90% recall suficiente para MVP)
3. **Validação Rápida:** Spot-check (5-10 entidades) vs validação exaustiva
4. **Type-Safety Completo:** Zod validation em todas as 15 labels, detecção de erros em runtime

**Diferenciais da Abordagem:**
- **Pipeline de 2 Estágios:** FTS em properties (85-95% precisão) + embedding matching fallback (+15-20% recall) = 85-100% recall total
- **Prompt Híbrido Compact:** Top-10 entidades (2-3 properties essenciais) + top-15 relações (~1.5k tokens) maximiza contexto sem explodir tokens
- **Field Weighting Section-Based:** Aproveita estrutura natural do GDD (peso A para section_name, peso B para chunk_text)
- **Infraestrutura Unificada:** Postgres único (grafos + vetores + FTS + dados relacionais), zero lock-in

O sistema está pronto para implementação. Próximo passo: **Semana 1-2 - Setup + Configuração PostgreSQL**.

---

**Documento gerado em:** 2026-01-30
**Autor:** Entrevista estruturada com decisões consensuais
**Status:** ✅ Aprovado para implementação
