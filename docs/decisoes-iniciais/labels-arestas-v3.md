# Esquema v3: Grafo Narrativo Completo para Apache AGE

## Evolução do Esquema

| Versão | Labels | Arestas | Foco Principal |
|--------|--------|---------|----------------|
| v1 (Claude) | 9 | 9 | Arcos por ato + VariavelEstado |
| v2 (Merge) | 11 | 15 | + Lore, Inimigo, sequenciamento |
| **v3 (Final)** | **15** | **21** | + Cena, Beat, EstadoEmocional, Escolha |

---

## PARTE 1: Labels de Vértices (15)

### 1.1 Entidades Narrativas Principais (6)

#### 1. Personagem
Representa todos os NPCs e personagens jogáveis.

```typescript
interface PersonagemProperties {
  id: string;
  nome: string;
  nome_completo: string;                // "Tibério Balastrus", "Thorin Forja-Prata"
  papel_narrativo: 'protagonista' | 'antagonista' | 'aliado' | 'mentor' | 'npc';
  raca: string;                         // "anão"
  faixa_etaria: 'jovem' | 'maduro' | 'veterano';
  arquetipo: string;                    // "herói", "guardião", "rebelde"
  valores_centrais: string[];           // ["dever", "proteção"]
  motivacao_raiz: string;
  medo_fundamental: string;
  virtude_principal: string;
  fraqueza_principal: string;
  maior_sonho: string;
  jogavel: boolean;
  esta_vivo: boolean;                   // Rastrear mortes narrativas
  status_social?: 'nobre' | 'trabalhador' | 'renegado';
}
```

#### 2. Faccao
Representa grupos organizados com ideologias e objetivos.

```typescript
interface FaccaoProperties {
  id: string;
  nome: string;                         // "Guarda de Ferro", "Família Corvinus"
  tipo: 'militar' | 'politica' | 'civil' | 'independente';
  ideologia: string;
  poder_influencia: 'baixo' | 'medio' | 'alto' | 'critico';
  lider_id?: string;
}
```

#### 3. Local
Representa áreas geográficas e pontos de interesse.

```typescript
interface LocalProperties {
  id: string;
  nome: string;                         // "Mina de Kravens", "Castelo de Damburr"
  tipo: 'continente' | 'regiao' | 'cidade' | 'distrito' | 'dungeon' | 'sala' | 'ponto_interesse';
  nivel_perigo: number;                 // 1-10
  nivel_recomendado: number;            // 1-30
  clima?: string;
  descricao: string;
  conexoes: string[];
}
```

#### 4. Evento
Representa acontecimentos cruciais na timeline.

```typescript
interface EventoProperties {
  id: string;
  nome: string;                         // "Quebra do Selo", "Morte de Mhordred"
  ato: number;
  descricao: string;
  consequencias: string;
  gravidade: 'menor' | 'importante' | 'critico' | 'apocaliptico';
  irreversivel: boolean;
}
```

#### 5. Lore
Representa conhecimento do mundo (mitologia, história, cultura).

```typescript
interface LoreProperties {
  id: string;
  nome: string;                         // "Canção Ancestral dos Corvos", "Selo de Melios"
  descricao: string;
  categoria: 'mitologia' | 'historia_antiga' | 'cultura' | 'cosmologia' | 'cancao_popular';
}
```

#### 6. Tema
Representa os temas narrativos centrais.

```typescript
interface TemaProperties {
  id: string;
  nome: string;                         // "tradicao_vs_progresso", "redencao"
  descricao: string;
  categoria: 'redencao' | 'sacrificio' | 'dever_vs_paixao' | 'tradicao_vs_progresso' | 'conflito_familiar';
  personagens_principais: string[];
}
```

---

### 1.2 Entidades de Progressão de Personagem (2)

#### 7. ArcoPersonagem
Representa a transformação de um personagem por ato.

```typescript
interface ArcoPersonagemProperties {
  id: string;
  personagem_id: string;
  ato: 1 | 2 | 3;
  titulo_arco: string;                  // "O Carrasco Burguês", "O Inventor Redimido"
  emocao_predominante: string;          // "arrogância", "culpa"
  objetivo_imediato: string;
  arquetipo_fase: string;
  gatilho_mudanca: string;
  contradicoes_internas: string;
}
```

