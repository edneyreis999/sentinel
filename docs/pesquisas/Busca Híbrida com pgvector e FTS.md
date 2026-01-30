# **Arquitetura e Implementação de Busca Híbrida em Sistemas RAG: Otimização de Recuperação com PostgreSQL, pgvector e Reciprocal Rank Fusion**

A eficácia de sistemas de Recuperação Aumentada por Geração (RAG) reside fundamentalmente na qualidade da fase de recuperação. Em contextos de Produção Mínima Viável (MVP), a necessidade de equilibrar a precisão léxica para termos técnicos e a compreensão semântica de textos narrativos impõe desafios arquiteturais significativos.1 A busca puramente vetorial, embora capaz de capturar relações conceituais profundas, frequentemente falha ao lidar com nomes próprios, códigos de erro ou jargões técnicos específicos que possuem baixa representação em modelos de linguagem pré-treinados.2 A busca híbrida, integrando a Busca de Texto Completo (Full-Text Search \- FTS) do PostgreSQL com a extensão pgvector, emerge como a solução técnica mais robusta para consolidar essas capacidades em um único motor de banco de dados, simplificando a infraestrutura de um monólito backend baseado em NestJS.4

## **Fundamentos e Mecanismos da Recuperação Híbrida no PostgreSQL**

A busca híbrida no ecossistema PostgreSQL combina dois paradigmas de recuperação distintos: a busca esparsa, baseada em palavras-chave e frequências de termos, e a busca densa, baseada em vetores de alta dimensão.6 Esta dualidade permite que o sistema de RAG recupere documentos que são tanto léxicamente precisos quanto semanticamente relevantes.2

### **O Paradigma Léxico: Full-Text Search e BM25**

O motor de busca textual nativo do PostgreSQL utiliza as estruturas tsvector e tsquery para processar e consultar documentos. Um tsvector armazena uma lista de lexemas normalizados, enquanto o tsquery define a lógica de pesquisa.9 A precisão léxica é garantida através de processos de tokenização, remoção de stop words e stemming, que reduzem as palavras às suas raízes linguísticas.11

A relevância na busca textual tradicional é frequentemente calculada pelo algoritmo TF-IDF (Term Frequency-Inverse Document Frequency), implementado no PostgreSQL através das funções ts\_rank e ts\_rank\_cd.13 Entretanto, a análise técnica demonstra que o ts\_rank nativo foca na frequência de termos em documentos isolados, carecendo de estatísticas globais refinadas.2 O advento de extensões como o pg\_search introduz o algoritmo BM25 (Best Matching 25), que é o padrão ouro na indústria por aplicar saturação de frequência de termos e normalização de comprimento de documento, mitigando o viés de documentos longos que mencionam termos incidentalmente.2

### **O Paradigma Semântico: pgvector e Espaços Vetoriais**

A busca semântica via pgvector traduz textos em coordenadas em um espaço latente de ![][image1] dimensões. Ao contrário da busca léxica, esta abordagem identifica a proximidade de significado, permitindo que uma consulta sobre "otimização de latência" encontre documentos sobre "melhoria de performance", mesmo sem correspondência exata de palavras.2 A escolha da função de distância é crítica; o pgvector suporta distância L2, produto interno e similaridade de cosseno, sendo esta última a mais prevalente para modelos de embeddings de linguagem como os da OpenAI ou Cohere.17

| Atributo | Busca de Texto Completo (FTS) | Busca Vetorial (pgvector) |
| :---- | :---- | :---- |
| **Tipo de Índice** | Invertido (GIN / GiST) | Grafos de Proximidade (HNSW / IVFFlat) |
| **Ponto Forte** | Precisão em IDs, nomes e jargões | Compreensão de contexto e sinônimos |
| **Algoritmo de Ranking** | ts\_rank\_cd / BM25 | Cosine Similarity / L2 Distance |
| **Dependência Linguística** | Dicionários e Stemmers específicos | Independente (depende do modelo de embedding) |
| **Complexidade de Consulta** | **![][image2]** para GIN | ![][image3] para HNSW |

## **Configuração Avançada do Motor de Busca em Português**

Para um MVP robusto, a configuração padrão do PostgreSQL para o português pode ser insuficiente, especialmente ao lidar com termos técnicos anglicizados comuns na área de TI.19 A implementação exige a criação de uma configuração de busca personalizada que integre o módulo unaccent para remover sensibilidade a diacríticos e dicionários de sinônimos para padronizar siglas técnicas.19

### **Dicionários de Sinônimos e Termos Técnicos**

O uso de arquivos de sinônimos (.syn) permite que o motor de busca trate termos como "DB", "Database" e "Banco de Dados" como equivalentes semânticos na camada léxica.11 A estrutura recomendada para o arquivo $SHAREDIR/tsearch\_data/tech\_synonyms.syn deve contemplar as variações comuns do domínio 11:

db database

pgsql postgresql

js javascript

ts typescript

k8s kubernetes

api interface

A integração desta configuração no PostgreSQL deve seguir uma ordem de precedência rigorosa, onde o dicionário de sinônimos atua antes do stemmer Snowball, garantindo que termos técnicos não sejam erroneamente reduzidos à sua raiz antes da correspondência.11 A utilização de extensões como dict\_xsyn pode ampliar esta capacidade, permitindo a substituição mútua de grupos de sinônimos em tempo de consulta.22

### **Processamento de Texto e Pesos de Campo**

