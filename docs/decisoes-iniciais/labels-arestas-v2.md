# Resposta à Pergunta 2.2: Esquema Concreto do Grafo para Apache AGE (v2 Consolidada)

## Recomendação: **Opção D (Esquema Customizado para Daratrine - Versão Consolidada)**

Esta versão combina o melhor das propostas Claude v1 e Gemini v1, resultando em um esquema mais completo e fiel ao GDD documentado.

---

## Resumo do Esquema Consolidado

| Aspecto | v1 Claude | v1 Gemini | v2 Consolidada |
|---------|-----------|-----------|----------------|
| **Labels (Vértices)** | 9 | 12 | 11 |
| **Arestas** | 9 | ~20 | 15 |
| **Foco** | Arcos + VariávelEstado | Gameplay + Sequenciamento | Ambos |

---

## Justificativa da Consolidação

### Mantido do Claude v1 (Essencial)
- **VariavelEstado** → Integração direta com RPG Maker MZ
- **ArcoPersonagem por ato** → Granularidade de transformação (3 nós por personagem)
- **AFETA com delta** → Impacto quantificável de escolhas
- **RELACIONA_COM como aresta** → Mais eficiente que nó intermediário

### Adicionado do Gemini v1 (Complementar)
- **Lore** → Conhecimento do mundo (canções, profecias, selos)
- **Inimigo** → Separação de criaturas de NPCs narrativos
- **PRECEDE/LEVA_A** → Sequenciamento temporal explícito
- **REQUER_ITEM/RECOMPENSA_ITEM** → Gameplay loop de mineração
- **esta_vivo, status_social** → Propriedades narrativamente relevantes

### Não Adotado do Gemini v1
- **Relacionamento como nó** → Aresta tipada é mais eficiente
- **Arco genérico** → Perde granularidade por ato
- **Habilidade** → Adiado para expansão futura (mecânicas não são foco)

---

## Esquema D v2: VÉRTICES (11 Labels)

### 1. Personagem

```typescript
interface PersonagemProperties {
  id: string;
  nome: string;
  nome_completo: string; // "Tibério Balastrus", "Thorin Forja-Prata"
  papel_narrativo: 'protagonista' | 'antagonista' | 'aliado' | 'mentor' | 'npc';
  raca: string; // "anão"
  faixa_etaria: 'jovem' | 'maduro' | 'veterano';
  arquetipo: string; // "herói", "guardião", "rebelde", "mago"
  valores_centrais: string[]; // ["dever", "proteção"]
  motivacao_raiz: string;
  medo_fundamental: string;
  virtude_principal: string;
  fraqueza_principal: string;
  maior_sonho: string;
  ocupacao?: string; // "General da Guarda de Ferro" (NOVO - Gemini)
  status_social?: 'nobre' | 'trabalhador' | 'renegado'; // (NOVO - Gemini)
  esta_vivo: boolean; // (NOVO - Gemini) - Rastrear mortes narrativas
  jogavel: boolean;
}
```

### 2. Faccao

```typescript
interface FaccaoProperties {
  id: string;
  nome: string; // "Guarda de Ferro", "Família Corvinus"
  tipo: 'militar' | 'politica' | 'civil' | 'independente';
  ideologia: string;
  poder_influencia: 'baixo' | 'medio' | 'alto' | 'critico'; // (NOVO - Gemini)
  lider_id?: string;
}
```

### 3. Local

```typescript
interface LocalProperties {
  id: string;
  nome: string; // "Mina de Kravens", "Castelo de Damburr"
  tipo: 'continente' | 'regiao' | 'cidade' | 'distrito' | 'dungeon' | 'sala' | 'marco' | 'acampamento';
  nivel_perigo: number; // 1-10
  nivel_recomendado: number; // 1-30
  clima?: string; // (NOVO - Gemini)
  descricao: string;
  conexoes: string[];
}
```

### 4. Quest

```typescript
interface QuestProperties {
  id: string;
  nome: string; // "Minerador Aprendiz"
  numero_sequencial: number;
  ato: 1 | 2 | 3;
  tipo: 'principal' | 'secundaria' | 'ramificacao' | 'arco_personagem';
  status: 'disponivel' | 'em_andamento' | 'concluida' | 'falha'; // (NOVO - Gemini)
  objetivo_principal: string; // (NOVO - Gemini)
  pre_requisitos: string[];
  recompensas: object;
}
```