#### 8. EstadoEmocional (NOVO v3)
Representa o sentimento de um personagem em uma cena específica.

```typescript
interface EstadoEmocionalProperties {
  id: string;
  personagem_id: string;
  cena_id: string;
  emocao: string;                       // "ansioso", "determinado", "culpado", "aliviado"
  intensidade: 'leve' | 'moderado' | 'intenso';
  gatilho?: string;                     // O que causou essa emoção
  transicao_para?: string;              // Emoção seguinte na mesma cena
}
```

---

### 1.3 Entidades de Quest e Cena (4)

#### 9. Quest
Representa as missões do jogo.

```typescript
interface QuestProperties {
  id: string;
  nome: string;                         // "Minerador Aprendiz"
  numero_sequencial: number;
  ato: 1 | 2 | 3;
  tipo: 'principal' | 'secundaria' | 'ramificacao' | 'hub';
  status?: 'disponivel' | 'em_andamento' | 'concluida' | 'falha';
  objetivo_principal: string;
  pre_requisitos: string[];
  recompensas: object;
}
```

#### 10. Cena (NOVO v3)
Representa uma unidade narrativa dentro de uma Quest.

```typescript
interface CenaProperties {
  id: string;
  quest_id: string;
  numero_sequencial: number;            // 1, 2, 3...
  titulo: string;                       // "Mineração tutorial", "Boss Cristaleão"
  tipo: 'gameplay' | 'cutscene' | 'hibrido';
  local_id?: string;
  descricao: string;
  pre_condicoes: string[];              // ["SIGMETAL >= 9", "SELO_MELIOS_QUEBRADO = true"]
  flags_setadas: string[];              // ["MINERACAO_COMPLETA", "BOSS_DERROTADO"]
  duracao_estimada?: string;            // "5min", "cutscene curta"
}
```

#### 11. Beat (NOVO v3)
Representa um momento narrativo atômico dentro de uma Cena.

```typescript
interface BeatProperties {
  id: string;
  cena_id: string;
  numero: string;                       // "1.1", "1.2", "2.1"
  descricao: string;                    // "Thorin segue até Balastrus"
  tipo: 'dialogo' | 'acao' | 'transicao' | 'combate' | 'revelacao' | 'escolha';
  personagens_envolvidos: string[];     // ["thorin", "balastrus"]
  emocao_dominante?: string;            // Clima emocional do beat
}
```

#### 12. Escolha (NOVO v3)
Representa um branch de decisão do jogador.

```typescript
interface EscolhaProperties {
  id: string;
  cena_id: string;
  texto_escolha: string;                // "Entregar Sigmetal para Balastrus"
  texto_alternativo?: string;           // "Entregar Sigmetal para os Corvos"
  consequencias: string[];              // ["v_influencia_corvos +25", "ROTA_CORVOS = true"]
  tipo: 'moral' | 'tatica' | 'relacional' | 'narrativa';
  reversivel: boolean;
}
```

---

### 1.4 Entidades de Gameplay (2)

#### 13. Item
Representa itens com importância narrativa ou mecânica.

```typescript
interface ItemProperties {
  id: string;
  nome: string;                         // "Sigmetal", "Funda do General"
  tipo: 'minerio' | 'arma' | 'armadura' | 'consumivel' | 'quest_item' | 'chave_narrativa';
  raridade: 'comum' | 'incomum' | 'raro' | 'lendario';
  descricao: string;
  efeito_mecanico?: string;
  efeito: object;
}
```

#### 14. Inimigo
Representa adversários e criaturas hostis.

```typescript
interface InimigoProperties {
  id: string;
  nome: string;                         // "Cristaleão", "Petesporo", "Comandante Ignoto"
  tipo: 'Fauna' | 'Criatura Toxica' | 'Construto' | 'Predador' | 'Humanoide Hostil' | 'Ignoto' | 'Boss';
  nivel: number;
  localizacao_primaria: string;
  fraquezas?: string[];                 // ["Fogo", "Sigmetal"]
  boss_de_quest?: string;               // ID da quest onde é boss
}
```

---

### 1.5 Entidade de Integração RPG Maker (1)

#### 15. VariavelEstado
Representa variáveis de estado do jogo (integração RPG Maker MZ).

