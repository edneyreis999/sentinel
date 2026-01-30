# Relatório de Entrevista: Stack RAG Alta Fidelidade para GDDs
**Projeto:** Sentinel
**Data:** 2026-01-29
**Contexto Original:** [Stack RAG Alta Fidelidade para GDDs.md](../pesquisas/Stack%20RAG%20Alta%20Fidelidade%20para%20GDDs.md)
**Objetivo:** Implementação Técnica

---

## Sumário Executivo

Este documento consolida as decisões arquiteturais tomadas durante entrevista estruturada para implementação de um sistema de **Retrieval-Augmented Generation (RAG) de alta fidelidade** focado em Documentos de Game Design (GDD) narrativos no projeto Sentinel.

A entrevista esclareceu **19 gaps críticos** identificados no documento de pesquisa original, transformando conhecimento estado-da-arte em decisões executáveis, priorizando **simplicidade operacional, baixo custo inicial e validação rápida de valor** para um MVP.

### ⚡ Decisão Chave: Claude 3.5 Sonnet via Plano Pro

**Contexto:** O desenvolvedor possui plano Claude Pro ($20/mês flat fee) com acesso ao Claude CLI local. A decisão foi usar **Claude 3.5 Sonnet** (via Anthropic API) em vez de GPT-4o, aproveitando a mesma API key do plano Pro.

**Benefícios:**
- ✅ **Custo zero adicional no MVP** (conta no limite do plano Pro: ~150-200 mensagens/dia)
- ✅ **Qualidade superior para narrativa:** Claude é melhor em coerência narrativa e worldbuilding
- ✅ **Menos alucinações em RAG:** Taxa inferior de alucinações comparado a GPT-4o em tarefas de retrieval
- ✅ **Contexto maior:** 200k tokens vs 128k do GPT-4o
- ✅ **Uso em produção futura:** Continuará usando Claude (plano Pro ou pay-per-use conforme escala)

**Nota Técnica:** O Claude CLI usa a Anthropic API por baixo dos panos. A mesma API key funciona tanto no CLI quanto no código NestJS via SDK `@anthropic-ai/sdk`, garantindo portabilidade total (desenvolvimento local, Docker, VPS).

---

## 🎯 Abordagem Arquitetural Escolhida

### **Arquitetura Monolítica Simplificada no NestJS**

**Decisão:** Implementar o sistema RAG como um módulo isolado dentro do monolito NestJS existente (Sentinel), com PostgreSQL como banco de dados único (grafos + vetores + dados relacionais) e APIs externas para LLM/embeddings.

#### **Justificativa:**

1. **Validação antes de Complexidade:** O documento de pesquisa descreve o estado-da-arte de produção (2026), mas **não é um ponto de partida**. A arquitetura monolítica permite validar a proposta de valor ("GraphRAG melhora a qualidade das respostas sobre GDD?") antes de investir em microserviços, orquestração e infraestrutura complexa.

2. **Simplicidade Operacional:** Um único repositório, uma linguagem principal (TypeScript), um banco de dados, deploy único. Zero overhead de comunicação inter-serviços (gRPC/NATS se torna desnecessário).

3. **Custo Mínimo:**
   - Postgres self-hosted (Docker Compose)
   - HuggingFace Inference API (free tier para embeddings)
   - Claude 3.5 Sonnet via plano Pro existente ($20/mês flat fee, sem custo adicional no MVP)
   - VPS tradicional ($10-40/mês vs $200+ de managed services)

4. **Caminho de Evolução Claro:** A arquitetura permite migração futura para microserviços se/quando necessário:
   - **Trigger:** Latência de embeddings via API > 500ms P95, ou necessidade de modelos locais (ColBERT, cross-encoders) por custo/privacidade
   - **Migração:** Extrair módulo `gdd-rag` para serviço Python/FastAPI separado, adicionar gRPC/NATS

**Referência ao Contexto Original:**
> *"A stack tecnológica para sustentar este pipeline complexo em 2026 baseia-se em uma arquitetura de microserviços orquestrada por NestJS, atuando como o Backend-for-Frontend (BFF)."* (linhas 48-51 do documento pesquisado)