### 5. Evento

```typescript
interface EventoProperties {
  id: string;
  nome: string; // "Quebra do Selo", "Morte de Mhordred"
  ato: number;
  descricao: string;
  consequencias: string;
  gravidade: 'menor' | 'importante' | 'critico' | 'apocaliptico'; // Expandido (Gemini)
  data_mundo?: string; // Referência à cena na timeline (NOVO - Gemini)
  irreversivel: boolean;
}
```

### 6. ArcoPersonagem (Claude - Mantido)

```typescript
interface ArcoPersonagemProperties {
  id: string;
  personagem_id: string;
  ato: 1 | 2 | 3;
  titulo_arco: string; // "O Carrasco Burguês", "O Inventor Redimido"
  emocao_predominante: string; // "arrogância", "culpa"
  objetivo_imediato: string;
  arquetipo_fase: string;
  gatilho_mudanca: string;
  contradicoes_internas: string;
}
```

### 7. Tema

```typescript
interface TemaProperties {
  id: string;
  nome: string; // "tradicao_vs_progresso", "redencao"
  descricao: string;
  categoria: 'redencao' | 'sacrificio' | 'dever_vs_paixao' | 'tradicao_vs_progresso' | 'conflito_familiar' | 'classe_social';
  personagens_principais: string[];
}
```

### 8. Item

```typescript
interface ItemProperties {
  id: string;
  nome: string; // "Sigmetal", "Funda do General"
  tipo: 'minerio' | 'arma' | 'armadura' | 'equipamento' | 'consumivel' | 'quest_item' | 'chave_narrativa';
  raridade: 'comum' | 'incomum' | 'raro' | 'lendario';
  descricao: string;
  efeito_mecanico?: string; // (NOVO - Gemini)
  efeito: object;
}
```

### 9. VariavelEstado (Claude - Mantido)

```typescript
interface VariavelEstadoProperties {
  id: string;
  nome: string; // "v_influencia_corvos", "v_boa_vontade_thordan"
  valor_minimo: number;
  valor_maximo: number;
  valor_inicial: number;
  descricao: string;
}
```

### 10. Lore (NOVO - Gemini)

```typescript
interface LoreProperties {
  id: string;
  nome: string; // "Canção Ancestral", "Selo de Melios"
  descricao: string;
  categoria: 'mitologia' | 'historia_antiga' | 'cultura' | 'cosmologia' | 'cancao_popular' | 'profecia';
}
```

### 11. Inimigo (NOVO - Gemini)

```typescript
interface InimigoProperties {
  id: string;
  nome: string; // "Cristaleão", "Petesporo", "Comandante Ignoto"
  tipo: 'fauna' | 'criatura_toxica' | 'construto' | 'predador' | 'humanoide_hostil' | 'ignoto' | 'boss';
  nivel: number;
  localizacao_primaria: string;
  fraquezas?: string[];
  descricao: string;
}
```

---

## Esquema D v2: ARESTAS (15 Tipos)

### Arestas do Claude v1 (9 - Mantidas)

```typescript
// 1. RELACIONA_COM (Personagem → Personagem)
interface RelacionaComEdge {
  tipo: 'aliado' | 'inimigo' | 'mentor' | 'familia' | 'romance' | 'rival' | 'alianca_pragmatica' | 'irmao_armas' | 'traicao';
  subtipo?: string; // "romance_reprimido", "conflito_pai_filho"
  intensidade?: number; // -100 a 100 (NOVO - Gemini)
  evolui_por_ato: boolean;
  descricao: string;
}

// 2. PERTENCE_A (Personagem → Faccao)
interface PertenceAEdge {
  cargo?: string; // "Lorde Comandante"
  desde_ato: number;
}

// 3. LOCALIZADO_EM (Personagem|Evento|Item|Inimigo → Local)
interface LocalizadoEmEdge {
  tipo: 'residencia' | 'trabalho' | 'temporario' | 'spawn';
}

// 4. PARTICIPA_DE (Personagem → Quest|Evento)
interface ParticipaDeEdge {
  papel: 'protagonista' | 'aliado' | 'antagonista' | 'npc';
  obrigatorio: boolean;
}

// 5. DESENCADEIA (Quest|Evento → Evento)
interface DesencadeiaEdge {
  condicao?: string;
  probabilidade: number;
}

// 6. TRANSFORMA (Evento → ArcoPersonagem)
interface TransformaEdge {
  natureza: 'positiva' | 'negativa' | 'ambigua';
}

// 7. INCORPORA (Quest → Tema)
interface IncorporaEdge {
  intensidade: 'central' | 'secundario' | 'sutil';
}

// 8. AFETA (Quest|Evento → VariavelEstado)
interface AfetaEdge {
  delta: number; // +25, -10
  condicao?: string;
}

// 9. EVOLUI_PARA (ArcoPersonagem → ArcoPersonagem)
interface EvoluiParaEdge {
  gatilho_evento_id?: string;
}
```