```typescript
interface VariavelEstadoProperties {
  id: string;
  nome: string;                         // "v_influencia_corvos", "v_boa_vontade_thordan"
  valor_minimo: number;
  valor_maximo: number;
  valor_inicial: number;
  descricao: string;
  categoria: 'relacional' | 'progressao' | 'flag' | 'contador';
}
```

---

## PARTE 2: Labels de Arestas (21)

### 2.1 Relações Estruturais (6)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **PERTENCE_A** | Personagem → Faccao | Filiação a grupo |
| **LOCALIZADO_EM** | Personagem\|Evento\|Inimigo → Local | Posição geográfica |
| **CONTEM_CENA** | Quest → Cena | Estrutura de quest |
| **CONTEM_BEAT** | Cena → Beat | Estrutura de cena |
| **OCORRE_EM** | Cena → Local | Local da cena |
| **FILHO_DE** | Local → Local | Hierarquia geográfica |

```typescript
// PERTENCE_A
interface PertenceAEdge {
  cargo?: string;                       // "Lorde Comandante"
  desde_ato: number;
  ate_ato?: number;                     // Se saiu da facção
}

// CONTEM_CENA
interface ContemCenaEdge {
  ordem: number;
  obrigatoria: boolean;
}

// CONTEM_BEAT
interface ContemBeatEdge {
  ordem: number;
}
```

---

### 2.2 Relações de Participação (3)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **PARTICIPA_DE** | Personagem → Quest | Envolvimento em quest |
| **PRESENTE_EM** | Personagem → Cena | Presença em cena específica |
| **ENVOLVIDO_EM** | Personagem → Beat | Participação em beat |

```typescript
// PARTICIPA_DE
interface ParticipaDe {
  papel: 'protagonista' | 'aliado' | 'antagonista' | 'npc';
  obrigatorio: boolean;
}

// PRESENTE_EM (NOVO v3)
interface PresenteEmEdge {
  papel: 'protagonista' | 'aliado' | 'antagonista' | 'figurante' | 'mencionado';
  entra_em_beat?: string;               // Beat onde entra na cena
  sai_em_beat?: string;                 // Beat onde sai da cena
}

// ENVOLVIDO_EM (NOVO v3)
interface EnvolvidoEmEdge {
  tipo_participacao: 'ativo' | 'passivo' | 'observador';
}
```

---

### 2.3 Relações Temporais e Causais (4)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **PRECEDE** | Evento → Evento | Ordem cronológica |
| **LEVA_A** | Quest → Quest | Dependência entre quests |
| **DESENCADEIA** | Quest\|Evento\|Escolha → Evento | Causalidade |
| **MOTIVA** | Evento\|Lore → Personagem\|Faccao | Motivação narrativa |

```typescript
// DESENCADEIA
interface DesencadeiaEdge {
  condicao?: string;
  probabilidade: number;                // 0-100
}

// MOTIVA
interface MotivaEdge {
  natureza: 'positiva' | 'negativa' | 'ambigua';
  descricao?: string;
}
```

---

### 2.4 Relações de Transformação (3)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **TRANSFORMA** | Evento → ArcoPersonagem | Gatilho de mudança de arco |
| **EVOLUI_PARA** | ArcoPersonagem → ArcoPersonagem | Progressão de arco |
| **SENTE** | Personagem → EstadoEmocional | Estado emocional em cena |

```typescript
// TRANSFORMA
interface TransformaEdge {
  natureza: 'positiva' | 'negativa' | 'ambigua';
}

// EVOLUI_PARA
interface EvoluiParaEdge {
  gatilho_evento_id?: string;
}

// SENTE (NOVO v3)
interface SenteEdge {
  em_cena_id: string;                   // Contexto da emoção
  duracao: 'momentaneo' | 'durante_cena' | 'persistente';
}
```

---

### 2.5 Relações de Escolha e Consequência (2)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **OFERECE_ESCOLHA** | Cena → Escolha | Apresenta decisão ao jogador |
| **RESULTA_EM** | Escolha → Cena\|Evento\|VariavelEstado | Consequência da escolha |

```typescript
// OFERECE_ESCOLHA (NOVO v3)
interface OfereceEscolhaEdge {
  condicao?: string;                    // Pré-requisito para aparecer
  momento_beat?: string;                // Em qual beat aparece
}

// RESULTA_EM (NOVO v3)
interface ResultaEmEdge {
  tipo: 'branch_cena' | 'flag_set' | 'variavel_delta' | 'evento_trigger';
  delta?: number;                       // Para VariavelEstado
  condicao?: string;
}
```

