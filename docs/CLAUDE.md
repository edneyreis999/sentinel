# Docs Navigation Guide

## Quick Start

**Primary Entry Point:** `adrs/INDEX.md` - Complete index of ADRs with cross-references

## Structure

```
docs/
├── CLAUDE.md                                              # This file - Navigation guide
├── adrs/                                                  # Architecture Decision Records
│   ├── INDEX.md                                           # START HERE - Full ADR index
│   ├── README.md                                          # ADR process guide
│   ├── {MODULE}/ADR-{N}-{name}.md                        # ADRs organized by module
│   ├── generated/                                         # Auto-generated ADRs (workflow artifacts)
│   └── potential-adrs/                                    # Draft ADRs awaiting generation
├── decisoes-iniciais/                                     # Initial architectural decisions
│   ├── entrevista-stack-rag-gdd-2026-01-29.md           # Stack definition interview
│   ├── entrevista-busca-hibrida-2026-01-30.md           # Hybrid search interview
│   ├── decisoes-arquiteturais-grafo.md                  # Graph architecture decisions
│   └── labels-arestas-{v2,v3}.md                         # Ontology schema iterations
└── pesquisas/                                             # Technical research docs
    ├── Stack RAG Alta Fidelidade para GDDs.md            # RAG stack definition
    ├── Busca Hibrida com pgvector e FTS.md              # Hybrid search research
    ├── Grafos de Conhecimento RPG_ Implementacao e Performance.md  # Graph database research
    ├── RAG de Alta Fidelidade com Sentence-Transformers.md         # Embedding strategy
    └── IA para Testes Eficientes em TypeScript.md        # AI testing methodology
```

## Find Information

- **Architecture decisions** → `adrs/INDEX.md` (ADRs by module with cross-references)
- **Project requirements** → `decisoes-iniciais/entrevista-stack-rag-gdd-2026-01-29.md`
- **Graph ontology** → `decisoes-iniciais/labels-arestas-v3.md`
- **Tech research** → `pesquisas/{topic}.md`

## Key Concepts

- **GDD**: Game Design Document (narrative RPG context)
- **RAG**: Retrieval-Augmented Generation (core system purpose)
- **High-Fidelity**: Maintaining semantic consistency, preventing hallucinations
- **Daratrine**: The specific RPG world being developed (project alias)