### Arestas Novas do Gemini v1 (6 - Adicionadas)

```typescript
// 10. PRECEDE (Evento → Evento) - Sequenciamento temporal
interface PrecedeEdge {
  intervalo?: string; // "imediato", "horas", "dias"
}

// 11. LEVA_A (Quest → Quest) - Dependência entre quests
interface LevaAEdge {
  tipo: 'prerequisito' | 'desbloqueia' | 'opcional';
}

// 12. MOTIVA (Evento|Lore → Personagem|Faccao) - Causalidade narrativa
interface MotivaEdge {
  natureza: 'inspiracao' | 'trauma' | 'dever' | 'vinganca';
  descricao?: string;
}

// 13. REQUER_ITEM (Quest → Item) - Pré-requisito de quest
interface RequerItemEdge {
  quantidade: number;
  consumido: boolean;
}

// 14. RECOMPENSA_ITEM (Quest → Item) - Recompensa de quest
interface RecompensaItemEdge {
  quantidade: number;
  condicao?: string; // "escolha_empatica", "rota_corvos"
}

// 15. MENCIONA (Quest|Evento|Lore → Personagem|Lore|Local|Item)
interface MencionaEdge {
  contexto: 'dialogo' | 'descricao' | 'flashback' | 'profecia';
}
```

---

## Diagrama de Relacionamentos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ESQUEMA D v2 - DARATRINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    PERTENCE_A     ┌──────────┐    CONFLITA_COM            │
│  │  Personagem  │ ─────────────────▶│  Faccao  │◀───────────────────┐       │
│  └──────┬───────┘                   └──────────┘                    │       │
│         │                                                           │       │
│         │ RELACIONA_COM                                             │       │
│         ▼                                                           │       │
│  ┌──────────────┐                                                   │       │
│  │  Personagem  │                                                   │       │
│  └──────┬───────┘                                                   │       │
│         │                                                           │       │
│         │ EVOLUI_EM              ┌─────────────────┐                │       │
│         ▼                        │ ArcoPersonagem  │                │       │
│  ┌──────────────┐  TRANSFORMA    │    (Ato 1)      │                │       │
│  │    Evento    │───────────────▶├─────────────────┤                │       │
│  └──────┬───────┘                │ ArcoPersonagem  │                │       │
│         │                        │    (Ato 2)      │                │       │
│         │ PRECEDE                ├─────────────────┤                │       │
│         ▼                        │ ArcoPersonagem  │                │       │
│  ┌──────────────┐                │    (Ato 3)      │                │       │
│  │    Evento    │                └────────┬────────┘                │       │
│  └──────────────┘                         │ EVOLUI_PARA             │       │
│                                           ▼                         │       │
│  ┌──────────────┐    LEVA_A      ┌──────────────┐                   │       │
│  │    Quest     │───────────────▶│    Quest     │                   │       │
│  └──────┬───────┘                └──────────────┘                   │       │
│         │                                                           │       │
│         ├─── REQUER_ITEM ────▶ ┌──────────┐                         │       │
│         │                      │   Item   │                         │       │
│         └─── RECOMPENSA_ITEM ─▶└──────────┘                         │       │
│                                                                     │       │
│  ┌──────────────┐    AFETA       ┌────────────────┐                 │       │
│  │ Quest/Evento │───────────────▶│ VariavelEstado │                 │       │
│  └──────────────┘   (delta)      └────────────────┘                 │       │
│                                                                     │       │
│  ┌──────────────┐    MOTIVA      ┌──────────────┐                   │       │
│  │  Evento/Lore │───────────────▶│  Personagem  │                   │       │
│  └──────────────┘                └──────────────┘                   │       │
│                                                                     │       │
│  ┌──────────────┐  LOCALIZADO_EM ┌──────────────┐                   │       │
│  │   Inimigo    │───────────────▶│    Local     │                   │       │
│  └──────────────┘                └──────────────┘                   │       │
│                                                                     │       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Exemplos Concretos do GDD