---

### 2.6 Relações de Gameplay (3)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **REQUER_ITEM** | Quest\|Cena → Item | Pré-requisito de item |
| **RECOMPENSA_ITEM** | Quest\|Cena → Item | Recompensa |
| **DROPPA_ITEM** | Inimigo → Item | Loot de combate |

```typescript
// REQUER_ITEM
interface RequerItemEdge {
  quantidade: number;
  consumido: boolean;                   // Item é consumido?
}

// RECOMPENSA_ITEM
interface RecompensaItemEdge {
  quantidade: number;
  condicional?: string;                 // Condição para receber
}
```

---

### 2.7 Relações de Estado e Variáveis (2)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **AFETA** | Quest\|Evento\|Escolha → VariavelEstado | Impacto em variável |
| **CONTROLA** | VariavelEstado → Cena | Variável como pré-condição |

```typescript
// AFETA
interface AfetaEdge {
  delta: number;                        // +25, -10
  condicao?: string;
  operacao: 'soma' | 'set' | 'multiplica';
}

// CONTROLA (NOVO v3)
interface ControlaEdge {
  expressao: string;                    // "v_influencia_corvos >= 50"
  tipo: 'habilita' | 'desabilita' | 'modifica';
}
```

---

### 2.8 Relações Narrativas (2)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **INCORPORA** | Quest\|Cena → Tema | Tema explorado |
| **MENCIONA** | Quest\|Evento\|Beat → Personagem\|Lore\|Local\|Item | Referência narrativa |

```typescript
// INCORPORA
interface IncorporaEdge {
  intensidade: 'central' | 'secundario' | 'sutil';
}

// MENCIONA
interface MencionaEdge {
  contexto?: string;
}
```

---

### 2.9 Relações Interpessoais (1)

| Aresta | Origem → Destino | Descrição |
|--------|------------------|-----------|
| **RELACIONA_COM** | Personagem ↔ Personagem | Relacionamento entre personagens |

```typescript
// RELACIONA_COM
interface RelacionaComEdge {
  tipo: 'aliado' | 'inimigo' | 'mentor' | 'familia' | 'romance' | 'rival' | 'alianca_pragmatica' | 'irmao_armas';
  subtipo?: string;                     // "romance_reprimido", "conflito_pai_filho"
  evolui_por_ato: boolean;
  descricao: string;
  ato_inicio: number;
  ato_fim?: number;
}
```

---

## PARTE 3: Diagrama de Relacionamentos

```
                                    ┌─────────────┐
                                    │    Tema     │
                                    └──────▲──────┘
                                           │ INCORPORA
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
              ┌─────┴─────┐          ┌─────┴─────┐          ┌─────┴─────┐
              │   Quest   │──LEVA_A──│   Quest   │──LEVA_A──│   Quest   │
              └─────┬─────┘          └─────┬─────┘          └───────────┘
                    │ CONTEM_CENA          │
                    ▼                      │
              ┌───────────┐                │
              │   Cena    │◄───────────────┘
              └─────┬─────┘
         ┌──────────┼──────────┬───────────────┐
         │          │          │               │
         ▼          ▼          ▼               ▼
    ┌─────────┐ ┌──────┐ ┌──────────┐   ┌───────────┐
    │  Beat   │ │Local │ │ Escolha  │   │Personagem │
    └────┬────┘ └──────┘ └────┬─────┘   └─────┬─────┘
         │                    │               │
         │              RESULTA_EM            │ SENTE
         │                    │               ▼
         │                    ▼         ┌───────────────┐
         │            ┌───────────────┐ │EstadoEmocional│
         │            │VariavelEstado │ └───────────────┘
         │            └───────────────┘
         │
         └──ENVOLVIDO_EM──► Personagem ──RELACIONA_COM──► Personagem
                                │
                                │ PERTENCE_A
                                ▼
                          ┌──────────┐
                          │  Faccao  │
                          └──────────┘
```

---

## PARTE 4: Exemplos Concretos do GDD

### 4.1 Quest "Minerador Aprendiz" Completa

