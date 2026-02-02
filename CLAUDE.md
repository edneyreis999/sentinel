# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sentinel** is a high-fidelity RAG (Retrieval-Augmented Generation) system designed for narrative RPG Game Design Documents (GDDs). The project, also referred to as **Daratrine** in the context of the specific RPG world being developed, focuses on maintaining semantic consistency and preventing hallucinations when working with complex, interdependent game design data.

## Documentation

**All documentation lives in `docs/`.** Start at `docs/CLAUDE.md` for navigation guide, then `docs/adrs/INDEX.md` for architectural decisions.

## ADR Creation Process

**DO NOT manually create ADR files.** Use the agent-based workflow:

1. Create potential ADR: `docs/adrs/potential-adrs/must-document/{MODULE}/{name}.md`
2. Run skill: `/adr-generate {MODULE}`
3. Agent generates: `docs/adrs/generated/{MODULE}/ADR-XXX-{name}.md` (auto-archives source to `done/`)
4. Renumber XXX to next sequential ID, move to `docs/adrs/{MODULE}/ADR-{N}-{name}.md`
5. Update `docs/adrs/INDEX.md`

**Skill invocation:** `Skill tool` with `skill: "adrs-management:adr-generate"` and `args: "{MODULE}"`

## Essential Commands

## Agentes e responsabilidades

Sempre que possível, invoque agentes para executar em paralelo

`coreto-test-agent` responsavel por escrever TODOS os testes do sistema.