### Personagem Balastrus (Atualizado)

```cypher
CREATE (b:Personagem {
  id: 'balastrus',
  nome: 'Balastrus',
  nome_completo: 'Tibério Balastrus',
  papel_narrativo: 'antagonista',
  raca: 'anão',
  faixa_etaria: 'maduro',
  arquetipo: 'mago',
  valores_centrais: ['poder', 'eficiencia', 'merito'],
  motivacao_raiz: 'Nascido pobre, enriqueceu como carrasco. Despreza ineficiência da nobreza.',
  medo_fundamental: 'Irrelevância',
  virtude_principal: 'Genialidade criativa',
  fraqueza_principal: 'Arrogância',
  maior_sonho: 'Remodelar Gildrat em império baseado em meritocracia',
  ocupacao: 'Pontífice da Ciência e Tecnologia',
  status_social: 'trabalhador',
  esta_vivo: true,
  jogavel: true
})
```

### Lore: Canção Ancestral (NOVO)

```cypher
CREATE (l:Lore {
  id: 'cancao_ancestral',
  nome: 'Canção Ancestral dos Corvos',
  descricao: 'Frequência sônica transmitida de geração em geração pelos Corvos. Desorienta os Ignotos quando cantada.',
  categoria: 'cancao_popular'
})

// Canção motiva resistência dos Corvos
MATCH (l:Lore {id: 'cancao_ancestral'}), (f:Faccao {nome: 'Família Corvinus'})
CREATE (l)-[:MOTIVA {natureza: 'dever', descricao: 'Dever ancestral de proteger o selo'}]->(f)
```

### Inimigo: Cristaleão (NOVO)

```cypher
CREATE (i:Inimigo {
  id: 'cristaleao',
  nome: 'Cristaleão',
  tipo: 'boss',
  nivel: 10,
  localizacao_primaria: 'Mina de Kravens',
  fraquezas: ['fogo'],
  descricao: 'Criatura colossal camuflada nas paredes da mina. Desperta com vibrações de mineração.'
})

MATCH (i:Inimigo {id: 'cristaleao'}), (l:Local {nome: 'Mina de Kravens'})
CREATE (i)-[:LOCALIZADO_EM {tipo: 'spawn'}]->(l)
```

### Sequenciamento de Quests (NOVO)

```cypher
// Criar dependência entre quests
MATCH (q1:Quest {nome: 'Primeiro Contrato'}), (q2:Quest {nome: 'Minerador Aprendiz'})
CREATE (q1)-[:LEVA_A {tipo: 'prerequisito'}]->(q2)

MATCH (q2:Quest {nome: 'Minerador Aprendiz'}), (q3:Quest {nome: 'Travessia Perigosa'})
CREATE (q2)-[:LEVA_A {tipo: 'desbloqueia'}]->(q3)

MATCH (q3:Quest {nome: 'Travessia Perigosa'}), (q4:Quest {nome: 'Travessia Tóxica'})
CREATE (q3)-[:LEVA_A {tipo: 'prerequisito'}]->(q4)
```

### Sequenciamento de Eventos (NOVO)

```cypher
// Timeline de eventos críticos
MATCH (e1:Evento {nome: 'Confronto Corvos em Melios'}), (e2:Evento {nome: 'Quebra do Selo'})
CREATE (e1)-[:PRECEDE {intervalo: 'imediato'}]->(e2)

MATCH (e2:Evento {nome: 'Quebra do Selo'}), (e3:Evento {nome: 'Libertação dos Ignotos'})
CREATE (e2)-[:PRECEDE {intervalo: 'imediato'}]->(e3)

MATCH (e3:Evento {nome: 'Libertação dos Ignotos'}), (e4:Evento {nome: 'Sacrifício de Kilin'})
CREATE (e3)-[:PRECEDE {intervalo: 'imediato'}]->(e4)
```

### Gameplay Loop: Mineração (NOVO)