```cypher
// Criar Quest
CREATE (q:Quest {
  id: 'quest_minerador_aprendiz',
  nome: 'Minerador Aprendiz',
  numero_sequencial: 6,
  ato: 1,
  tipo: 'principal',
  objetivo_principal: 'Coletar 9 Kravens na mina'
})

// Criar Cenas
CREATE (c1:Cena {
  id: 'cena_ma_1',
  quest_id: 'quest_minerador_aprendiz',
  numero_sequencial: 1,
  titulo: 'Briefing com Balastrus',
  tipo: 'cutscene',
  pre_condicoes: ['QUEST_PRIMEIRO_CONTRATO_COMPLETA'],
  flags_setadas: ['MINERACAO_INICIADA']
})

CREATE (c5:Cena {
  id: 'cena_ma_5',
  quest_id: 'quest_minerador_aprendiz',
  numero_sequencial: 5,
  titulo: 'Boss Cristaleão',
  tipo: 'gameplay',
  pre_condicoes: ['SIGMETAL_COLETADO >= 9'],
  flags_setadas: ['BOSS_CRISTALEAO_DERROTADO']
})

CREATE (c8:Cena {
  id: 'cena_ma_8',
  quest_id: 'quest_minerador_aprendiz',
  numero_sequencial: 8,
  titulo: 'Escolha do Sigmetal',
  tipo: 'cutscene',
  pre_condicoes: ['BOSS_CRISTALEAO_DERROTADO']
})

// Criar Escolha
CREATE (e1:Escolha {
  id: 'escolha_sigmetal',
  cena_id: 'cena_ma_8',
  texto_escolha: 'Entregar Sigmetal para Balastrus',
  texto_alternativo: 'Entregar Sigmetal para os Corvos',
  tipo: 'moral',
  reversivel: false
})

// Criar Beats
CREATE (b1_1:Beat {
  id: 'beat_ma_1_1',
  cena_id: 'cena_ma_1',
  numero: '1.1',
  descricao: 'Balastrus explica a missão de mineração',
  tipo: 'dialogo',
  personagens_envolvidos: ['thorin', 'balastrus']
})

// Criar Estados Emocionais
CREATE (ee1:EstadoEmocional {
  id: 'ee_thorin_cena5',
  personagem_id: 'thorin',
  cena_id: 'cena_ma_5',
  emocao: 'determinacao',
  intensidade: 'intenso',
  gatilho: 'Primeiro combate real contra boss'
})

// Conectar estrutura
MATCH (q:Quest {id: 'quest_minerador_aprendiz'})
MATCH (c1:Cena {id: 'cena_ma_1'})
MATCH (c5:Cena {id: 'cena_ma_5'})
MATCH (c8:Cena {id: 'cena_ma_8'})
CREATE (q)-[:CONTEM_CENA {ordem: 1}]->(c1)
CREATE (q)-[:CONTEM_CENA {ordem: 5}]->(c5)
CREATE (q)-[:CONTEM_CENA {ordem: 8}]->(c8)

// Conectar escolha e consequências
MATCH (c8:Cena {id: 'cena_ma_8'})
MATCH (e1:Escolha {id: 'escolha_sigmetal'})
MATCH (v:VariavelEstado {nome: 'v_influencia_corvos'})
CREATE (c8)-[:OFERECE_ESCOLHA {momento_beat: '8.3'}]->(e1)
CREATE (e1)-[:RESULTA_EM {tipo: 'variavel_delta', delta: 25}]->(v)

// Conectar personagem e emoção
MATCH (p:Personagem {id: 'thorin'})
MATCH (ee:EstadoEmocional {id: 'ee_thorin_cena5'})
CREATE (p)-[:SENTE {em_cena_id: 'cena_ma_5', duracao: 'durante_cena'}]->(ee)
```

### 4.2 Variáveis de Estado da Quest "Quando o Segundo Sol Chegar"