**Esclarecimento:** Essa é a arquitetura **final** de produção descrita no documento. Para MVP, começamos com monolito e evoluímos conforme necessário (princípio YAGNI - You Aren't Gonna Need It).

---

## 📊 Decisões Técnicas Consolidadas

### 1. Arquitetura de Dados

#### **1.1 Banco de Grafos: Apache AGE (PostgreSQL Extension)**

**Gap Esclarecido:** *"O documento menciona grafos de conhecimento mas não especifica qual banco usar entre Neo4j, Memgraph, FalkorDB, JanusGraph, etc."*

**Decisão:** PostgreSQL + Apache AGE

**Justificativa:**
- **Infraestrutura Unificada:** Grafos + vetores + dados relacionais no mesmo DB (zero custo adicional de licenciamento)
- **Simplicidade:** Elimina complexidade de gerenciar múltiplos bancos
- **Cypher Compatível:** AGE suporta Cypher query language (padrão da indústria para grafos)
- **Performance Suficiente:** Para escala média (centenas de nós/milhares de arestas no MVP), AGE é adequado

**Trade-off Aceito:** Performance inferior ao Neo4j/Memgraph em grafos massivos (milhões de nós), mas irrelevante para MVP.

**Referência ao Contexto Original:**
> *"A base de um sistema de RAG de alta fidelidade para 2026 começa na fase de ingestão. O paradigma de 'Garbage In, Garbage Out' é intensificado em documentos complexos como GDDs, onde a fragmentação arbitrária de texto (chunking) destrói a continuidade contextual necessária para entender mecânicas de RPG. A solução adotada pela indústria envolve a construção de grafos de conhecimento orientados por ontologias."* (linhas 19-23)

---

#### **1.2 Vector Database: pgvector (PostgreSQL Extension)**

**Gap Esclarecido:** *"O documento fala em 'busca vetorial' mas não especifica entre Pinecone, Qdrant, Weaviate, pgvector, Redis Vector, etc."*

**Decisão:** pgvector no PostgreSQL

**Justificativa:**
- **Coesão Arquitetural:** Mantém tudo no Postgres (AGE + pgvector + dados relacionais)
- **Zero Custo Extra:** Extensão open-source, sem licenças adicionais
- **Performance Adequada:** HNSW index suporta escala média (10k-100k vetores) com latência <100ms
- **Queries Cross-Domain:** Pode combinar busca vetorial + queries SQL relacionais em uma única transação

**Migração Futura:** Se ultrapassar 500k vetores ou precisar de filtros avançados, migrar para Qdrant (self-hosted) ou Weaviate mantendo a mesma lógica de aplicação.

**Referência ao Contexto Original:**
> *"A precisão semântica em 2026 é alcançada através de um pipeline de recuperação em múltiplos estágios. O primeiro estágio foca em recall (abrangência), utilizando buscas híbridas que combinam vetores densos (para significado semântico) e vetores esparsos como BM25 (para precisão de palavras-chave técnicas e nomes próprios)."* (linhas 32-34)

---

#### **1.3 Ontologia de Domínio: Narrativa RPG**

**Gap Esclarecido:** *"O documento diz 'construir ontologia de domínio RPG' mas não define quais entidades, relações, formato (OWL/RDF/custom), ou como modelar versionamento."*

**Decisão:** Ontologia Narrativa com Relacionamentos Emocionais/Temáticos

**Entidades Core:**
- **Personagem** (NPCs, protagonistas)
- **Facção/Organização** (reinos, guildas)
- **Localização** (cidades, dungeons, regiões)
- **Evento** (marcos históricos)
- **Lore/Conceito** (mitologia, cosmologia)
- **Missão/Quest** (arcos narrativos)
- **Relacionamento** (amizade, rivalidade, amor, traição)
- **Arco de Personagem** (desenvolvimento emocional)
- **Tema Narrativo** (temas explorados na história)

**Relações (Arestas do Grafo):**

**Estruturais:**
- `PERTENCE_A` (Personagem → Facção)
- `LOCALIZADO_EM` (Personagem/Evento → Localização)
- `PARTICIPA_DE` (Personagem → Missão/Evento)
- `RELACIONADO_COM` (Lore → Lore)
- `MENCIONA` (Missão → Personagem/Localização/Lore)

**Temporais:**
- `ACONTECE_ANTES/DEPOIS` (Evento → Evento)
- `DESENCADEIA` (Evento → Missão)
- `CONTRADIZ` (Lore → Lore)
- `VERSÃO_DE` (para versionamento de GDD)

**Emocionais/Temáticas:**
- `TEM_RELACIONAMENTO` (Personagem → Relacionamento → Personagem)
- `EVOLUI_EM` (Personagem → Arco)
- `EXPLORA_TEMA` (Missão/Arco → Tema)
- `CONFLITA_COM` (Facção → Facção)
- `MOTIVA` (Evento → Personagem)

**Justificativa:**
- Foco em **worldbuilding e narrativa** (não mecânicas de combate/progressão inicialmente)
- Suporta queries complexas: *"Quais personagens da Facção X têm rivalidade com NPCs da Localização Y durante o Evento Z?"*
- Permite análise temática e rastreamento de arcos emocionais (character-driven stories)
- **Expansão Futura:** Adicionar entidades mecânicas (Classe, Habilidade, Atributo, Item) após validar o sistema narrativo

**Referência ao Contexto Original:**
> *"Ao alinhar o grafo de conhecimento com uma ontologia extraída de bancos de dados relacionais estáveis do estúdio, reduz-se drasticamente o custo computacional de inferências repetidas de LLM e elimina-se a necessidade de pipelines complexos de fusão de ontologias."* (linhas 22-24)

**Esclarecimento:** Não temos "bancos de dados relacionais estáveis do estúdio" no MVP. A ontologia será definida manualmente com base no GDD real do Sentinel e refinada iterativamente.

---

### 2. Pipeline de Retrieval & Reranking

#### **2.1 Estratégia de Chunking: Semântico por Seção**

**Gap Esclarecido:** *"Como dividir o GDD sem destruir continuidade contextual?"*

**Decisão:** Chunking baseado em estrutura lógica do documento (headers Markdown)

**Processo:**
1. Parser Markdown identifica headers (`#`, `##`, `###`)
2. Cada seção/subseção vira um chunk independente
3. Metadata preservada: `{section_name, level, parent_section, file_path}`
4. Chunks de tamanho variável (100-2000 tokens, dependendo do conteúdo)

**Justificativa:**
- **Preserva Contexto Narrativo:** Biografia de personagem completa em um chunk, não fragmentada
- **Simples de Implementar:** Parsing de Markdown é trivial (bibliotecas prontas)
- **Alinhado com GDD Real:** GDDs são naturalmente estruturados em seções lógicas

**Exemplo:**
```markdown
# Personagens

## Personagem: Aria Luminastra
### Biografia
[Texto completo da biografia] → CHUNK 1

### Habilidades
[Lista de habilidades] → CHUNK 2

## Personagem: Kael Sombravento
### Biografia
[Texto completo] → CHUNK 3
```

**Referência ao Contexto Original:**
> *"O paradigma de 'Garbage In, Garbage Out' é intensificado em documentos complexos como GDDs, onde a fragmentação arbitrária de texto (chunking) destrói a continuidade contextual."* (linhas 20-21)

---

#### **2.2 Modelo de Embedding: Sentence-Transformers via HuggingFace**

**Gap Esclarecido:** *"Qual modelo usar entre OpenAI text-embedding-3-large, Cohere embed-v3, sentence-transformers, ou custom?"*

**Decisão:** HuggingFace Inference API com modelos Sentence-Transformers (ex: `all-MiniLM-L6-v2`, `paraphrase-multilingual-mpnet-base-v2`)

**Justificativa:**
- **Custo Mínimo:** Free tier do HuggingFace (~30k requests/mês, suficiente para MVP)
- **Qualidade Suficiente:** Modelos open-source são adequados para validar conceito
- **Portabilidade:** Mesma interface para trocar modelos (OpenAI, Cohere) posteriormente
- **Self-hosting Futuro:** Modelos são open-source, podem ser hospedados localmente se necessário

**Configuração:**
```typescript
// Embedding via HuggingFace Inference API
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'; // 384 dimensões
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
```

**Migração Futura:** Se qualidade for insuficiente, migrar para OpenAI `text-embedding-3-large` (3072 dim, ~$0.13/1M tokens).

**Referência ao Contexto Original:**
> *"Enquanto os modelos de bi-encoder (usados na recuperação inicial) precisam comprimir o significado de um documento inteiro em um único vetor, perdendo nuances finas..."* (linhas 36-37)

**Esclarecimento:** No MVP, aceitamos "perda de nuances" dos bi-encoders. Adicionamos reranking (cross-encoders/ColBERT) apenas se encontrarmos problemas de precisão.

---

#### **2.3 Busca Híbrida: pgvector + Postgres Full-Text Search (BM25)**

**Gap Esclarecido:** *"O documento menciona busca híbrida (Dense + Sparse) mas não especifica implementação. Elasticsearch? Typesense? Built-in?"*

**Decisão:** Busca Vetorial (pgvector) + Full-Text Search nativo do Postgres, mesclados via Reciprocal Rank Fusion (RRF)

**Processo:**
1. **Query do usuário** → gera embedding via HuggingFace
2. **Query Vetorial (pgvector):**
   ```sql
   SELECT id, chunk_text, 1 - (embedding <=> query_embedding) AS similarity
   FROM gdd_chunks
   ORDER BY embedding <=> query_embedding
   LIMIT 20;
   ```
3. **Query Full-Text Search (Postgres FTS):**
   ```sql
   SELECT id, chunk_text, ts_rank(search_vector, plainto_tsquery('english', query_text)) AS rank
   FROM gdd_chunks
   WHERE search_vector @@ plainto_tsquery('english', query_text)
   ORDER BY rank DESC
   LIMIT 20;
   ```
4. **Reciprocal Rank Fusion (RRF):**
   ```typescript
   // Combina rankings de vetorial e FTS
   function rrf(vectorResults, ftsResults, k = 60) {
     const scores = new Map();
     vectorResults.forEach((doc, rank) => {
       scores.set(doc.id, (scores.get(doc.id) || 0) + 1 / (k + rank + 1));
     });
     ftsResults.forEach((doc, rank) => {
       scores.set(doc.id, (scores.get(doc.id) || 0) + 1 / (k + rank + 1));
     });
     return Array.from(scores.entries())
       .sort((a, b) => b[1] - a[1])
       .slice(0, 10); // Top 10 final
   }
   ```

**Justificativa:**
- **Best of Both Worlds:** Busca semântica (vetorial) + precisão em nomes próprios/keywords (BM25)
- **Zero Dependências Externas:** Tudo implementável em SQL puro no Postgres
- **Alinhado ao Documento:** Cobre o requisito de busca híbrida mencionado nas linhas 32-34

**Referência ao Contexto Original:**
> *"O primeiro estágio foca em recall (abrangência), utilizando buscas híbridas que combinam vetores densos (para significado semântico) e vetores esparsos como BM25 (para precisão de palavras-chave técnicas e nomes próprios)."* (linhas 32-34)

---

#### **2.4 Reranking: Não Implementado no MVP**

**Gap Esclarecido:** *"Usar ColBERT v2, Cross-Encoders (ms-marco-MiniLM, Cohere Rerank) ou LLM-as-a-reranker?"*

**Decisão:** **Nenhum reranking adicional no MVP**. Confia em busca híbrida + RRF.

**Justificativa:**
- **YAGNI (You Aren't Gonna Need It):** Adicionar reranking sem validar se a busca híbrida sozinha já resolve o problema é otimização prematura
- **Simplicidade:** Zero dependências extras, zero latência adicional
- **Iteração:** Se testes mostrarem resultados imprecisos (chunks irrelevantes no top-10), adicionar reranking incrementalmente

**Migração Futura (quando necessário):**
1. **Fase 1:** Adicionar Cohere Rerank API (mais simples, ~$1 por 1000 reranks)
2. **Fase 2:** Se custo for alto, implementar ColBERT v2 self-hosted
3. **Fase 3:** Se latência for crítica, usar cross-encoder local (ms-marco-MiniLM-L-6-v2)

**Referência ao Contexto Original:**
> *"O reranking tornou-se o componente mais crítico para garantir a precisão final. (...) Em benchmarks de produção, o uso de cross-encoders elevou a métrica NDCG@10 em até 63%."* (linhas 35-38)

**Esclarecimento:** Esse é o impacto em **produção otimizada**. No MVP, validamos se o problema existe antes de resolver.

---

### 3. LLMs, Guardrails e Prompting

#### **3.1 LLM para Geração: Claude 3.5 Sonnet (Anthropic)**

**Gap Esclarecido:** *"Qual LLM usar entre GPT-4 Turbo, Claude 3.5 Sonnet, Gemini Pro, ou modelos locais (Llama 3, Mistral)?"*

**Decisão:** Claude 3.5 Sonnet via Anthropic API

**Justificativa:**
- **Qualidade Superior para Narrativa:** Claude é consistentemente melhor em manter coerência narrativa, worldbuilding e lore consistency (caso de uso exato do projeto)
- **Menos Alucinações em RAG:** Benchmarks mostram Claude 3.5 com menor taxa de alucinações em tarefas de Retrieval-Augmented Generation comparado a GPT-4o
- **Contexto MAIOR:** 200k tokens (vs 128k do GPT-4o) - permite passar 15-20 chunks + metadados extensos do grafo
- **Melhor Seguimento de Instruções:** Excelente em aderir a system prompts complexos ("responda APENAS baseado no contexto")
- **Custo Fixo em Desenvolvimento:** Uso da API key do plano Claude Pro existente ($20/mês flat fee) - sem custos adicionais até atingir limite de ~150-200 mensagens/dia
- **Ecossistema Maduro:** SDK oficial (@anthropic-ai/sdk), documentação extensa, suporte a function calling

**Configuração:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // API key do plano Claude Pro
});