```cypher
// Quest Minerador Aprendiz requer Kravens
MATCH (q:Quest {nome: 'Minerador Aprendiz'}), (i:Item {nome: 'Kraven'})
CREATE (q)-[:REQUER_ITEM {quantidade: 9, consumido: true}]->(i)

// Quest pode recompensar Sigmetal (condicional)
MATCH (q:Quest {nome: 'Minerador Aprendiz'}), (i:Item {nome: 'Sigmetal'})
CREATE (q)-[:RECOMPENSA_ITEM {quantidade: 1, condicao: 'queda_segundo_andar'}]->(i)

// Mini-quest recompensa Funda do General
MATCH (q:Quest {nome: 'A Funda do General'}), (i:Item {nome: 'Funda do General'})
CREATE (q)-[:RECOMPENSA_ITEM {quantidade: 1, condicao: 'v_boa_vontade_thordan >= 25'}]->(i)
```

### Evento Motiva Personagem (NOVO)

```cypher
// Abandono de Mélia motiva frieza de Tordan
MATCH (e:Evento {nome: 'Abandono de Mélia'}), (p:Personagem {nome: 'Tordan'})
CREATE (e)-[:MOTIVA {natureza: 'trauma', descricao: 'Incapacidade de se conectar emocionalmente com Thorin'}]->(p)

// Morte de Mhordred quebra Kilin
MATCH (e:Evento {nome: 'Morte de Mhordred'}), (p:Personagem {nome: 'Kilin'})
CREATE (e)-[:MOTIVA {natureza: 'trauma', descricao: 'Fragmentação mental completa'}]->(p)
```

### VariavelEstado + AFETA (Mantido do v1)

```cypher
CREATE (v:VariavelEstado {
  id: 'v_influencia_corvos',
  nome: 'v_influencia_corvos',
  valor_minimo: 0,
  valor_maximo: 100,
  valor_inicial: 0,
  descricao: 'Influência de Thorin com a Família Corvinus'
})

// Resgatar Corvos em Melios afeta variável
MATCH (e:Evento {nome: 'Resgate dos Corvos em Melios'}), (v:VariavelEstado {nome: 'v_influencia_corvos'})
CREATE (e)-[:AFETA {delta: 5, condicao: 'por_corvo_resgatado'}]->(v)

// Evacuar contingente principal
MATCH (e:Evento {nome: 'Evacuação Contingente Corvos'}), (v:VariavelEstado {nome: 'v_influencia_corvos'})
CREATE (e)-[:AFETA {delta: 5, condicao: 'evacuacao_sucesso'}]->(v)
```

---

## Script de Inicialização (SQL + Cypher)

```sql
-- Criar grafo
SELECT create_graph('daratrine_narrative_v2');

-- Constraints de unicidade
SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (p:Personagem) ASSERT p.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (f:Faccao) ASSERT f.nome IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (l:Local) ASSERT l.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (q:Quest) ASSERT q.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (e:Evento) ASSERT e.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (v:VariavelEstado) ASSERT v.nome IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (l:Lore) ASSERT l.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v2', $$
  CREATE CONSTRAINT ON (i:Inimigo) ASSERT i.id IS UNIQUE
$$) as (v agtype);

-- Índices para performance
CREATE INDEX idx_arco_personagem ON daratrine_narrative_v2.ArcoPersonagem(personagem_id, ato);
CREATE INDEX idx_variavel_estado ON daratrine_narrative_v2.VariavelEstado(nome);
CREATE INDEX idx_quest_ato ON daratrine_narrative_v2.Quest(ato);
CREATE INDEX idx_evento_ato ON daratrine_narrative_v2.Evento(ato);
CREATE INDEX idx_inimigo_local ON daratrine_narrative_v2.Inimigo(localizacao_primaria);
```

---

## Queries Habilitadas (Expandidas)

### Queries do Claude v1 (Mantidas)

```cypher
-- Qual o arco atual de Balastrus?
MATCH (p:Personagem {nome: 'Balastrus'})-[:TEM_ARCO]->(a:ArcoPersonagem)
WHERE a.ato = $ato_atual
RETURN a.titulo_arco, a.emocao_predominante

-- Quais eventos afetam v_influencia_corvos?
MATCH (e)-[r:AFETA]->(v:VariavelEstado {nome: 'v_influencia_corvos'})
RETURN e.nome, r.delta, r.condicao

-- Quem tem relacionamento de aliança que racha?
MATCH (p1:Personagem)-[r:RELACIONA_COM {evolui_por_ato: true}]->(p2:Personagem)
RETURN p1.nome, r.tipo, p2.nome
```