A eficácia do ranking léxico aumenta significativamente quando se aplica a técnica de "field weighting". No PostgreSQL, isso é realizado através da função setweight, que atribui etiquetas (A, B, C ou D) a diferentes partes do documento.12 Tipicamente, termos encontrados no título ('A') recebem um multiplicador de relevância superior aos encontrados no corpo ('B' ou 'C').13 A implementação de colunas geradas (GENERATED ALWAYS AS) automatiza a sincronização deste índice, garantindo que o tsvector esteja sempre atualizado com a versão mais recente do texto e metadados.8

SQL

ALTER TABLE documents   
ADD COLUMN search\_vector tsvector   
GENERATED ALWAYS AS (  
  setweight(to\_tsvector('portuguese', unaccent(coalesce(title, ''))), 'A') |

|   
  setweight(to\_tsvector('portuguese', unaccent(coalesce(content, ''))), 'B')  
) STORED;

Este mecanismo permite que consultas léxicas sejam extremamente eficientes através de índices GIN, suportando operadores booleanos e de proximidade (\<-\>) que são essenciais para encontrar frases exatas em documentações técnicas.9

## **Implementação do pgvector: Topologia e Indexação HNSW**

Para o componente semântico, o pgvector oferece dois tipos principais de índices para Busca de Vizinhos Mais Próximos (ANN): IVFFlat e HNSW (Hierarchical Navigable Small World).17 Para a maioria das aplicações RAG, o HNSW é a escolha superior devido à sua robustez e desempenho superior em termos de recall e latência.17

### **Parâmetros de Performance do HNSW**

A construção do índice HNSW é influenciada por parâmetros que determinam a densidade das conexões no grafo multicamada. O parâmetro m define o número máximo de conexões por nó, enquanto o ef\_construction controla o tamanho da lista de candidatos durante a fase de criação do índice.17 Para um MVP RAG, valores equilibrados são fundamentais para garantir que o sistema escale sem degradação perceptível da qualidade.24

| Parâmetro | Valor Recomendado | Impacto no Sistema |
| :---- | :---- | :---- |
| **m** | 16 \- 32 | Define a conectividade; valores altos melhoram recall mas aumentam uso de RAM.24 |
| **ef\_construction** | 100 \- 128 | Controla a profundidade da busca na criação; altos valores melhoram o grafo e o recall final.17 |
| **ef\_search** | 40 \- 100 | Ajustado em tempo de query; determina quantos nós explorar para encontrar vizinhos.24 |

A análise da complexidade demonstra que, enquanto a busca linear tem custo ![][image4], o HNSW opera em ![][image3], permitindo que sistemas com milhões de documentos retornem resultados em milissegundos.24 É recomendável monitorar o "Recall@K", comparando o índice HNSW com uma busca exata (flat), para assegurar que a taxa de acerto permaneça entre 80% e 95%, garantindo a fidelidade do contexto fornecido ao LLM.24

## **Reciprocal Rank Fusion (RRF): O Algoritmo de Fusão de Rankings**

O desafio fundamental da busca híbrida é combinar pontuações de relevância de escalas incompatíveis: o BM25 produz valores ilimitados, enquanto a similaridade de cosseno do pgvector varia entre \-1 e 1\.1 O Reciprocal Rank Fusion (RRF) resolve esta inconsistência ignorando as pontuações brutas e focando exclusivamente na posição (rank) de cada documento nas listas de resultados.7

### **Fundamentação Matemática do RRF**

A pontuação RRF para um documento ![][image5] é a soma dos inversos de sua posição em cada ranking, suavizada por uma constante ![][image6].2 A constante ![][image6] (geralmente fixada em 60\) serve para mitigar a influência excessiva de documentos que aparecem no topo de apenas uma lista, promovendo aqueles que aparecem de forma consistente em ambas.1

![][image7]  
Estudos indicam que o RRF é altamente robusto e frequentemente supera métodos de fusão baseados em pontuações normalizadas, pois não requer treinamento prévio ou calibração complexa de pesos para diferentes distribuições de dados.1

### **Implementação de RRF Ponderado em SQL**

Em cenários onde a precisão técnica é primordial, pode-se aplicar o RRF Ponderado (Weighted RRF). Isso permite atribuir pesos diferentes às fontes de busca, como priorizar 70% para a busca léxica e 30% para a semântica quando se sabe que a consulta contém muitos termos específicos.2

SQL

WITH semantic\_hits AS (  
  SELECT id, row\_number() OVER (ORDER BY embedding \<=\> $1) as rank  
  FROM documents  
  ORDER BY embedding \<=\> $1  
  LIMIT 50  
),  
lexical\_hits AS (  
  SELECT id, row\_number() OVER (ORDER BY ts\_rank\_cd(search\_vector, websearch\_to\_tsquery('portuguese', $2)) DESC) as rank  
  FROM documents  
  WHERE search\_vector @@ websearch\_to\_tsquery('portuguese', $2)  
  LIMIT 50  
)  
SELECT   
  coalesce(s.id, l.id) as id,  
  (coalesce(0.4 \* 1.0 / (60 \+ s.rank), 0.0) \+   
   coalesce(0.6 \* 1.0 / (60 \+ l.rank), 0.0)) as score  
FROM semantic\_hits s  
FULL OUTER JOIN lexical\_hits l ON s.id \= l.id  
ORDER BY score DESC  
LIMIT 10;

O uso de FULL OUTER JOIN é essencial para garantir que documentos presentes em apenas um dos métodos de busca ainda contribuam para o resultado final, permitindo que a busca semântica recupere contextos relevantes mesmo quando não há correspondência exata de termos.2