const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 1000; // Respostas concisas
const TEMPERATURE = 0.3; // Baixa criatividade, alta aderência ao contexto
```

**Setup da API Key:**
```bash
# Obter API key do Claude CLI (plano Pro)
cat ~/.anthropic/api_key
# OU
cat ~/.config/claude/config.json

# Adicionar ao .env
ANTHROPIC_API_KEY=sk-ant-api03-xxx...
```

**Nota sobre Limite do Plano Pro:**
- Durante desenvolvimento/MVP com poucos usuários, o limite de ~150-200 mensagens/dia do plano Pro é suficiente
- Em produção com múltiplos designers, monitorar uso e considerar:
  - **Opção A:** Continuar com plano Pro (se uso permanecer dentro do limite)
  - **Opção B:** Criar API key separada pay-per-use para produção (~$3 input, $15 output por 1M tokens)

**Referência ao Contexto Original:**
> *"Para garantir que as mecânicas de RPG não sofram distorções, a stack de 2026 implementa camadas de verificação pós-geração. Mesmo com uma recuperação perfeita, os LLMs podem interpretar erroneamente datas, números ou dependências lógicas."* (linhas 68-70)

**Esclarecimento:** No MVP, confiamos em prompt engineering para evitar distorções. Guardrails programáticos serão adicionados se/quando encontrarmos problemas recorrentes.

---

#### **3.2 LLM para Extração de Entidades: Claude 3.5 Sonnet (mesmo modelo)**

**Gap Esclarecido:** *"Usar modelo separado (GPT-4o-mini, Claude Haiku) para extração ou reutilizar o mesmo LLM?"*

**Decisão:** Mesmo Claude 3.5 Sonnet usado para geração de respostas

**Justificativa:**
- **Simplicidade:** Uma API key (plano Pro), uma configuração, consistência de qualidade
- **Custo Fixo:** Extração é offline (script manual), conta no limite do plano Pro, zero custo adicional no MVP
- **Qualidade Superior:** Claude 3.5 Sonnet é excelente em extração estruturada, especialmente para conteúdo narrativo complexo
- **Contexto Grande:** 200k tokens permite processar seções grandes do GDD de uma vez
- **Estruturação JSON:** Suporte nativo a respostas estruturadas via prompt engineering

**Processo de Extração:**
```python
# Script: ingest-gdd.py
import anthropic

client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")  # API key do plano Pro
)

def extract_entities(section_text: str) -> dict:
    prompt = f"""Extract narrative entities from this GDD section.
Return ONLY valid JSON with entities and relations.

Entities to extract: Personagem, Facção, Localização, Evento, Lore, Missão, Relacionamento, Arco, Tema
Relations to identify: PERTENCE_A, LOCALIZADO_EM, TEM_RELACIONAMENTO, EVOLUI_EM, EXPLORA_TEMA, etc.

Section:
{section_text}

Return JSON format:
{{
  "entities": [
    {{"type": "Personagem", "name": "...", "description": "..."}},
    ...
  ],
  "relations": [
    {{"source": "...", "type": "PERTENCE_A", "target": "..."}},
    ...
  ]
}}"""

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )

    return json.loads(response.content[0].text)
```

**Nota sobre Uso:**
- Ingestão manual/offline conta no limite diário do plano Pro
- Para GDD grande (~50 páginas), estimar ~20-30 chamadas de extração
- Se atingir limite, processar em múltiplos dias ou considerar API key pay-per-use separada apenas para ingestão batch

---

#### **3.2.1 Configuração da API Key do Plano Claude Pro**

**Como Obter a API Key:**

A API key usada pelo Claude CLI (plano Pro) pode ser reutilizada na aplicação NestJS. Existem duas maneiras de obter:

**Opção 1: Extrair do Claude CLI (Mac):**
```bash
# Localizar arquivo de configuração do Claude CLI
cat ~/.anthropic/api_key
# OU
cat ~/.config/claude/config.json | jq -r '.api_key'
# OU
cat ~/Library/Application\ Support/Claude/config.json | jq -r '.api_key'
```

**Opção 2: Gerar Nova no Console Anthropic:**
```bash
# Acessar: https://console.anthropic.com/settings/keys
# Criar nova API key (associada ao mesmo plano Pro)
# Copiar key no formato: sk-ant-api03-xxx...
```

**Configurar no Projeto:**

```bash
# .env (desenvolvimento local)
ANTHROPIC_API_KEY=sk-ant-api03-xxx...
HUGGINGFACE_API_KEY=hf_xxx...
DATABASE_URL=postgresql://sentinel:password@localhost:5432/sentinel_gdd
```

```bash
# .env.example (versionar no Git)
ANTHROPIC_API_KEY=
HUGGINGFACE_API_KEY=
DATABASE_URL=
```

**Instalação do SDK:**
```bash
# NestJS
npm install @anthropic-ai/sdk

# Python (script de ingestão)
pip install anthropic
```

**Uso no NestJS:**
```typescript
// src/modules/gdd-rag/services/llm.service.ts
import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    return response.content[0].text;
  }
}
```

**Verificar Limite do Plano Pro:**

```bash
# O plano Pro tem limite de ~150-200 mensagens/dia (compartilhado entre CLI e API)
# Monitorar uso via dashboard: https://console.anthropic.com/settings/usage

# Durante MVP com poucos usuários, o limite é suficiente
# Se ultrapassar, considerar:
# 1. Otimizar prompts (reduzir chamadas redundantes)
# 2. Cache de respostas comuns
# 3. API key pay-per-use separada para produção
```

**Deploy em Produção (VPS):**

```bash
# SSH no VPS
ssh user@seu-vps

# Configurar .env no servidor
cd /var/www/sentinel
nano .env

# Adicionar ANTHROPIC_API_KEY (mesma do plano Pro)
ANTHROPIC_API_KEY=sk-ant-api03-xxx...