### Queries Novas (Gemini-inspired)

```cypher
-- Qual a sequência de quests do Ato I?
MATCH path = (q1:Quest {ato: 1})-[:LEVA_A*]->(qn:Quest)
RETURN [node in nodes(path) | node.nome] as sequencia

-- Quais inimigos aparecem na Mina do Esgoto?
MATCH (i:Inimigo)-[:LOCALIZADO_EM]->(l:Local {nome: 'Mina do Esgoto'})
RETURN i.nome, i.tipo, i.nivel

-- Quais eventos precedem a Quebra do Selo?
MATCH path = (e1:Evento)-[:PRECEDE*]->(e2:Evento {nome: 'Quebra do Selo'})
RETURN [node in nodes(path) | node.nome] as timeline

-- Quais quests recompensam itens lendários?
MATCH (q:Quest)-[:RECOMPENSA_ITEM]->(i:Item {raridade: 'lendario'})
RETURN q.nome, i.nome

-- O que motiva a frieza de Tordan?
MATCH (fonte)-[r:MOTIVA]->(p:Personagem {nome: 'Tordan'})
RETURN fonte.nome, r.natureza, r.descricao

-- Quais personagens morreram?
MATCH (p:Personagem {esta_vivo: false})
RETURN p.nome, p.papel_narrativo

-- Qual lore menciona os Ignotos?
MATCH (l:Lore)-[:MENCIONA]->(f:Faccao {nome: 'Ignotos'})
RETURN l.nome, l.categoria
```

---

## Cronograma de Implementação

### Milestone 1 (Semana 1-2): Base
- Labels: Personagem, Faccao, Local, Quest, Evento
- Arestas: PERTENCE_A, LOCALIZADO_EM, PARTICIPA_DE, DESENCADEIA

### Milestone 2 (Semana 3): Arcos + Estado
- Labels: ArcoPersonagem, VariavelEstado, Tema
- Arestas: TRANSFORMA, AFETA, EVOLUI_PARA, INCORPORA, RELACIONA_COM

### Milestone 3 (Semana 4): Complementos
- Labels: Lore, Inimigo, Item
- Arestas: PRECEDE, LEVA_A, MOTIVA, REQUER_ITEM, RECOMPENSA_ITEM, MENCIONA

### Milestone 4 (Semana 5): Validação
- Popular com dados completos do GDD
- Testar todas as queries
- Ajustar índices para performance

---

## Comparativo Final

| Aspecto | v1 Claude | v1 Gemini | v2 Consolidada |
|---------|-----------|-----------|----------------|
| VariavelEstado | ✅ | ❌ | ✅ |
| ArcoPersonagem por ato | ✅ | ❌ | ✅ |
| AFETA com delta | ✅ | ❌ | ✅ |
| Lore | ❌ | ✅ | ✅ |
| Inimigo | ❌ | ✅ | ✅ |
| PRECEDE/LEVA_A | ❌ | ✅ | ✅ |
| REQUER/RECOMPENSA_ITEM | ❌ | ✅ | ✅ |
| esta_vivo | ❌ | ✅ | ✅ |
| Habilidade | ❌ | ✅ | ❌ (futuro) |
| Relacionamento como nó | ❌ | ✅ | ❌ (aresta) |

---

## Documentos de Referência

- `docs/GDD/4-personagens-inimigos-criaturas/Personagens/*.md`
- `docs/GDD/3-historia/timeline-historia-jogo-v5.md`
- `docs/GDD/3-historia/historia-jornada-do-jogador.md`
- `docs/GDD/2-world-building/locais/*.md`
- `docs/GDD/2-world-building/continentes/ekios-ecosistema-inimigos.md`
- `docs/Quests/**/*.md`
- `temp/entidades/resposta-claude-v1.md`
- `temp/entidades/resposta-gemini-v1.md`
- `temp/entidades/melhorias/analise-comparativa-claude-gemini.md`
- `temp/entidades/melhorias/analise-comparativa-gemini-claude.md`