```cypher
// Criar variáveis
CREATE (v1:VariavelEstado {
  nome: 'v_pontos_armadilhas',
  valor_minimo: 0,
  valor_maximo: 100,
  valor_inicial: 0,
  descricao: 'Pontos acumulados em preparação de armadilhas',
  categoria: 'progressao'
})

CREATE (v2:VariavelEstado {
  nome: 'v_forca_guarda',
  valor_minimo: 0,
  valor_maximo: 100,
  valor_inicial: 30,
  descricao: 'Força da Guarda de Ferro na defesa',
  categoria: 'progressao'
})

CREATE (v3:VariavelEstado {
  nome: 'v_forca_civil',
  valor_minimo: 0,
  valor_maximo: 100,
  valor_inicial: 0,
  descricao: 'Força dos civis mobilizados',
  categoria: 'progressao'
})

CREATE (v4:VariavelEstado {
  nome: 'v_influencia_corvos',
  valor_minimo: 0,
  valor_maximo: 100,
  valor_inicial: 0,
  descricao: 'Nível de confiança com a Família Corvinus',
  categoria: 'relacional'
})

CREATE (v5:VariavelEstado {
  nome: 'v_reforco_sigmetal',
  valor_minimo: 0,
  valor_maximo: 50,
  valor_inicial: 0,
  descricao: 'Quantidade de Sigmetal disponível para reforço',
  categoria: 'contador'
})

// Conectar variáveis às cenas que controlam
MATCH (v:VariavelEstado {nome: 'v_influencia_corvos'})
MATCH (c:Cena {titulo: 'Reunião com Corvinus'})
CREATE (v)-[:CONTROLA {expressao: 'v_influencia_corvos >= 50', tipo: 'habilita'}]->(c)
```

---

## PARTE 5: Queries de Exemplo

### 5.1 "Quais personagens estão na Cena 5 e como se sentem?"

```cypher
MATCH (q:Quest {nome: 'Minerador Aprendiz'})-[:CONTEM_CENA]->(c:Cena {numero_sequencial: 5})
MATCH (p:Personagem)-[:PRESENTE_EM]->(c)
OPTIONAL MATCH (p)-[:SENTE]->(ee:EstadoEmocional {cena_id: c.id})
RETURN
  c.titulo AS cena,
  p.nome AS personagem,
  ee.emocao AS emocao,
  ee.intensidade AS intensidade,
  ee.gatilho AS causa
```

### 5.2 "Quais variáveis controlam a cena atual?"

```cypher
MATCH (c:Cena {id: $cena_id})
MATCH (v:VariavelEstado)-[r:CONTROLA]->(c)
RETURN
  v.nome AS variavel,
  v.descricao AS descricao,
  r.expressao AS condicao,
  r.tipo AS tipo_controle
```

### 5.3 "Quais conflitos aconteceram antes desta cena?"

```cypher
MATCH (q:Quest)-[:CONTEM_CENA]->(c_atual:Cena {id: $cena_id})
MATCH (q)-[:CONTEM_CENA]->(c_anterior:Cena)
WHERE c_anterior.numero_sequencial < c_atual.numero_sequencial
MATCH (p1:Personagem)-[:PRESENTE_EM]->(c_anterior)
MATCH (p2:Personagem)-[:PRESENTE_EM]->(c_anterior)
MATCH (p1)-[r:RELACIONA_COM]->(p2)
WHERE r.tipo IN ['rival', 'inimigo', 'alianca_pragmatica']
RETURN DISTINCT
  c_anterior.titulo AS cena,
  p1.nome AS personagem1,
  r.tipo AS tipo_relacao,
  p2.nome AS personagem2,
  r.descricao AS contexto
ORDER BY c_anterior.numero_sequencial
```

### 5.4 "Qual o caminho de escolhas que levou ao estado atual?"

```cypher
MATCH path = (c_inicio:Cena)-[:OFERECE_ESCOLHA]->(e:Escolha)-[:RESULTA_EM*]->(destino)
WHERE c_inicio.quest_id = $quest_id
RETURN
  [node IN nodes(path) |
    CASE
      WHEN node:Cena THEN node.titulo
      WHEN node:Escolha THEN node.texto_escolha
      WHEN node:VariavelEstado THEN node.nome
      ELSE labels(node)[0]
    END
  ] AS caminho
```

### 5.5 "Qual a jornada emocional de Thorin nesta quest?"

```cypher
MATCH (p:Personagem {nome: 'Thorin'})
MATCH (q:Quest {id: $quest_id})-[:CONTEM_CENA]->(c:Cena)
MATCH (p)-[:SENTE]->(ee:EstadoEmocional {cena_id: c.id})
RETURN
  c.numero_sequencial AS cena_num,
  c.titulo AS cena,
  ee.emocao AS emocao,
  ee.intensidade AS intensidade,
  ee.gatilho AS causa
ORDER BY c.numero_sequencial
```