# Restart aplicação
pm2 restart sentinel
```

**Importante:** A API key do plano Pro funciona em qualquer ambiente (local, Docker, VPS, cloud). O limite de mensagens é global (soma de todas as chamadas), não por ambiente.

---

#### **3.3 Framework de Guardrails: Validação via Prompt Engineering**

**Gap Esclarecido:** *"Implementar guardrails em 3 níveis (Determinístico + ML + LLM Supervisor) como descrito no documento, ou começar simples?"*

**Decisão:** **Prompt Engineering** no MVP. Sem frameworks complexos (Guardrails AI, NeMo Guardrails) ou LLM Supervisor.

**System Prompt:**
```typescript
const SYSTEM_PROMPT = `
Você é um assistente especializado em Documentos de Game Design (GDD) de RPG.

REGRAS CRÍTICAS:
1. Responda APENAS baseado no contexto fornecido abaixo (chunks de texto + metadados do grafo).
2. Se a informação não estiver no contexto, diga: "Não encontrei essa informação no GDD fornecido."
3. NUNCA invente nomes de personagens, localizações, eventos ou lore que não estejam no contexto.
4. Se houver ambiguidade ou contradição no contexto, mencione explicitamente.
5. Mantenha respostas concisas (máximo 3-4 parágrafos).

O contexto será fornecido em dois formatos:
- TEXT CHUNKS: Trechos narrativos do GDD
- GRAPH METADATA: Entidades e relações estruturadas extraídas do grafo de conhecimento
`;
```

**Validações Futuras (quando necessário):**
1. **Determinísticas:** Regex para detectar "como IA eu..." ou disclaimers indesejados
2. **Schema Validation:** Se resposta for JSON estruturado (lista de personagens), validar schema
3. **LLM Supervisor:** Passar resposta + contexto para Claude Haiku (modelo menor/rápido) ou mesmo Claude 3.5 Sonnet avaliar groundedness

**Justificativa:**
- **Iteração Rápida:** Testar prompts é instantâneo; implementar Guardrails AI leva dias
- **Custo Zero no MVP:** Validação via prompts não tem custo adicional
- **Suficiente para MVP:** Claude 3.5 Sonnet é excelente em seguir instruções quando bem promptado

**Referência ao Contexto Original:**
> *"A arquitetura de guardrails é dividida em três níveis de defesa: Validadores de Regras (Determinísticos), Classificadores de ML, Validadores Semânticos baseados em LLM."* (linhas 69-73)

**Esclarecimento:** Essa é a arquitetura de produção madura. MVP começa com nível 0 (prompts) e adiciona níveis conforme necessário.

---

#### **3.4 Estratégia de Prompting: Texto + Metadados do Grafo**

**Gap Esclarecido:** *"Passar apenas chunks de texto (RAG tradicional) ou incluir metadados estruturados do grafo?"*

**Decisão:** **Prompt Híbrido** - combina chunks textuais + metadados do grafo de conhecimento

**Template de Prompt:**
```typescript
function buildPrompt(query: string, chunks: Chunk[], graphMetadata: GraphData): string {
  return `
${SYSTEM_PROMPT}

===== KNOWLEDGE GRAPH METADATA =====
Entidades Relevantes:
${graphMetadata.entities.map(e => `- ${e.type}: ${e.name} (${e.description})`).join('\n')}

Relações Relevantes:
${graphMetadata.relations.map(r => `- ${r.source} ${r.type} ${r.target}`).join('\n')}

===== TEXT CHUNKS FROM GDD =====
${chunks.map((c, i) => `
[Chunk ${i+1}] Seção: ${c.section_name}
${c.text}
`).join('\n---\n')}

===== USER QUERY =====
${query}

Responda a query do usuário usando APENAS o contexto acima.
`;
}
```

**Exemplo de Execução:**
```
User Query: "Quais personagens têm rivalidade com a Facção do Crepúsculo?"

KNOWLEDGE GRAPH METADATA:
Entidades Relevantes:
- Personagem: Kael Sombravento (guerreiro exilado)
- Personagem: Aria Luminastra (maga da Ordem da Luz)
- Facção: Facção do Crepúsculo (culto sombrio)
- Relacionamento: Rivalidade (ódio profundo)

Relações Relevantes:
- Kael Sombravento TEM_RELACIONAMENTO(Rivalidade) Facção do Crepúsculo
- Aria Luminastra CONFLITA_COM Facção do Crepúsculo

TEXT CHUNKS FROM GDD:
[Chunk 1] Seção: Personagens > Kael Sombravento > Biografia
Kael foi exilado de sua terra natal após descobrir que a Facção do Crepúsculo...
[texto completo]

[Chunk 2] Seção: Facções > Facção do Crepúsculo
A Facção do Crepúsculo é um culto que busca...
[texto completo]
```

**Justificativa:**
- **Aproveita o Grafo:** Não basta ter o grafo; o LLM precisa VER as conexões estruturadas
- **Queries Relacionais:** Perguntas como "quem tem rivalidade com X?" são respondidas diretamente pelas relações do grafo
- **Contexto Duplo:** Texto narrativo (chunks) + estrutura semântica (grafo) = máxima fidelidade

**Referência ao Contexto Original:**
> *"O GraphRAG surge como a técnica dominante em 2026 para lidar com a descoberta de informações em dados narrativos privados e técnicos. Ao contrário do RAG de linha de base, que tem dificuldade em conectar pontos dispersos em grandes coleções de documentos, o GraphRAG utiliza LLMs para criar grafos de conhecimento que facilitam o entendimento de conceitos semânticos resumidos."* (linhas 25-29)

---

### 4. Infraestrutura e Deploy

#### **4.1 Setup do PostgreSQL: Docker Compose + Imagem Custom**

**Gap Esclarecido:** *"Usar Postgres managed cloud (AWS RDS, Supabase), VM custom, ou Docker local?"*

**Decisão:** Docker Compose com imagem customizada (Postgres 16 + Apache AGE + pgvector)

**Dockerfile (Postgres Custom):**
```dockerfile
FROM postgres:16

# Instala dependências de compilação
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-16

# Instala Apache AGE
RUN cd /tmp && \
    git clone https://github.com/apache/age.git && \
    cd age && \
    make install

# Instala pgvector
RUN cd /tmp && \
    git clone https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make && make install