## **Estratégias de Chunking Semântico para Documentos Técnicos**

A fragmentação (chunking) do texto é um passo prévio à indexação que determina o contexto atômico recuperado pelo sistema.28 Estratégias ingênuas, como divisões por número fixo de caracteres, frequentemente quebram a coesão de parágrafos técnicos ou separam definições de seus termos.29 O chunking semântico utiliza o significado do texto para identificar pontos naturais de ruptura.28

### **Algoritmo Max-Min Semantic Chunking**

A técnica de Max-Min Semantic Chunking propõe um fluxo onde a decisão de divisão é baseada na similaridade vetorial entre sentenças consecutivas.31 O processo minimiza o "Contextual Drift" (deriva contextual) ao garantir que cada fragmento mantenha uma consistência interna elevada.4

1. **Sentenciação e Embedding**: O documento é dividido em sentenças individuais, e cada uma recebe um embedding.31  
2. **Cálculo de Similaridade Interna**: Para o bloco atual, mede-se a similaridade cosseno mínima entre todos os pares de sentenças já presentes no chunk.31  
3. **Regra de Expansão**: Uma nova sentença é integrada ao chunk se sua similaridade máxima com qualquer sentença do bloco for superior à similaridade mínima interna do bloco.31  
4. **Ajuste Dinâmico**: Se a regra falhar, um novo chunk é iniciado. Parâmetros como o tamanho máximo do chunk (ex: 512 tokens) atuam como limitadores físicos para respeitar a janela de contexto do LLM.28

Esta abordagem, embora computacionalmente mais cara que o chunking recursivo por caracteres, resulta em fragmentos tematicamente coesos que melhoram a precisão do RAG em 2 a 9 pontos percentuais de recall, conforme pesquisas da NVIDIA e Chroma.29

## **Arquitetura Limpa em NestJS: Implementação do Módulo RAG**

Para garantir que o módulo RAG seja sustentável e isolado dentro de um monólito NestJS, deve-se adotar padrões de Arquitetura Limpa (Clean Architecture), separando as preocupações de domínio das infraestruturas de banco de dados e APIs externas.33

### **Organização de Camadas e Responsabilidades**

A estrutura do módulo deve seguir o princípio da inversão de dependência, onde o núcleo da aplicação não conhece os detalhes do PostgreSQL ou das APIs de Embedding.33

* **Camada de Domínio**: Contém entidades como Document e Chunk, além da interface IRagRepository, definindo o contrato de busca sem detalhes técnicos.33  
* **Camada de Aplicação**: Implementa os casos de uso, como QueryHybridSearchUseCase, orquestrando a geração de embeddings e a chamada ao repositório.34  
* **Camada de Infraestrutura**: Contém os adaptadores para o PostgreSQL usando TypeORM ou Prisma, e implementações de clientes para APIs externas (OpenAI, Anthropic).34

### **O Repositório e a Abstração do Banco de Dados**

Dado que ORMs como o TypeORM não possuem suporte nativo de alto nível para as funções avançadas de FTS e pgvector necessárias para o RRF, a implementação do repositório deve utilizar consultas SQL brutas (Raw SQL) protegidas por abstrações de serviço.38 Isso previne o "leaking" de preocupações do banco de dados para a lógica de negócio.41

TypeScript

// rag.repository.ts  
@Injectable()  
export class PostgresRagRepository implements IRagRepository {  
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async findHybrid(vector: number, text: string): Promise\<RagDocument\> {  
    // Implementação de Raw SQL com parâmetros sanitizados  
    return this.dataSource.query(HYBRID\_SEARCH\_SQL,);  
  }  
}

A centralização da lógica de busca no repositório facilita a manutenção e permite a otimização de consultas sem impactar os consumidores do serviço RAG.40 O uso de um transformer personalizado no TypeORM pode ser necessário para mapear os arrays de float do TypeScript para o tipo vector do PostgreSQL de forma transparente.39

## **Estratégias para Qualidade de Ranking e Casos Reais**

A qualidade do ranking em um sistema RAG real depende de sinais adicionais além da similaridade semântica e léxica. Em sistemas de memória de longo prazo ou suporte técnico, a recência da informação e a importância editorial (ex: documentos marcados como "verificados") são fatores cruciais.4

### **Incorporação de Sinais de Recência e Popularidade**

O RRF pode ser estendido para incluir um terceiro ranking baseado na data de criação ou última atualização. Documentos mais recentes podem receber um impulso na pontuação final para evitar o "Contextual Drift" onde fatos obsoletos são recuperados pelo LLM.2

![][image8]  
Estudos de caso indicam que a inclusão de um componente de recência reduz significativamente a recuperação de informações desatualizadas em sistemas dinâmicos.4

### **Tratamento de Casos de Borda: Queries Curtas e Ruído**

Consultas muito curtas ou compostas apenas por stop words representam um risco de performance, podendo gerar scans desnecessários ou resultados irrelevantes.14 A implementação de "guard-rails" é recomendada:

1. **Normalização de Hifens**: Termos técnicos como "invoice-2024" devem ser normalizados para evitar que o hífen seja interpretado como o operador NOT pelo parser de FTS do Postgres.14  
2. **Tratamento de OCR e Metadados**: Em documentos processados por OCR, o ruído pode poluir o índice léxico. Atribuir pesos menores ao conteúdo de OCR em relação aos metadados curados (títulos, tags) garante que os termos de alta qualidade dominem o ranking.14  
3. **Fuzzy Matching**: Para lidar com erros de digitação do usuário, a extensão pg\_trgm (trigramas) pode ser integrada à busca léxica, permitindo uma correspondência aproximada antes da fusão RRF.13