### 5.6 "Quais beats envolvem conflito entre pai e filho?"

```cypher
MATCH (p1:Personagem)-[r:RELACIONA_COM {subtipo: 'conflito_pai_filho'}]->(p2:Personagem)
MATCH (b:Beat)
WHERE p1.id IN b.personagens_envolvidos AND p2.id IN b.personagens_envolvidos
MATCH (c:Cena)-[:CONTEM_BEAT]->(b)
MATCH (q:Quest)-[:CONTEM_CENA]->(c)
RETURN
  q.nome AS quest,
  c.titulo AS cena,
  b.numero AS beat,
  b.descricao AS descricao,
  b.emocao_dominante AS clima
```

---

## PARTE 6: Script de Inicialização

```sql
-- Criar grafo
SELECT create_graph('daratrine_narrative_v3');

-- Constraints de unicidade
SELECT * FROM cypher('daratrine_narrative_v3', $$
  CREATE CONSTRAINT ON (p:Personagem) ASSERT p.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v3', $$
  CREATE CONSTRAINT ON (q:Quest) ASSERT q.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v3', $$
  CREATE CONSTRAINT ON (c:Cena) ASSERT c.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v3', $$
  CREATE CONSTRAINT ON (b:Beat) ASSERT b.id IS UNIQUE
$$) as (v agtype);

SELECT * FROM cypher('daratrine_narrative_v3', $$
  CREATE CONSTRAINT ON (v:VariavelEstado) ASSERT v.nome IS UNIQUE
$$) as (v agtype);

-- Índices para performance
CREATE INDEX idx_cena_quest ON daratrine_narrative_v3.Cena(quest_id);
CREATE INDEX idx_cena_numero ON daratrine_narrative_v3.Cena(numero_sequencial);
CREATE INDEX idx_beat_cena ON daratrine_narrative_v3.Beat(cena_id);
CREATE INDEX idx_estado_emocional_cena ON daratrine_narrative_v3.EstadoEmocional(cena_id);
CREATE INDEX idx_estado_emocional_personagem ON daratrine_narrative_v3.EstadoEmocional(personagem_id);
CREATE INDEX idx_arco_personagem ON daratrine_narrative_v3.ArcoPersonagem(personagem_id, ato);
```

---

## PARTE 7: Resumo Comparativo

| Aspecto | v1 | v2 | v3 |
|---------|----|----|-----|
| **Labels** | 9 | 11 | 15 |
| **Arestas** | 9 | 15 | 21 |
| **Granularidade** | Quest/Ato | Quest/Ato | Quest/Cena/Beat |
| **Emoções** | Por ato | Por ato | Por cena |
| **Escolhas** | Não | Não | Sim |
| **Pré-condições** | Implícito | Implícito | Explícito |
| **Flags/Variáveis** | Sim | Sim | Sim + CONTROLA |
| **Sequenciamento** | Não | PRECEDE/LEVA_A | + CONTEM_CENA/BEAT |

---

## PARTE 8: Checklist de Capacidades

Com o esquema v3, é possível responder programaticamente:

- [x] Reproduzir todos os modelos de quests do NSD
- [x] Capturar nuances de cada cena (tipo, pré-condições, flags)
- [x] Saber quais personagens estão em cada cena
- [x] Saber o sentimento de cada personagem em cada cena
- [x] Saber quais variáveis controlam cada cena
- [x] Rastrear conflitos anteriores via traversal
- [x] Mapear caminhos de escolha e suas consequências
- [x] Acompanhar jornada emocional de um personagem
- [x] Identificar beats com conflitos específicos (pai/filho, rival, etc.)
- [x] Integrar com sistema de flags do RPG Maker MZ

---

## Documentos de Referência

- `docs/GDD/4-personagens-inimigos-criaturas/Personagens/*.md`
- `docs/GDD/3-historia/timeline-historia-jogo-v5.md`
- `docs/GDD/2-world-building/locais/*.md`
- `docs/Quests/**/*.NSD.fluxo-cenas.md`
- `temp/entidades/resposta-claude-v1.md`
- `temp/entidades/resposta-gemini-v1.md`
- `temp/entidades/resposta-claude-v2.md`
- `temp/entidades/melhorias/analise-comparativa-*.md`