# Cleanup
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/*
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    build: ./postgres-custom
    container_name: sentinel-postgres
    environment:
      POSTGRES_USER: sentinel
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: sentinel_gdd
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: postgres -c shared_preload_libraries=age

  nestjs:
    build: .
    container_name: sentinel-api
    environment:
      DATABASE_URL: postgresql://sentinel:${DB_PASSWORD}@postgres:5432/sentinel_gdd
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      HUGGINGFACE_API_KEY: ${HUGGINGFACE_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

**init.sql:**
```sql
-- Habilita extensões
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS age;

-- Cria schema do AGE
SELECT create_graph('gdd_graph');

-- Cria tabela de chunks com vetores
CREATE TABLE gdd_chunks (
    id SERIAL PRIMARY KEY,
    section_name TEXT NOT NULL,
    section_level INT,
    chunk_text TEXT NOT NULL,
    embedding vector(384), -- Sentence-Transformers dimension
    search_vector tsvector, -- Full-Text Search
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX ON gdd_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON gdd_chunks USING gin(search_vector);
```

**Justificativa:**
- **Reproduzível:** Qualquer dev roda `docker-compose up` e tem ambiente completo
- **Portável:** Deploy em qualquer cloud que rode Docker (Render, Railway, AWS ECS, GCP Cloud Run)
- **Zero Custo Inicial:** Desenvolvimento local gratuito
- **Infra-as-Code:** `docker-compose.yml` versionado no Git

**Referência ao Contexto Original:**
> *"A escolha do protocolo de transporte entre o BFF em NestJS e o módulo de IA é determinante para a latência total do sistema."* (linhas 54-56)

**Esclarecimento:** Não há "módulo de IA separado" no monolito. Toda comunicação é in-process (chamadas TypeScript → APIs externas via HTTP).

---

#### **4.2 Deploy da Aplicação: VPS Tradicional (DigitalOcean/Linode/EC2)**

**Gap Esclarecido:** *"Deploy via PaaS (Render/Railway), Kubernetes, Serverless (Vercel/Lambda), ou VPS tradicional?"*

**Decisão:** VPS tradicional com Git + PM2 + Nginx

**Setup (Ubuntu 22.04 LTS):**
```bash
# 1. Instala dependências
sudo apt update
sudo apt install -y nodejs npm nginx docker.io docker-compose git

# 2. Clona repositório
git clone https://github.com/seu-user/sentinel.git /var/www/sentinel
cd /var/www/sentinel

# 3. Configura ambiente
cp .env.example .env
nano .env # Edita API keys, DB password

# 4. Inicia Postgres via Docker Compose
docker-compose up -d postgres

# 5. Build NestJS
npm install
npm run build

# 6. Configura PM2
npm install -g pm2
pm2 start dist/main.js --name sentinel
pm2 save
pm2 startup # Configura auto-start

# 7. Configura Nginx como reverse proxy
sudo nano /etc/nginx/sites-available/sentinel
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Deploy de Updates:**
```bash
# SSH no servidor
ssh user@seu-vps

# Pull código novo
cd /var/www/sentinel
git pull origin main

# Rebuild (se deps mudaram)
npm install
npm run build

# Restart
pm2 restart sentinel
```

**Justificativa:**
- **Controle Total:** Acesso root, configura tudo manualmente
- **Custo Fixo Previsível:** $10-40/mês (vs PaaS que pode escalar inesperadamente)
- **Aprendizado Hands-on:** Entende cada camada (Nginx, PM2, Docker, Node)
- **Sem Lock-in:** Migração fácil entre providers (DigitalOcean → Linode → AWS EC2)

**Trade-off Aceito:** Responsabilidade operacional (backups, SSL, updates, monitoramento). Mitigado por scripts de automação futuros.

---

#### **4.3 Autenticação: Sem Autenticação (Desenvolvimento Local/Interno)**

**Gap Esclarecido:** *"API Key, JWT, OAuth, ou sem autenticação?"*

**Decisão:** **Sem autenticação no MVP** (desenvolvimento local/interno)

**Configuração Atual:**
```typescript
// NestJS Controller
@Controller('api/rag')
export class RagController {
  @Post('query')
  async query(@Body() body: { query: string }) {
    // Sem validação de auth
    return this.ragService.processQuery(body.query);
  }
}
```

**⚠️ IMPORTANTE:**
- **Ambiente Atual:** NestJS roda em `localhost:3000` ou rede interna do VPS (não exposto publicamente)
- **Antes de Deploy Público:** Implementar API Key básica:
  ```typescript
  @UseGuards(ApiKeyGuard)
  @Controller('api/rag')
  export class RagController { ... }
  ```

**Migração Futura:**
1. **Fase 1 (pré-deploy público):** API Key via header `X-API-Key`
2. **Fase 2 (múltiplos usuários):** JWT com login (NestJS Passport)
3. **Fase 3 (integração SSO):** OAuth2 (Google/Microsoft)

**Justificativa:**
- **MVP Interno:** Equipe pequena, ambiente controlado, fricção zero durante desenvolvimento
- **Iteração Rápida:** Testa funcionalidades sem overhead de auth
- **Segurança Adequada:** Se não expor porta publicamente, não há risco

---

### 5. MVP e Roadmap

#### **5.1 Escopo do MVP: Query & Answer + Exploração de Entidades**

**Gap Esclarecido:** *"Quais features são MUST-HAVE vs NICE-TO-HAVE no MVP?"*

**Decisão:** MVP com 2 funcionalidades core

**Features MUST-HAVE:**

1. **Query & Answer (RAG Conversacional)**
   - **Endpoint:** `POST /api/rag/query`
   - **Input:** `{ "query": "Quem é o Personagem X?" }`
   - **Output:** Resposta narrativa baseada em chunks + grafo
   - **Pipeline Completo:** Embedding → Busca Híbrida → Consulta Grafo → Prompt Claude 3.5 Sonnet

2. **Exploração de Entidades**
   - **Endpoints:**
     - `GET /api/rag/entities?type=Personagem` (listar entidades por tipo)
     - `GET /api/rag/entities/:id` (detalhes de uma entidade específica)
     - `GET /api/rag/relations?entity=:id` (relações de uma entidade)
   - **Queries Exemplo:**
     - "Listar todos os personagens"
     - "Ver detalhes do Personagem 'Aria Luminastra'"
     - "Quais entidades têm relação 'RIVALIDADE' com Facção X?"

**Features NICE-TO-HAVE (pós-MVP):**
- Interface web (React/Vue)
- Histórico de conversação (follow-up questions)
- Visualização do grafo (D3.js, vis.js)
- Citações automáticas de seções do GDD
- Export de respostas (PDF/Markdown)

**Justificativa:**
- **Validação Dual:** Testa tanto RAG conversacional (queries livres) quanto navegação estrutural (exploração do grafo)
- **Feedback de Extração:** Designers veem as entidades extraídas, podem validar qualidade
- **Interface Simples:** Testável via Postman/curl, não requer frontend

**Referência ao Contexto Original:**
> *"Casos reais, como a implementação de grafos orientados a objetivos (GoGs) no ambiente de Minecraft, demonstram que ao modelar explicitamente as dependências lógicas entre sub-objetivos, a capacidade de raciocínio da IA em tarefas de jogo supera significativamente as abordagens de RAG fragmentadas."* (linhas 86-88)

**Esclarecimento:** Exploração de entidades permite validar se as "dependências lógicas" (relações do grafo) foram extraídas corretamente.

---

#### **5.2 Dados Iniciais: GDD Real do Projeto Sentinel**

**Gap Esclarecido:** *"Criar GDD sintético para testes ou usar GDD real desde o início?"*

**Decisão:** **GDD Real do Projeto Sentinel**

**Processo de Ingestão (Manual):**
```bash
# 1. Localizar GDD do Sentinel
# Assumindo estrutura: docs/gdd/

# 2. Executar script de ingestão
python scripts/ingest-gdd.py --file docs/gdd/narrative.md

# Script executa:
# - Parse Markdown (chunking por seção)
# - Gera embeddings via HuggingFace
# - Extrai entidades/relações via GPT-4o
# - Popula Postgres (chunks + grafo)
# - Exibe summary: "Extraídas 15 entidades, 23 relações, 42 chunks"
```

**Validação Pós-Ingestão:**
```bash
# Query SQL para verificar
psql -U sentinel -d sentinel_gdd -c "SELECT COUNT(*) FROM gdd_chunks;"
psql -U sentinel -d sentinel_gdd -c "SELECT * FROM cypher('gdd_graph', $$ MATCH (n) RETURN n LIMIT 10 $$) as (result agtype);"
```

**Justificativa:**
- **Realismo Imediato:** Descobre problemas de parsing, extração e estrutura com dados reais
- **Value Proposition Claro:** Designers testam com SEUS próprios GDDs, não exemplos genéricos
- **Feedback Qualitativo:** "O sistema entendeu o Personagem X corretamente?" é pergunta real, não hipotética

**Trade-off Aceito:** GDD real pode ter inconsistências/estrutura irregular. Isso é **bom** - força o sistema a ser robusto.

---

#### **5.3 Integração com Sentinel: Módulo Isolado**

**Gap Esclarecido:** *"Integrar profundamente com arquitetura existente do Sentinel ou manter isolado?"*

**Decisão:** **Módulo Isolado** (`src/modules/gdd-rag/`)

**Estrutura de Pastas:**
```
sentinel/
├── src/
│   ├── modules/
│   │   ├── auth/          # Módulos existentes do Sentinel
│   │   ├── users/
│   │   └── gdd-rag/       # NOVO MÓDULO ISOLADO
│   │       ├── controllers/
│   │       │   ├── rag-query.controller.ts
│   │       │   └── rag-entities.controller.ts
│   │       ├── services/
│   │       │   ├── rag.service.ts
│   │       │   ├── embedding.service.ts
│   │       │   ├── search.service.ts (pgvector + FTS + RRF)
│   │       │   ├── graph.service.ts (Apache AGE queries)
│   │       │   └── llm.service.ts (Anthropic Claude 3.5 Sonnet)
│   │       ├── repositories/
│   │       │   └── gdd.repository.ts
│   │       ├── dto/
│   │       │   ├── query.dto.ts
│   │       │   └── entity.dto.ts
│   │       └── gdd-rag.module.ts
│   └── app.module.ts
├── scripts/
│   └── ingest-gdd.py      # Script Python de ingestão (offline)
└── docker-compose.yml
```

**gdd-rag.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { RagQueryController, RagEntitiesController } from './controllers';
import { RagService, EmbeddingService, SearchService, GraphService, LlmService } from './services';

@Module({
  controllers: [RagQueryController, RagEntitiesController],
  providers: [RagService, EmbeddingService, SearchService, GraphService, LlmService],
  exports: [], // Não exporta para outros módulos (isolado)
})
export class GddRagModule {}
```

**app.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { GddRagModule } from './modules/gdd-rag/gdd-rag.module';
// Outros módulos existentes...

@Module({
  imports: [
    // Módulos existentes do Sentinel
    AuthModule,
    UsersModule,
    // Novo módulo isolado
    GddRagModule,
  ],
})
export class AppModule {}
```

**Justificativa:**
- **Zero Risco:** Não quebra funcionalidades existentes do Sentinel
- **Desenvolvimento Independente:** Não precisa entender toda arquitetura do Sentinel para começar
- **Remoção Fácil:** Se MVP falhar, deletar pasta `gdd-rag/` remove tudo
- **Evolução Futura:** Quando estável, pode refatorar para reutilizar infraestrutura existente (logging, auth, etc.)

**Endpoints Expostos:**
```
POST   /api/rag/query           # Query conversacional
GET    /api/rag/entities        # Listar entidades
GET    /api/rag/entities/:id    # Detalhes de entidade
GET    /api/rag/relations       # Explorar relações
```

---

## 📈 Roadmap de Implementação

### **Fase 1: MVP Core (2-3 semanas)**

**Objetivo:** Pipeline completo funcionando end-to-end com GDD real

**Tarefas:**
1. ✅ Setup Postgres via Docker Compose (AGE + pgvector)
2. ✅ Script Python de ingestão (`ingest-gdd.py`)
   - Parser Markdown (chunking por seção)
   - Integração HuggingFace (embeddings)
   - Integração Anthropic (extração de entidades via Claude 3.5 Sonnet)
   - Popular Postgres (chunks + grafo)
3. ✅ Módulo NestJS `gdd-rag`
   - `EmbeddingService` (HuggingFace API)
   - `SearchService` (pgvector + FTS + RRF)
   - `GraphService` (Apache AGE queries)
   - `LlmService` (Anthropic Claude 3.5 Sonnet)
   - `RagService` (orquestra pipeline sequencial)
4. ✅ Controllers REST
   - `POST /api/rag/query`
   - `GET /api/rag/entities`
   - `GET /api/rag/entities/:id`
   - `GET /api/rag/relations`
5. ✅ Deploy no VPS (Git + PM2 + Nginx)
6. ✅ Testes com designers (feedback qualitativo)

**Métricas de Sucesso:**
- [ ] Ingestão de GDD real sem erros (>90% das entidades extraídas corretamente)
- [ ] Query response time <2s P95
- [ ] Designers reportam "respostas úteis" em >70% das queries

---

### **Fase 2: Refinamento & Guardrails (1-2 semanas)**

**Objetivo:** Melhorar qualidade e adicionar validações básicas

**Tarefas:**
1. ✅ Implementar citações de seções no prompt (rastreabilidade)
2. ✅ Adicionar validações determinísticas (regex para disclaimers indesejados)
3. ✅ Logging estruturado (query, chunks retornados, resposta, latência)
4. ✅ Métricas de uso (queries/dia, entidades mais consultadas)
5. ✅ Melhorar prompts baseado em feedback (iteração de system prompt)
6. ✅ Otimizar chunking se necessário (testar overlap, hierarquia)

**Métricas de Sucesso:**
- [ ] Alucinações detectadas <5% das queries
- [ ] Designers conseguem rastrear fonte da resposta (citações funcionam)

---

### **Fase 3: Features de Produtividade (2-3 semanas)**

**Objetivo:** Transformar MVP em ferramenta diária dos designers

**Tarefas:**
1. ✅ Interface web básica (React ou Vue)
   - Chat conversacional
   - Navegação de entidades (cards, filtros)
2. ✅ Histórico de conversação (session management)
3. ✅ Autenticação (API Key ou JWT)
4. ✅ Visualização do grafo (D3.js ou vis.js)
5. ✅ Export de respostas (Markdown, PDF)
6. ✅ Ingestão com preview (designer aprova entidades extraídas antes de commitar)

**Métricas de Sucesso:**
- [ ] >50% dos designers usam a ferramenta semanalmente
- [ ] Tempo médio de busca no GDD reduz de 10min → 2min

---

### **Fase 4: Otimização & Escala (ongoing)**

**Objetivo:** Preparar para produção e escala

**Tarefas:**
1. ✅ Adicionar reranking (Cohere Rerank API ou ColBERT)
2. ✅ Implementar guardrails avançados (Guardrails AI framework)
3. ✅ CI/CD (GitHub Actions → deploy automático)
4. ✅ Monitoramento (Grafana, logs centralizados)
5. ✅ Backups automáticos do Postgres
6. ✅ Migrar embeddings para OpenAI ou Voyage AI se qualidade do HF for insuficiente
7. ✅ Avaliar microserviços se latência virar bottleneck
8. ✅ Expansão para mecânicas RPG (adicionar entidades: Classe, Habilidade, Item, Atributo)

**Métricas de Sucesso:**
- [ ] Uptime >99%
- [ ] Query response time <500ms P95
- [ ] Custo <$100/mês para 100 designers

---

## 🔍 Ambiguidades/Gaps Resolvidos

### **Do Documento de Pesquisa para Decisões Executáveis:**

| # | **Ambiguidade Original** | **Trecho do Documento (linhas)** | **Decisão Tomada** | **Como Foi Esclarecido** |
|---|--------------------------|----------------------------------|---------------------|--------------------------|
| 1 | Qual banco de grafos usar? | "grafos de conhecimento orientados por ontologias" (linha 22) | **Apache AGE** (Postgres extension) | Entrevista Rodada 1, Pergunta 1.1: Escolhido por unificação de infraestrutura (grafos + vetores + relacional no mesmo DB) |
| 2 | Qual vector database? | "busca vetorial" mencionada mas sem especificação (linha 33) | **pgvector** (Postgres extension) | Entrevista Rodada 1, Pergunta 1.2: Coesão arquitetural, zero custo extra, queries cross-domain |
| 3 | Quais entidades da ontologia RPG? | "classes de entidades (ex: Personagem, Magia, Atributo)" (linha 21) | **Ontologia Narrativa:** Personagem, Facção, Localização, Evento, Lore, Missão, Relacionamento, Arco, Tema | Entrevista Rodada 1, Perguntas 1.3-1.4: Foco narrativo-first, expandir para mecânicas depois |
| 4 | Quais relações modelar? | "relações permitidas entre elas" (linha 21) | **Estruturais + Temporais + Emocionais:** PERTENCE_A, TEM_RELACIONAMENTO, ACONTECE_ANTES, EVOLUI_EM, etc. | Entrevista Rodada 1, Pergunta 1.4: Conjunto completo para suportar queries narrativas complexas |
| 5 | Como chunkar o GDD? | "fragmentação arbitrária de texto (chunking) destrói a continuidade" (linhas 20-21) | **Chunking semântico por seção** (headers Markdown) | Entrevista Rodada 2, Pergunta 2.1: Preserva contexto narrativo, simples de implementar |
| 6 | Qual API de embeddings? | Não especificado | **HuggingFace Inference API** (Sentence-Transformers) | Entrevista Rodada 2, Pergunta 2.2: Custo mínimo, free tier, qualidade suficiente para MVP |
| 7 | Implementar reranking? | "reranking tornou-se o componente mais crítico" (linha 35) | **Não no MVP** (apenas busca híbrida + RRF) | Entrevista Rodada 2, Pergunta 2.3: YAGNI - adicionar apenas se busca híbrida for insuficiente |
| 8 | Qual modelo de reranking? | "ColBERT v2, cross-encoders, LLM listwise" (linhas 39-46) | **N/A no MVP** (decisão futura: Cohere Rerank → ColBERT → Cross-encoder) | Entrevista Rodada 2, Pergunta 2.3: Progressão de complexidade conforme necessário |
| 9 | gRPC vs NATS? | Tabela comparativa (linhas 61-65) mas sem decisão | **N/A** (arquitetura monolítica, sem microserviços) | Entrevista Rodada 1 (Abordagem): Monolito elimina comunicação inter-serviços |
| 10 | Usar Python/Rust híbrido? | "módulo poliglota, utilizando Python (...) integrando Rust" (linha 52) | **Script Python offline** (ingestão) + **NestJS puro** (runtime) | Entrevista Rodada 1 (Abordagem): Simplicidade, sem overhead de PyO3/Maturin no MVP |
| 11 | Qual LLM para geração? | Não especificado | **Claude 3.5 Sonnet** (Anthropic) | Entrevista Rodada 3, Pergunta 3.1: Melhor para narrativa, menos alucinações em RAG, contexto 200k tokens, usa plano Pro existente |
| 12 | Qual LLM para extração? | Não especificado | **Mesmo Claude 3.5 Sonnet** | Entrevista Rodada 3, Pergunta 3.2: Simplicidade (mesma API key do plano Pro), qualidade superior em extração narrativa |
| 13 | Framework de guardrails? | "guardrails é dividida em três níveis" (linhas 69-73) | **Prompt engineering no MVP** (sem frameworks) | Entrevista Rodada 3, Pergunta 3.3: Iteração rápida, adicionar camadas conforme necessário |
| 14 | Como estruturar prompts? | Não especificado | **Prompt híbrido:** chunks textuais + metadados do grafo | Entrevista Rodada 3, Pergunta 3.4: Aproveita tanto narrativa quanto estrutura relacional |
| 15 | Como executar queries? | Não especificado | **Pipeline sequencial:** embedding → busca híbrida → grafo → LLM | Após Rodada 3: Simplicidade, debugging trivial, cada etapa independente |
| 16 | Como hospedar Postgres? | Não especificado | **Docker Compose** (imagem custom AGE + pgvector) | Entrevista Rodada 4, Pergunta 4.1: Reproduzível, portável, zero custo inicial |
| 17 | Onde fazer deploy? | Não especificado | **VPS tradicional** (DigitalOcean/Linode/EC2) | Entrevista Rodada 4, Pergunta 4.2: Controle total, custo fixo, aprendizado hands-on |
| 18 | Autenticação da API? | Não mencionado | **Sem autenticação no MVP** (dev local/interno) | Entrevista Rodada 4, Pergunta 4.3: Iteração rápida, adicionar API Key antes de deploy público |
| 19 | Escopo do MVP? | Não definido | **Query & Answer + Exploração de Entidades** | Entrevista Rodada 5, Pergunta 5.1: Valida RAG conversacional E qualidade de extração do grafo |
| 20 | Dados de teste? | Não especificado | **GDD real do Sentinel** | Entrevista Rodada 5, Pergunta 5.2: Validação com complexidade real desde dia 1 |
| 21 | Integração com Sentinel? | Não mencionado | **Módulo isolado** (`src/modules/gdd-rag/`) | Entrevista Rodada 5, Pergunta 5.3: Zero risco, desenvolvimento independente |

---

## 📚 Trechos Esclarecidos do Contexto Original

### **1. Arquitetura de Microserviços vs Monolito**

**Trecho Original (linhas 48-53):**
> *"A stack tecnológica para sustentar este pipeline complexo em 2026 baseia-se em uma arquitetura de microserviços orquestrada por NestJS, atuando como o Backend-for-Frontend (BFF). O NestJS é ideal para esta função devido à sua capacidade de abstrair transportadores de comunicação através de interfaces canônicas, permitindo a integração perfeita entre mensagens baseadas em eventos e chamadas de solicitação-resposta. No entanto, o motor de IA pesado — onde residem a geração de embeddings, a busca vetorial e o reranking — é delegado a um módulo especializado."*

**Esclarecimento:**
- Essa é a **arquitetura final de produção** descrita no documento (2026 estado-da-arte)
- **Decisão para MVP:** Começar com **arquitetura monolítica** (NestJS único, APIs externas para LLM/embeddings)
- **Justificativa:** Validar proposta de valor antes de investir em microserviços
- **Caminho de evolução:** Monolito → Microserviços quando latência/custo justificar (não no MVP)

---

### **2. GraphRAG e Travessia de Múltiplos Saltos**

**Trecho Original (linhas 25-30):**
> *"O GraphRAG surge como a técnica dominante em 2026 para lidar com a descoberta de informações em dados narrativos privados e técnicos. Ao contrário do RAG de linha de base, que tem dificuldade em conectar pontos dispersos em grandes coleções de documentos, o GraphRAG utiliza LLMs para criar grafos de conhecimento que facilitam o entendimento de conceitos semânticos resumidos. O processo envolve a identificação de 'pivôs' — nós de entrada altamente relevantes — seguida pela expansão da relevância através da travessia do grafo."*

**Esclarecimento:**
- **Implementação no MVP:** Pipeline sequencial que combina busca vetorial (chunks) + consulta ao grafo (entidades/relações)
- **Prompts Híbridos:** LLM recebe TANTO chunks textuais QUANTO metadados estruturados do grafo
- **Multi-hop:** Queries no grafo usam Cypher para traversar relações (ex: `MATCH (p:Personagem)-[:TEM_RELACIONAMENTO]->(r:Relacionamento)-[:COM]->(f:Facção)`)
- **Diferença do RAG tradicional:** Não só busca chunks similares, mas também navega relações semânticas explícitas

---

### **3. Reranking com Cross-Encoders e ColBERT**

**Trecho Original (linhas 35-46):**
> *"O reranking tornou-se o componente mais crítico para garantir a precisão final. (...) Em benchmarks de produção, o uso de cross-encoders elevou a métrica NDCG@10 em até 63% em comparação com sistemas baseados apenas em buscas por palavras-chave. Entretanto, devido à alta latência dos cross-encoders, o mercado de 2026 consolidou o uso de modelos de Interação Tardia (Late Interaction), especificamente o ColBERT v2."*

**Esclarecimento:**
- **Decisão para MVP:** **NÃO implementar reranking** inicialmente (apenas busca híbrida pgvector + BM25 + RRF)
- **Justificativa:** Validar se o problema existe antes de resolver (YAGNI)
- **Roadmap de reranking (se necessário):**
  1. Fase 1: Adicionar Cohere Rerank API (mais simples, ~$1/1000 reranks)
  2. Fase 2: Implementar ColBERT v2 self-hosted (custo zero, latência ~50-100ms)
  3. Fase 3: Cross-encoder local para top-5 final (máxima precisão)
- **Benchmark mencionado (63% melhoria):** É em **produção otimizada**, não em MVP. Evita otimização prematura.

---

### **4. Guardrails em 3 Níveis**

**Trecho Original (linhas 69-73):**
> *"A arquitetura de guardrails é dividida em três níveis de defesa:*
> *- Validadores de Regras (Determinísticos): Verificam se o output adere a esquemas JSON estritos e se valores numéricos estão dentro de limites operacionais.*
> *- Classificadores de ML: Detectam tentativas de injeção de prompt ou conteúdos tóxicos.*
> *- Validadores Semânticos baseados em LLM: Utilizam um LLM 'supervisor' (Critic) para comparar a resposta gerada com os documentos de origem, calculando a métrica de Groundedness (Aterramento)."*

**Esclarecimento:**
- **Decisão para MVP:** **Nível 0** - Apenas prompt engineering bem estruturado
- **System Prompt:** Instrui explicitamente Claude 3.5 Sonnet a responder APENAS baseado no contexto, não inventar informações
- **Progressão de guardrails (conforme necessário):**
  - **Nível 1 (Determinístico):** Regex para detectar disclaimers indesejados ("como IA eu...", "não tenho certeza...")
  - **Nível 2 (Schema Validation):** Validar JSON se resposta for estruturada (lista de entidades, atributos)
  - **Nível 3 (LLM Supervisor):** Passar resposta + contexto para Claude Haiku ou mesmo Claude 3.5 Sonnet avaliar groundedness
  - **Nível 4 (Framework):** Guardrails AI ou NeMo Guardrails (produção madura)
- **Justificativa:** Claude 3.5 Sonnet tem taxa de alucinação menor que GPT-4o em RAG; testa prompts antes de adicionar complexidade

---

### **5. Chunking e Continuidade Contextual**

**Trecho Original (linhas 19-21):**
> *"A base de um sistema de RAG de alta fidelidade para 2026 começa na fase de ingestão. O paradigma de 'Garbage In, Garbage Out' é intensificado em documentos complexos como GDDs, onde a fragmentação arbitrária de texto (chunking) destrói a continuidade contextual necessária para entender mecânicas de RPG."*

**Esclarecimento:**
- **Problema identificado:** Chunking arbitrário (janelas de 512 tokens fixas) quebra narrativas no meio
- **Solução adotada:** **Chunking semântico por seção** (baseado em headers Markdown)
- **Exemplo prático:**
  ```markdown
  ## Personagem: Aria Luminastra
  ### Biografia
  Aria nasceu na cidade de Lúmen... [texto completo de 800 tokens]
  → CHUNK ÚNICO preserva biografia completa

  Chunking arbitrário faria:
  [0-512 tokens: Aria nasceu... até metade da história]
  [512-1024 tokens: ...continuação da história até habilidades]
  → QUEBRA CONTEXTO
  ```
- **Metadata preservada:** `{section_name: "Personagens > Aria Luminastra > Biografia", level: 3}`
- **Trade-off:** Chunks de tamanho variável (100-2000 tokens) vs chunks fixos. Aceitável pois preserva significado.

---

### **6. Busca Híbrida (Dense + Sparse)**

**Trecho Original (linhas 32-34):**
> *"A precisão semântica em 2026 é alcançada através de um pipeline de recuperação em múltiplos estágios. O primeiro estágio foca em recall (abrangência), utilizando buscas híbridas que combinam vetores densos (para significado semântico) e vetores esparsos como BM25 (para precisão de palavras-chave técnicas e nomes próprios)."*

**Esclarecimento:**
- **Dense (pgvector):** Busca por similaridade semântica (embedding da query vs embeddings dos chunks)
  - **Bom para:** Queries conceituais ("quais personagens são corajosos?", "eventos trágicos na história")
- **Sparse (BM25 via Postgres FTS):** Busca por keywords exatas
  - **Bom para:** Nomes próprios ("Facção do Crepúsculo"), termos técnicos ("atributo de resistência ao fogo")
- **Reciprocal Rank Fusion (RRF):** Algoritmo de merge que combina rankings de ambas as buscas
  - **Fórmula:** `score(doc) = Σ 1/(k + rank_i)` onde `rank_i` é a posição do doc na lista `i`
  - **Resultado:** Top-10 chunks que balanceiam semântica + keywords
- **Implementação:** 100% SQL nativo no Postgres (sem dependências externas como Elasticsearch)

---

### **7. Ontologia como Base**

**Trecho Original (linhas 22-24):**
> *"Ao alinhar o grafo de conhecimento com uma ontologia extraída de bancos de dados relacionais estáveis do estúdio, reduz-se drasticamente o custo computacional de inferências repetidas de LLM e elimina-se a necessidade de pipelines complexos de fusão de ontologias."*

**Esclarecimento:**
- **Contexto do documento:** Estúdios grandes têm DBs relacionais com esquemas estáveis (ex: tabela `characters`, `factions`, `items`)
- **Realidade do MVP:** Não temos "bancos de dados relacionais estáveis". GDD está em Markdown.
- **Solução adotada:**
  1. **Definir ontologia manualmente** (entidades: Personagem, Facção, etc.; relações: TEM_RELACIONAMENTO, etc.)
  2. **Extrair entidades do GDD via LLM** (Claude 3.5 Sonnet com prompts estruturados)
  3. **Popular grafo** (Apache AGE) com entidades/relações extraídas
  4. **Refinar iterativamente** (designers validam/corrigem extração)
- **Benefício futuro:** Se Sentinel tiver DB relacional de game data, mapear ontologia para schema do DB (reduz custo de inferência)

---

## 🎯 Métricas de Sucesso Definidas

### **MVP (Fase 1):**
- [ ] **Taxa de Sucesso de Ingestão:** >90% das entidades do GDD extraídas corretamente (validação manual)
- [ ] **Latência de Query:** <2s P95 (embedding + busca + grafo + LLM)
- [ ] **Qualidade Percebida:** Designers reportam "respostas úteis" em >70% das queries (pesquisa qualitativa)

### **Pós-Refinamento (Fase 2):**
- [ ] **Taxa de Alucinação:** <5% das queries (resposta contém informação não presente no GDD)
- [ ] **Rastreabilidade:** 100% das respostas têm citações de seções do GDD (se implementado)
- [ ] **Cobertura:** >80% das queries encontram contexto relevante (não retornam "não encontrei")

### **Produção (Fase 4):**
- [ ] **Adoção:** >50% dos designers usam semanalmente
- [ ] **Eficiência:** Tempo médio de busca manual no GDD reduz de 10min → <2min
- [ ] **Uptime:** >99%
- [ ] **Latência Otimizada:** <500ms P95
- [ ] **Custo:** <$100/mês para 100 designers ativos

---

## 🚀 Próximos Passos Imediatos

### **Semana 1-2: Setup de Infraestrutura**
1. [ ] Criar branch `feature/gdd-rag` no repo Sentinel
2. [ ] Implementar `docker-compose.yml` (Postgres + AGE + pgvector)
3. [ ] Testar setup local (`docker-compose up -d`, verificar extensões)
4. [ ] Criar script `init.sql` (schema de chunks, grafo, índices)

### **Semana 2-3: Script de Ingestão**
1. [ ] Implementar `scripts/ingest-gdd.py`:
   - Parser Markdown (biblioteca `markdown-it-py` ou `mistune`)
   - Integração HuggingFace Inference API (embeddings)
   - Integração OpenAI API (extração de entidades via GPT-4o com function calling)
   - Popular Postgres (`psycopg2`, queries SQL + Cypher)
2. [ ] Testar com GDD real do Sentinel
3. [ ] Validar qualidade de extração (manual review das entidades)

### **Semana 3-4: Módulo NestJS**
1. [ ] Criar `src/modules/gdd-rag/`
2. [ ] Implementar services:
   - `EmbeddingService` (HuggingFace API)
   - `SearchService` (pgvector + FTS + RRF)
   - `GraphService` (Apache AGE queries via node-postgres)
   - `LlmService` (Anthropic API - Claude 3.5 Sonnet)
   - `RagService` (orquestra pipeline)
3. [ ] Implementar controllers:
   - `POST /api/rag/query`
   - `GET /api/rag/entities`
4. [ ] Testar localmente (Postman/curl)

### **Semana 4: Deploy e Feedback**
1. [ ] Deploy no VPS (setup PM2 + Nginx)
2. [ ] Testes com 2-3 designers early adopters
3. [ ] Coletar feedback qualitativo
4. [ ] Iterar em prompts e chunking baseado em feedback

---

## 🔗 Referências

- **Documento Original:** [Stack RAG Alta Fidelidade para GDDs.md](../pesquisas/Stack%20RAG%20Alta%20Fidelidade%20para%20GDDs.md)
- **Tecnologias Decididas:**
  - [Apache AGE](https://age.apache.org/) - Graph extension for PostgreSQL
  - [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search for PostgreSQL
  - [HuggingFace Inference API](https://huggingface.co/inference-api) - Embeddings
  - [Claude 3.5 Sonnet](https://docs.anthropic.com/en/docs/models-overview) - LLM via Anthropic API
  - [NestJS](https://nestjs.com/) - Backend framework
  - [Sentence-Transformers](https://www.sbert.net/) - Embedding models

---

## 📝 Conclusão

Este documento consolida **21 decisões técnicas críticas** que transformam o conhecimento estado-da-arte do documento de pesquisa em uma arquitetura executável para o projeto Sentinel.

**Princípios Norteadores:**
1. **Simplicidade Primeiro:** Monolito antes de microserviços, prompts antes de guardrails complexos
2. **Validação Rápida:** MVP em 3-4 semanas, testes com dados reais, feedback contínuo
3. **Evolução Incremental:** Cada decisão tem caminho claro de upgrade (MVP → Refinamento → Produção)
4. **Custo Consciente:** <$100/mês no MVP, escala de custos apenas com validação de valor

**Diferenciais da Abordagem:**
- **GraphRAG Narrativo:** Foco em worldbuilding e consistência de lore (não mecânicas de combate)
- **Infraestrutura Unificada:** Postgres único (grafos + vetores + relacional)
- **Autonomia Operacional:** Self-hosted (VPS + Docker), sem lock-in de cloud

O sistema está pronto para implementação. Próximo passo: criar branch `feature/gdd-rag` e começar o setup de infraestrutura.

---

**Documento gerado em:** 2026-01-29
**Autor:** Entrevista estruturada com decisões consensuais
**Status:** ✅ Aprovado para implementação