## **Guia de Implementação Prática: Do Setup ao Deploy**

Para concretizar a arquitetura descrita, o roteiro de implementação deve ser seguido rigorosamente, garantindo a integridade dos dados e a eficiência das buscas.

### **Passo 1: Configuração do Ambiente PostgreSQL**

A infraestrutura deve estar preparada com as extensões necessárias. Se estiver usando Docker, uma imagem baseada em pgvector/pgvector é o ponto de partida ideal.16

SQL

\-- Habilitar extensões  
CREATE EXTENSION IF NOT EXISTS vector;  
CREATE EXTENSION IF NOT EXISTS unaccent;  
CREATE EXTENSION IF NOT EXISTS pg\_trgm;

\-- Criar tabela com suporte a busca híbrida  
CREATE TABLE knowledge\_base (  
    id SERIAL PRIMARY KEY,  
    content TEXT NOT NULL,  
    metadata JSONB,  
    embedding vector(1536), \-- Compatível com modelos OpenAI  
    fts\_vector tsvector GENERATED ALWAYS AS (  
        to\_tsvector('portuguese', unaccent(content))  
    ) STORED  
);

### **Passo 2: Implementação do Provedor de Embeddings no NestJS**

O serviço de infraestrutura deve abstrair a chamada para a API externa, gerenciando retentativas e logs de erro.16

TypeScript

@Injectable()  
export class EmbeddingProvider {  
  constructor(private config: ConfigService) {}

  async create(text: string): Promise\<number\> {  
    const response \= await axios.post('https://api.openai.com/v1/embeddings', {  
      input: text,  
      model: "text-embedding-3-small"  
    }, {  
      headers: { 'Authorization': \`Bearer ${this.config.get('OPENAI\_API\_KEY')}\` }  
    });  
    return response.data.data.embedding;  
  }  
}

### **Passo 3: Orquestração do RAG no Caso de Uso**

O serviço de aplicação coordena o fluxo: recebe a pergunta, gera o embedding, executa a busca híbrida no banco e formata o contexto para o LLM.1 A integração de ferramentas como o ts-tiktoken para contagem de tokens no lado do NestJS ajuda a garantir que o contexto retornado não exceda os limites da janela do modelo de geração.44

### **Passo 4: Otimização e Cache**

Para endpoints de alta demanda, a pré-computação de pontuações híbridas em visualizações materializadas ou o uso de cache (Redis) para consultas frequentes pode reduzir significativamente a carga na CPU do banco de dados.5 O particionamento de índices por metadados (ex: por cliente ou por ano) é uma técnica avançada que mantém a performance estável mesmo com o crescimento linear do volume de dados.5

A consolidação de uma busca híbrida robusta dentro do PostgreSQL, utilizando pgvector para semântica e FTS para precisão léxica, oferece uma solução pragmática e de alta performance para sistemas RAG modernos. A simplicidade de manter uma única base de dados, aliada à sofisticação do algoritmo RRF e estratégias de chunking semântico, garante que o MVP não apenas atenda aos requisitos iniciais de precisão técnica, mas também possua uma base sólida para escalabilidade e evolução arquitetural contínua.

#### **Referências citadas**

1. RAG Series \- Hybrid Search with Re-ranking \- dbi services, acessado em janeiro 30, 2026, [https://www.dbi-services.com/blog/rag-series-hybrid-search-with-re-ranking/](https://www.dbi-services.com/blog/rag-series-hybrid-search-with-re-ranking/)  
2. Hybrid Search in PostgreSQL: The Missing Manual \- ParadeDB, acessado em janeiro 30, 2026, [https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual](https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual)  
3. From ts\_rank to BM25. Introducing pg\_textsearch: True BM25 Ranking and Hybrid Retrieval Inside Postgres | Tiger Data, acessado em janeiro 30, 2026, [https://www.tigerdata.com/blog/introducing-pg\_textsearch-true-bm25-ranking-hybrid-retrieval-postgres](https://www.tigerdata.com/blog/introducing-pg_textsearch-true-bm25-ranking-hybrid-retrieval-postgres)  
4. Under the Hood: Building a Hybrid Search Engine for AI Memory (Node.js \+ pgvector), acessado em janeiro 30, 2026, [https://dev.to/the\_nortern\_dev/under-the-hood-building-a-hybrid-search-engine-for-ai-memory-nodejs-pgvector-3c5k](https://dev.to/the_nortern_dev/under-the-hood-building-a-hybrid-search-engine-for-ai-memory-nodejs-pgvector-3c5k)  
5. pgvector Hybrid Search: Benefits, Use Cases & Quick Tutorial, acessado em janeiro 30, 2026, [https://www.instaclustr.com/education/vector-database/pgvector-hybrid-search-benefits-use-cases-and-quick-tutorial/](https://www.instaclustr.com/education/vector-database/pgvector-hybrid-search-benefits-use-cases-and-quick-tutorial/)  
6. Run a hybrid vector similarity search | AlloyDB for PostgreSQL | Google Cloud Documentation, acessado em janeiro 30, 2026, [https://docs.cloud.google.com/alloydb/docs/ai/run-hybrid-vector-similarity-search](https://docs.cloud.google.com/alloydb/docs/ai/run-hybrid-vector-similarity-search)  
7. What is Reciprocal Rank Fusion? \- ParadeDB, acessado em janeiro 30, 2026, [https://www.paradedb.com/learn/search-concepts/reciprocal-rank-fusion](https://www.paradedb.com/learn/search-concepts/reciprocal-rank-fusion)  
8. Hybrid search | Supabase Docs, acessado em janeiro 30, 2026, [https://supabase.com/docs/guides/ai/hybrid-search](https://supabase.com/docs/guides/ai/hybrid-search)  
9. Full-Text Search in PostgreSQL \- ParadeDB, acessado em janeiro 30, 2026, [https://www.paradedb.com/learn/search-in-postgresql/full-text-search](https://www.paradedb.com/learn/search-in-postgresql/full-text-search)  
10. Full-Text Search in PostgreSQL by authors, acessado em janeiro 30, 2026, [http://www.sai.msu.su/\~megera/postgres/talks/fts\_postgres\_by\_authors\_2.pdf](http://www.sai.msu.su/~megera/postgres/talks/fts_postgres_by_authors_2.pdf)  
11. Documentation: 18: 12.6. Dictionaries \- PostgreSQL, acessado em janeiro 30, 2026, [https://www.postgresql.org/docs/current/textsearch-dictionaries.html](https://www.postgresql.org/docs/current/textsearch-dictionaries.html)  
12. Documentation: 18: 12.3. Controlling Text Search \- PostgreSQL, acessado em janeiro 30, 2026, [https://www.postgresql.org/docs/current/textsearch-controls.html](https://www.postgresql.org/docs/current/textsearch-controls.html)  
13. How to Implement Full-Text Search in PostgreSQL \- OneUptime, acessado em janeiro 30, 2026, [https://oneuptime.com/blog/post/2026-01-21-postgresql-full-text-search/view](https://oneuptime.com/blog/post/2026-01-21-postgresql-full-text-search/view)  
14. Hybrid document search: embeddings \+ Postgres FTS (ts\_rank\_cd) : r/PostgreSQL \- Reddit, acessado em janeiro 30, 2026, [https://www.reddit.com/r/PostgreSQL/comments/1qpeqdq/hybrid\_document\_search\_embeddings\_postgres\_fts\_ts/](https://www.reddit.com/r/PostgreSQL/comments/1qpeqdq/hybrid_document_search_embeddings_postgres_fts_ts/)  
15. Text Search With MongoDB (BM25 TF-IDF) and PostgreSQL \- DEV Community, acessado em janeiro 30, 2026, [https://dev.to/mongodb/text-search-with-mongodb-and-postgresql-full-text-search-1blg](https://dev.to/mongodb/text-search-with-mongodb-and-postgresql-full-text-search-1blg)  
16. Building Vector Search with PostgreSQL and pgvector: A Complete Guide \- Medium, acessado em janeiro 30, 2026, [https://medium.com/@author.hlukhaniuk/building-vector-search-with-postgresql-and-pgvector-a-complete-guide-6b7a000cc6b7](https://medium.com/@author.hlukhaniuk/building-vector-search-with-postgresql-and-pgvector-a-complete-guide-6b7a000cc6b7)  
17. pgvector/pgvector: Open-source vector similarity search for Postgres \- GitHub, acessado em janeiro 30, 2026, [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)  
18. Speed up PostgreSQL® pgvector queries with indexes, acessado em janeiro 30, 2026, [https://aiven.io/developer/postgresql-pgvector-indexes](https://aiven.io/developer/postgresql-pgvector-indexes)  
19. Cannot get right results from postgre full-text search \- Stack Overflow, acessado em janeiro 30, 2026, [https://stackoverflow.com/questions/3935941/cannot-get-right-results-from-postgre-full-text-search](https://stackoverflow.com/questions/3935941/cannot-get-right-results-from-postgre-full-text-search)  
20. Postgres full-text search with synonyms \- Stack Overflow, acessado em janeiro 30, 2026, [https://stackoverflow.com/questions/11852996/postgres-full-text-search-with-synonyms](https://stackoverflow.com/questions/11852996/postgres-full-text-search-with-synonyms)  
21. PostgreSQL Full-Text Search: A Powerful Alternative to Elasticsearch for Small to Medium Applications, acessado em janeiro 30, 2026, [https://iniakunhuda.medium.com/postgresql-full-text-search-a-powerful-alternative-to-elasticsearch-for-small-to-medium-d9524e001fe0](https://iniakunhuda.medium.com/postgresql-full-text-search-a-powerful-alternative-to-elasticsearch-for-small-to-medium-d9524e001fe0)  
22. 18: F.13. dict\_xsyn — example synonym full-text search dictionary \- PostgreSQL, acessado em janeiro 30, 2026, [https://www.postgresql.org/docs/current/dict-xsyn.html](https://www.postgresql.org/docs/current/dict-xsyn.html)  
23. Documentation: 18: 12.7. Configuration Example \- PostgreSQL, acessado em janeiro 30, 2026, [https://www.postgresql.org/docs/current/textsearch-configuration.html](https://www.postgresql.org/docs/current/textsearch-configuration.html)  
24. HNSW at Scale: Why Your RAG System Gets Worse as the Vector Database Grows, acessado em janeiro 30, 2026, [https://towardsdatascience.com/hnsw-at-scale-why-your-rag-system-gets-worse-as-the-vector-database-grows/](https://towardsdatascience.com/hnsw-at-scale-why-your-rag-system-gets-worse-as-the-vector-database-grows/)  
25. Enhancing AI retrieval with HNSW in RAG applications \- IBM Developer, acessado em janeiro 30, 2026, [https://developer.ibm.com/tutorials/awb-enhancing-retrieval-hnsw-rag/](https://developer.ibm.com/tutorials/awb-enhancing-retrieval-hnsw-rag/)  
26. Hybrid Search Using Reciprocal Rank Fusion in SQL \- SingleStore, acessado em janeiro 30, 2026, [https://www.singlestore.com/blog/hybrid-search-using-reciprocal-rank-fusion-in-sql/](https://www.singlestore.com/blog/hybrid-search-using-reciprocal-rank-fusion-in-sql/)  
27. Reciprocal Rank Fusion and Relative Score Fusion: Classic Hybrid Search Techniques | by MongoDB \- Medium, acessado em janeiro 30, 2026, [https://medium.com/mongodb/reciprocal-rank-fusion-and-relative-score-fusion-classic-hybrid-search-techniques-3bf91008b81d](https://medium.com/mongodb/reciprocal-rank-fusion-and-relative-score-fusion-classic-hybrid-search-techniques-3bf91008b81d)  
28. Essential Chunking Techniques for Building Better LLM Applications \- MachineLearningMastery.com, acessado em janeiro 30, 2026, [https://machinelearningmastery.com/essential-chunking-techniques-for-building-better-llm-applications/](https://machinelearningmastery.com/essential-chunking-techniques-for-building-better-llm-applications/)  
29. Best Chunking Strategies for RAG in 2025 \- Firecrawl, acessado em janeiro 30, 2026, [https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025](https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025)  
30. The Ultimate Guide to Chunking Strategies for RAG Applications with Databricks \- Medium, acessado em janeiro 30, 2026, [https://medium.com/@debusinha2009/the-ultimate-guide-to-chunking-strategies-for-rag-applications-with-databricks-e495be6c0788](https://medium.com/@debusinha2009/the-ultimate-guide-to-chunking-strategies-for-rag-applications-with-databricks-e495be6c0788)  
31. Embedding First, Then Chunking: Smarter RAG Retrieval ... \- Milvus, acessado em janeiro 30, 2026, [https://milvus.io/blog/embedding-first-chunking-second-smarter-rag-retrieval-with-max-min-semantic-chunking.md](https://milvus.io/blog/embedding-first-chunking-second-smarter-rag-retrieval-with-max-min-semantic-chunking.md)  
32. Raubachm/sentence-transformers-semantic-chunker \- Hugging Face, acessado em janeiro 30, 2026, [https://huggingface.co/Raubachm/sentence-transformers-semantic-chunker](https://huggingface.co/Raubachm/sentence-transformers-semantic-chunker)  
33. wesleey/nest-clean-architecture: DDD, software architecture, design patterns, best practices. Clean architecture implementation with the NestJS framework. \- GitHub, acessado em janeiro 30, 2026, [https://github.com/wesleey/nest-clean-architecture](https://github.com/wesleey/nest-clean-architecture)  
34. Clean Architecture Demystified: Refactoring Your Nest.js App \- JavaScript in Plain English, acessado em janeiro 30, 2026, [https://javascript.plainenglish.io/clean-architecture-demystified-refactoring-your-nest-js-app-867355a27062](https://javascript.plainenglish.io/clean-architecture-demystified-refactoring-your-nest-js-app-867355a27062)  
35. Can anyone share Clean Code Architecture with NestJS and best practices? Also, where should I throw HTTP errors? \- Reddit, acessado em janeiro 30, 2026, [https://www.reddit.com/r/Nestjs\_framework/comments/1j45f7f/can\_anyone\_share\_clean\_code\_architecture\_with/](https://www.reddit.com/r/Nestjs_framework/comments/1j45f7f/can_anyone_share_clean_code_architecture_with/)  
36. Repository Pattern in NestJS: Do It Right or Go Home \- DEV Community, acessado em janeiro 30, 2026, [https://dev.to/adamthedeveloper/repository-pattern-in-nestjs-do-it-right-or-go-home-268f](https://dev.to/adamthedeveloper/repository-pattern-in-nestjs-do-it-right-or-go-home-268f)  
37. Best Folder Structure for NestJS Projects (2025 Guide) | by Nairi Abgaryan \- Medium, acessado em janeiro 30, 2026, [https://medium.com/@nairi.abgaryan/stop-the-chaos-clean-folder-file-naming-guide-for-backend-nest-js-and-node-331fdc6400cb](https://medium.com/@nairi.abgaryan/stop-the-chaos-clean-folder-file-naming-guide-for-backend-nest-js-and-node-331fdc6400cb)  
38. How to Execute Raw PostgreSQL Queries in NestJS \- JavaScript in Plain English, acessado em janeiro 30, 2026, [https://javascript.plainenglish.io/how-to-execute-raw-postgresql-queries-in-nestjs-1967a0cb950b](https://javascript.plainenglish.io/how-to-execute-raw-postgresql-queries-in-nestjs-1967a0cb950b)  
39. typeorm not supports 'vector' type directly for hybrid search using postgresql \- Stack Overflow, acessado em janeiro 30, 2026, [https://stackoverflow.com/questions/79754543/typeorm-not-supports-vector-type-directly-for-hybrid-search-using-postgresql](https://stackoverflow.com/questions/79754543/typeorm-not-supports-vector-type-directly-for-hybrid-search-using-postgresql)  
40. NestJS & Repository Pattern — Part 1 | by Buddika Gunawardena | Dec, 2025, acessado em janeiro 30, 2026, [https://javascript.plainenglish.io/nestjs-repository-pattern-part-1-7e45ae702b34](https://javascript.plainenglish.io/nestjs-repository-pattern-part-1-7e45ae702b34)  
41. Implementing the Repository Pattern in NestJS (and why we should) | by Mitchell Anton, acessado em janeiro 30, 2026, [https://medium.com/@mitchella0100/implementing-the-repository-pattern-in-nestjs-and-why-we-should-e32861df5457](https://medium.com/@mitchella0100/implementing-the-repository-pattern-in-nestjs-and-why-we-should-e32861df5457)  
42. Repository Pattern in NestJS | Synapse Studios Standards, acessado em janeiro 30, 2026, [https://docs.synapsestudios.com/implementation/frameworks/nest/repository-pattern](https://docs.synapsestudios.com/implementation/frameworks/nest/repository-pattern)  
43. I implemented Hybrid Search (BM25 \+ pgvector) in Postgres to fix RAG retrieval for exact keywords. Here is the logic. \- Reddit, acessado em janeiro 30, 2026, [https://www.reddit.com/r/Rag/comments/1pcvtan/i\_implemented\_hybrid\_search\_bm25\_pgvector\_in/](https://www.reddit.com/r/Rag/comments/1pcvtan/i_implemented_hybrid_search_bm25_pgvector_in/)  
44. How to Chunk Text in JavaScript for Your RAG Application \- Phil Nash, acessado em janeiro 30, 2026, [https://philna.sh/blog/2024/09/18/how-to-chunk-text-in-javascript-for-rag-applications/](https://philna.sh/blog/2024/09/18/how-to-chunk-text-in-javascript-for-rag-applications/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAAA3UlEQVR4XmNgGAWkgnlA/BmI/0PxAhRZCPjLgJAHYWdUaVSArBAb2AfEKuiC6IARiLcD8XoGiEFBqNJggMsCFJAPxCZQNi5X/UEXwAbeIrE/MEAM4kMSUwPiTiQ+ToDsAlA4gPg3kcSWATEPEh8rAIXPZjQxdO9h8yoGQA4fZDGQ5m4o/xeSHE7wDl0ACmCu0gbiFjQ5rACXs3czQOTuATEnmhwGYAHiveiCUMDEgBlWWAEzEL8B4pPoEkjgGxB/RxdEBquA+CMDJP2A0g0oL2ED+kCcjS44CkYBEAAABi803bhnVOIAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFUAAAAWCAYAAACxOdCYAAADmklEQVR4Xu2YS6hOURTHl2ceIZKBPDLwiEgZeA3kEcrIIxS5KUIiJSIjE4SBAWHA2KNQmBhdUgwoScm7vN/v93v9717ru+usb+/vO+peju791eqc/V9r77O/ffdZe51L1EwzTZXJXmgmS1+2PWw72To7X4ylbOu82MC0Yhvoxf+BHWy/2BZIuw/bU7bPpYhyerM99KLhOYUx1Ty3Keu/lnXX8ZrS/RubZ2w/KP3805TwtRQRATG+s/30ooB+7bzoOMZ2kULsaOcDrdmuetGBP3TZxP8Sq9jOUHj+eudTsEYZEIwdk2IChZiJTh/D9sVpMdC3rVy/Oh9YwTbNi47Z9O8W9YVcozuSGcq2zQr3KR5o0Z182OnfKF8ufSNXxGMc7EzLY9eOMYOqz7Ox0OdekfshxgcOkDl7xlEIqlUhQVcKcchtFmjtneYZxrZa7sdS6INXyZJnsaZTOm4N2yMKB2sb51NQnRximy/tWraPJW+aFmzH5b4jhTm8q3fXkZmX7pxqORETQdwlo3USrRpHKJzcCvr4fudcO0ZsUXuK1k/a+kbNK0WERYG2Qdr7pA1wrVZRrGQbYdo4W9AP4ypYxxKxHxjjOoU4lE7KeNGq4WO2iKa7F2PmqXFji4r2bqcNFh0LDM5K24L2dqel0HyqTKXQX3fvILZN6uwhTv/AGLG4hREthuZTix3viXVUwC/qFGl3MZoCfa/coyTy80T7lNNS+L7Azv8ghbRQB15JOD6pkGAWhThfbtWIXonhFPKdRxN+f7nmwS/qfmnHcqj9XZrHlV7SxqaqBnb7SS8yuyiMsUiuGeyKp0jFjKK4bsEr4k96oAkfu9gfWin8oqJ2RFvzqQX6LdPWPyKehytKoDwgReF3xtB1KSsp9SEp7lLwx3aDVgSVqOTXhI/cnIc5lB1PDyDNzYrOCzU0WMw2t979R7z1guEOheds9A4Ax2UvUshFmVMtAvqiqI+BUxN+e0paNOHnZRmFeFtJbBbNgs/qm6Y9gELMBQpvxQm2rRTPxZZJFPp18A6hGwV/snLS7/PzFHIR7kdmIuLEdgped9RxL8VQC+JQieFP1hQf2B6w3aPwoXDU+FDu4BXEXGBLjA90Nz5veph53rO9ojB/3OOPFwO+BmctNdLADQgWDzW1Rz+9CwkmFjuMigLmF0tB+qFQSJAbb3ixQGjetQfiTNF86ioUSPw4ZYsMFhD/gsRn83LnKyw1Xmhq/AbT2Awm4tfvVQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAAYCAYAAABQiBvKAAADU0lEQVR4Xu2YSciNURjHHzNliGShkJKUhY0yLMgQFkphJfmyUIawIH07GwtDShlTJMWCQllYmD7zUISNUDKljJF59vydc7zP/d9z7n257v3cur/613v+z3PO+57znvecc69Igwb1xiQ26ozpbPwJA1TbVJtU3SkWY76qmbzeqiHk/c/MUO1ksxwbVD9Uc3y5v+qp6uPvjGL6qR6b8hhxbUAnjF8L0OE3kt1/V0HU8U2yODTBxC6rZplykrbiKp/igOer6jubHtTrzKa0zoAF7IDEwHMNYtOTqlMAku6yaRgvxW8DjFZ9Ii/QWgPWRnVEdVDcM8TWplKDck+1kU3LIyndAAgzcD/5X6R47Qq01oAtVQ3316lZhi8mxVSJ1/nFWHHBFvKZnuLyXpEPrwt5gdSA4VM4pzov2VrJ9FCtFLemdlKNUL2VMm/e88Jc43nxHHbjGqxaY8oxkgOGGYJgbA2yzBaXd8143byXIjZgF1V3THm9FG8oq8XV7arq5a/3qCb763LYHLwclG8Zb6+4tkuBOqPYBAjkeYjb4vJwfAiM814KHrAF3mPgnaXyclPGMhCrFwPr12HyuI952kLOXDb7+EDeBjgPDbJn4QGLtQGQwx1aaMo7vJcHu35ZD/XX+fJnE0uBfMz0Atr5wAcOEDPF5fGRo8n7KRA7SeVY/iFxPp4HYEG+koXlnbj1Kw8v2fCEew9VraJYDORiuSgi1QlLKmekxP1A3gHD4m99HB7vizv3wcd1XmLtg6PiYjg6pTYpC3KXsAleS/om4IG4eAcOSLZzpkDMzkrMmlh+2HgCsZw8tFcdZ9MTjkV520YezphRELzBpvJMXGdKgbod2fQgdj3i4TdqYJj3cIwIYGbh07ogbmZgV5tm4jHwOT9XXeKA4b2UX34CZQcWN0MStn00imucfcqBvGXkTVQ9UT0U9xsTs9iyW7K3jWMKZoblgI/FFGOfuHvg/IVzF34rxsDLWcRmBPzrkrpXxayQ/AtyHrZK8QAH0IntbFaBm6rFbP5L0BGeJX/LVdUZNj1Y/DGbqk3VZldgihSe3isFn5QdGLyMFsl3fqqUY+L6U3XWquaxWQEDVVtUp1WbVX0Lw1UB/8hgg6kZTWzUGfbXRYMGNeYnkk37KeeKdKAAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAYCAYAAAC8/X7cAAACQElEQVR4Xu2Wy6tOURjGH9c4okyYuHQGpjJzK0I5SiYylJOBMmEilz9BRgaK/0FJmcgIEybqJCWUgST3S+6X8D7Wu863vud7916Hs5V0fvX07f28l9231tprL2CK/4+takySVWr8DstNZ0ynTAskFrHfdEzNDvihRo2TSEV7/H6Z6anp03jGIEtNj9QseI7UM0u5j/74nSI2bHpV3DcyHan4igacb6bvajqsm6OmcN50Ayl3rcTITNNtNZ33ph1qKmzMkWhiM1LOFvHXmT6LF8Ha2f77RWLkgGm7ms4KxDM3zkNUEtCbobPif8XE1v4b/2U++3DESx7LvcKaITXJRqTgZfGVhUh5r8WnN1c8ZaXpkF+vR6q52gv/ojaAjJ9Qk+QRqa3h3Uh5Y4U3370a50wzinvWaN01uVcuoWGpRs0i7iLlcbvMbHKvhuYcdy/PCnvWviHc0rUPFrk5EAiI8vYGXkRe/yVlvydloIGjCJ7FaaX5UQPCLqQ83WJH3W+DX9PDahq3kGqrO4zDHmFeNLJKU84axH7JBQzuOGQeUi1nR1/oiNNoeBYbhAHnAVJ8lgbQ25naaIvzw8g436UaF00f1MywyU01jWdIu1QbrOUHKuIgUnyaBpxtaP+DJczjMaeRfF65jvRO8Hp1X0YM8/JukuGSeWt66eLIjfRl9HihRgN8Dme8c46Y3qnZMUsw8Zn6I9g8elG7gqfRnWp2CdfyPTU7YjHq56RO4Dlln5od8FeXjjKqxiTZoMYU/xI/AZZrlpk7sM3pAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAYCAYAAADDLGwtAAAAm0lEQVR4XmNgGNRAAohl0AWRwUIg/g/FRWhyGECTAaKQBV0CHaxkgCgkCECKvqILwkAPEDdB2SCFNUhyYFAJxL+gbFUGhEfY4SqAIBUqyIEkdgkqhgJAAs+xiH1HFvCACqYjC0LFGpAFlkEFkYEKVAzZKQxToILIYAmS2FKYIDeSIAgEQ/kwMRRDnKECIJwNFfsH5QvBFI0CnAAAenEoOjLVGH8AAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAXCAYAAADduLXGAAAAoElEQVR4XmNgGJSAEYhV0QWxgadA/B+KiQJXGEhQDFJ4DV0QFwApjkAXxAaiGDCd0ATE/mhiYHCTAaGYC4jvAzEfEH+Dq0ACIIW3gVgQiDdCxX5CxTEASHAnEM9El0AHMxgQJsyGslUQ0qgAPTJA7INQdj6SOBiAJKeh8VuQ2HDACRUQRRL7CMQbgLgHiA2RxMHAE10ACDyAmANdcBTAAACQdCSKrBERiwAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,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>

[image8]: <data:image/png;base64,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>