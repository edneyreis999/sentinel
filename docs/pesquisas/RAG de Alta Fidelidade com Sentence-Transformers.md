# **Arquiteturas de Recuperação Narrativa de Alta Fidelidade: O Framework Técnico do Projeto Sentinel**

A implementação de sistemas de Geração Aumentada por Recuperação (RAG) em domínios criativos e complexos, como o desenvolvimento de jogos, exige uma transição de abordagens puramente estatísticas para fluxos de trabalho que priorizam a fidelidade semântica e a preservação da continuidade narrativa. No contexto do Projeto Sentinel, especificamente para o desenvolvimento do Produto Mínimo Viável (MVP) Daratrine, o desafio reside em processar Documentos de Design de Jogos (GDDs) que contêm intrincadas teias de personagens, eventos cronológicos e mecânicas interdependentes. Documentos desta natureza não são meros repositórios de texto; são ecossistemas de informações onde uma falha na recuperação de um detalhe sobre a motivação de um personagem ou um evento histórico pode levar a alucinações críticas no modelo de linguagem, comprometendo a integridade do design.1 Este relatório detalha a arquitetura técnica recomendada para o Sentinel, focando no equilíbrio entre baixo custo operacional e precisão semântica superior, utilizando uma combinação de modelos Sentence-Transformers, armazenamento vetorial otimizado com PostgreSQL e GraphRAG via Apache AGE.

## **Análise Comparativa de Modelos de Embedding para Contextos Narrativos**

A escolha do modelo de representação vetorial é a decisão fundacional de qualquer sistema RAG. Para o Projeto Sentinel, a necessidade de capturar nuances narrativas em um ambiente de baixo custo direciona a análise para a família de modelos Sentence-Transformers, especificamente o all-MiniLM-L6-v2 e o all-mpnet-base-v2, com o text-embedding-3-small da OpenAI atuando como uma camada de redundância de alta fidelidade.3

### **Sentence-Transformers: Eficiência vs. Profundidade Representacional**

O modelo all-MiniLM-L6-v2 é projetado para cenários onde a latência e o consumo de recursos são as principais restrições. Utilizando uma arquitetura destilada, ele opera com apenas 6 camadas de transformer e gera vetores de 384 dimensões.6 Em termos práticos, este modelo é capaz de processar aproximadamente 14.200 sentenças por segundo em uma CPU padrão, tornando-o ideal para o processamento em lote inicial de grandes volumes de lore e diálogos em GDDs.6 No entanto, a redução na dimensionalidade e na profundidade da rede impõe limites à sua capacidade de distinguir nuances semânticas sutis. Em narrativas complexas, onde personagens podem ter descrições sobrepostas ou motivações ambivalentes, o MiniLM pode apresentar uma taxa de recuperação ligeiramente inferior em comparação com modelos mais robustos.3

Por outro lado, o all-mpnet-base-v2 representa o padrão ouro dentro da biblioteca Sentence-Transformers para tarefas que exigem precisão. Baseado na arquitetura MPNet, que combina modelagem de linguagem mascarada (estilo BERT) com treinamento de sentenças permutadas (estilo XLNet), este modelo captura melhor a ordem das palavras e o contexto de longo alcance dentro de um parágrafo.6 Com 12 camadas e 768 dimensões, o MPNet demonstra uma superioridade clara em benchmarks de busca semântica, como o STS-B, onde atinge pontuações na faixa de 87-88%, superando os 84-85% do MiniLM.6 Para o Projeto Sentinel, o MPNet é o modelo recomendado para a recuperação final de elementos críticos como arcos de personagens e dependências de eventos, onde a precisão é mais valiosa do que a velocidade bruta de inferência.3

| Métrica de Desempenho | all-MiniLM-L6-v2 | all-mpnet-base-v2 | Implicação para GDDs |
| :---- | :---- | :---- | :---- |
| Dimensões do Vetor | 384 | 768 | MPNet captura mais granularidade em lore densa. |
| Camadas de Transformer | 6 | 12 | MPNet possui maior profundidade para relações complexas. |
| Velocidade (Sent./seg) | \~14.200 | \~2.800 | MiniLM é superior para indexação em massa. |
| Tamanho do Modelo | 80 MB | 420 MB | MiniLM exige menos RAM no backend NestJS. |
| Performance STS-B | 84.8% | 87.6% | MPNet é mais preciso em similaridade narrativa. |

A aplicação prática desses modelos no Sentinel sugere uma estratégia de duas camadas: utilizar o MiniLM para uma triagem inicial de candidatos em grandes volumes de documentos e, opcionalmente, o MPNet para o refinamento de consultas de alta prioridade.3

### **Fallback Estratégico: OpenAI text-embedding-3-small**

Embora o foco do Sentinel seja o baixo custo via HuggingFace Inference API, a resiliência do sistema exige um fallback para modelos comerciais. O modelo text-embedding-3-small da OpenAI é uma evolução significativa sobre o anterior ada-002, oferecendo maior eficiência e um recurso crítico: dimensões reduzíveis.9 Este modelo permite que o desenvolvedor especifique o tamanho do vetor de saída (por exemplo, reduzindo de 1536 para 512 ou 768 dimensões) sem uma perda catastrófica de compreensão conceitual, facilitando a compatibilidade com índices configurados para modelos locais.10 Em termos de custo, com um preço de aproximadamente $0.02 por milhão de tokens, ele serve como uma alternativa viável quando os limites de taxa da API da HuggingFace são atingidos ou quando a inferência local falha em fornecer uma similaridade mínima satisfatória.9

## **Estratégias de Fragmentação (Chunking) para Documentos de Design**

A eficácia de um sistema RAG não depende apenas do modelo de embedding, mas fundamentalmente da unidade de informação recuperada. GDDs são documentos estruturados que misturam prosa narrativa com tabelas de atributos e diagramas lógicos. A fragmentação ingênua, baseada apenas em contagem de caracteres, é uma das principais causas de "envenenamento de contexto", onde um fragmento recuperado perde a relação fundamental com a entidade que descreve.2

### **Fragmentação Caracter-Centrada e Recursiva**

Para manter a integridade narrativa, o Sentinel deve implementar o RecursiveCharacterTextSplitter. Esta técnica tenta dividir o texto utilizando uma hierarquia de separadores que respeita a estrutura do documento (parágrafos \\n\\n, linhas \\n, sentenças . e espaços ).15 Ao definir um tamanho de fragmento de aproximadamente 512 tokens para elementos factuais (como atributos de itens ou datas de eventos) e 1024 tokens para descrições de personagens e cenas, garantimos que o modelo de linguagem receba um contexto coerente.16

A introdução de uma sobreposição (overlap) de 10% a 20% entre os fragmentos é vital em GDDs para evitar que informações de fronteira sejam perdidas. Por exemplo, se a descrição de um evento de traição começar no final de um fragmento e terminar no início de outro, a sobreposição garante que ambos os vetores capturem a essência da ação, permitindo que a busca vetorial encontre o contexto correto independentemente de onde o corte ocorreu.16

### **Extração de Entidades e Eventos para GraphRAG**

A busca vetorial tradicional falha em consultas "multi-hop", como: "Quais personagens estavam presentes no evento que causou a queda do Reino de Daratrine?". Para resolver isso, o Sentinel utiliza o conceito de GraphRAG, onde entidades (Personagens, Locais) e Eventos são extraídos e conectados em um grafo de conhecimento.1

1. **Eventos como Unidades Atômicas:** Um evento é definido como uma construção textual contendo um ator, uma ação e, idealmente, um marcador temporal ou espacial.19  
2. **Mapeamento de Relacionamentos:** Através do processamento com o Claude 3.5 Sonnet, o Sentinel extrai triplas semânticas (Sujeito-Predicado-Objeto) para povoar o Apache AGE, permitindo consultas que atravessam as conexões narrativas.22

| Tipo de Conteúdo | Estratégia de Chunking | Tamanho Recomendado | Justificativa Narrativa |
| :---- | :---- | :---- | :---- |
| Biografias de Personagens | Recursiva por parágrafo | 1024 tokens | Preserva o arco e motivação completos. |
| Cronologia de Eventos | Baseada em Sentença | 512 tokens | Foca na atomicidade do evento e data. |
| Tabelas de Atributos | Baseada em Documento/Markdown | Unidade Completa | Evita a fragmentação de dados numéricos. |
| Diálogos e Scripts | Sliding Window com overlap | 768 tokens | Mantém o fluxo da conversação entre atores. |

## **Configuração de Storage e Indexação: PostgreSQL 16 com pgvector e HNSW**

O armazenamento vetorial no Sentinel é gerenciado pelo pgvector dentro do PostgreSQL 16\. Esta escolha estratégica elimina a necessidade de manter um banco de dados vetorial separado, aproveitando a conformidade ACID e as capacidades de junção SQL para integrar metadados relacionais com buscas semânticas.25

### **Otimização do Índice HNSW**

Para o volume de dados esperado no projeto Daratrine, o índice HNSW (Hierarchical Navigable Small Worlds) é superior ao IVFFlat, pois oferece uma busca de vizinho mais próximo aproximada (ANN) extremamente rápida e com alta taxa de revocação (recall), sem a necessidade de reconstrução frequente do índice após inserções de dados.26

Os parâmetros de criação do índice devem ser sintonizados para a dimensionalidade dos modelos Sentence-Transformers. Para o all-mpnet-base-v2 (768 dimensões), a seguinte configuração é recomendada:

SQL

\-- Habilitação da extensão  
CREATE EXTENSION IF NOT EXISTS vector;

\-- Criação da tabela de embeddings  
CREATE TABLE sentinel\_embeddings (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    chunk\_id TEXT UNIQUE,  
    content TEXT,  
    metadata JSONB,  
    embedding vector(768) \-- Ajustar para 384 se usar MiniLM  
);

\-- Criação do índice HNSW otimizado para busca narrativa  
\-- m: conexões por nó (16-32), ef\_construction: exploração durante a construção (64-256)  
CREATE INDEX ON sentinel\_embeddings   
USING hnsw (embedding vector\_cosine\_ops)   
WITH (m \= 24, ef\_construction \= 128);

O uso de vector\_cosine\_ops é fundamental, pois a similaridade de cosseno foca na orientação do vetor (o "significado" do texto) e não na sua magnitude (o "comprimento" do fragmento), o que é ideal para comparar fragmentos de GDD de tamanhos variados.27 Para aumentar a precisão em tempo de consulta, o parâmetro hnsw.ef\_search pode ser ajustado dinamicamente: um valor maior (ex: 100\) aumenta a chance de encontrar os resultados mais relevantes em troca de um pequeno aumento na latência.27

### **Integração com Apache AGE para GraphRAG**

O Apache AGE permite que o Sentinel gerencie relacionamentos complexos entre personagens através de grafos de propriedades diretamente no PostgreSQL. Isso possibilita consultas híbridas onde a busca vetorial identifica o ponto de entrada e o grafo fornece o contexto relacional profundo.31

SQL

\-- Instalação e configuração do AGE  
CREATE EXTENSION IF NOT EXISTS age CASCADE;  
SET search\_path \= ag\_catalog, "$user", public;

\-- Criação do grafo para o projeto Daratrine  
SELECT create\_graph('daratrine\_lore');

\-- Exemplo de inserção de relação personagem-evento  
SELECT \* FROM cypher('daratrine\_lore', $$  
    CREATE (p:Personagem {name: 'Eldrin', role: 'Protagonista'})  
    CREATE (e:Evento {name: 'Cerco de Valerius', data: 'Ano 452'})  
    CREATE (p)\--\>(e)  
$$) AS (n agtype);

Esta arquitetura permite que o backend NestJS execute consultas que combinam a similaridade semântica do pgvector com a travessia de grafos do AGE para responder perguntas sobre consequências de eventos ou relações familiares entre personagens que não estariam claras em uma busca puramente vetorial.1

## **Implementação de Resiliência e Processamento no NestJS**

A robustez do Sentinel depende da forma como o backend em TypeScript interage com as APIs externas da HuggingFace e OpenAI. Erros de limite de taxa (429) e falhas temporárias de serviço (503) são inevitáveis e devem ser tratados programaticamente através de padrões de resiliência.35

### **Lógica de Retry com Exponential Backoff e Jitter**

Ao utilizar a HuggingFace Inference API, o Sentinel implementa uma política de tentativas que respeita os limites do servidor. Em vez de tentativas imediatas, que poderiam agravar o bloqueio, utiliza-se o retrocesso exponencial (exponential backoff).37

1. **Backoff Exponencial:** O tempo de espera aumenta a cada falha (ex: 1s, 2s, 4s, 8s).  
2. **Jitter:** Adiciona-se uma variação aleatória ao tempo de espera para evitar que múltiplas instâncias do Sentinel tentem reconectar simultaneamente, criando um "thundering herd effect".37  
3. **Respeito ao cabeçalho Retry-After:** Se o servidor retornar o cabeçalho HTTP Retry-After, o sistema deve pausar exatamente pelo tempo solicitado antes da próxima tentativa.35

Abaixo, um exemplo conceitual de implementação do serviço de embedding no NestJS:

TypeScript

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';  
import { HttpService } from '@nestjs/axios';  
import { lastValueFrom } from 'rxjs';

@Injectable()  
export class EmbeddingResilienceService {  
  constructor(private readonly httpService: HttpService) {}

  private readonly MAX\_RETRIES \= 5;  
  private readonly BASE\_DELAY \= 1000;

  async getEmbedding(text: string, model: string, attempt \= 0): Promise\<number\> {  
    try {  
      const response \= await lastValueFrom(  
        this.httpService.post(  
          \`https://api-inference.huggingface.co/pipeline/feature-extraction/${model}\`,  
          { inputs: text },  
          { headers: { Authorization: \`Bearer ${process.env.HF\_TOKEN}\` } }  
        )  
      );  
      return response.data;  
    } catch (error) {  
      const status \= error.response?.status;  
        
      // Códigos de erro que justificam uma nova tentativa  
      if (.includes(status) && attempt \< this.MAX\_RETRIES) {  
        const delay \= this.calculateDelay(attempt, error.response?.headers);  
        await new Promise(resolve \=\> setTimeout(resolve, delay));  
        return this.getEmbedding(text, model, attempt \+ 1);  
      }

      // Se todas as tentativas falharem ou erro for fatal, aciona o fallback OpenAI  
      if (status \=== 401 |

| status \=== 403 |  
| attempt \>= this.MAX\_RETRIES) {  
        return this.getOpenAIFallback(text);  
      }

      throw new HttpException('Falha na geração de embeddings', HttpStatus.INTERNAL\_SERVER\_ERROR);  
    }  
  }

  private calculateDelay(attempt: number, headers: any): number {  
    // Prioriza o cabeçalho do servidor se disponível  
    if (headers && headers\['retry-after'\]) {  
      return parseInt(headers\['retry-after'\], 10) \* 1000;  
    }  
    // Exponential backoff \+ Jitter  
    const exponential \= Math.pow(2, attempt) \* this.BASE\_DELAY;  
    const jitter \= Math.random() \* 1000;  
    return Math.min(exponential \+ jitter, 30000); // Teto de 30s  
  }

  private async getOpenAIFallback(text: string): Promise\<number\> {  
    // Lógica para chamar text-embedding-3-small via OpenAI SDK  
    //...  
    return;   
  }  
}

### **Batching para Alta Performance**

Para otimizar a taxa de transferência durante a indexação inicial do GDD, o Sentinel deve utilizar o processamento por lotes (batching). O motor de inferência de embeddings da HuggingFace (TEI) é altamente eficiente quando recebe múltiplos textos em uma única requisição, pois pode paralelizar a computação dos tensores na GPU.39

Ao processar o GDD, os fragmentos de texto devem ser agrupados em lotes de 10 a 32 itens. Isso reduz drasticamente a sobrecarga de negociação HTTP e permite que o sistema Sentinel termine tarefas de indexação em frações do tempo necessário para requisições individuais.39

## **Casos Reais e Exemplos de Fluxo Narrativo**

A aplicação prática dessa arquitetura no projeto Daratrine revela como a combinação de vetores e grafos resolve problemas comuns de alucinação. Considere um cenário onde o GDD descreve que o personagem "Kaelen" foi banido por "Lord Valerius" após a "Batalha das Sombras".

### **Consulta semântica simples (Vetor)**

O usuário pergunta: "Quem baniu Kaelen?".

* **Busca Vetorial:** Encontra o fragmento: "Kaelen deixou o reino após o conflito com a nobreza".  
* **Risco:** O nome do autor do banimento pode não estar no fragmento recuperado.

### **Consulta com GraphRAG (Sentinel Flow)**

O Sentinel detecta a entidade "Kaelen" e o evento "Banimento".

1. **Vetorial:** Localiza fragmentos similares sobre Kaelen.  
2. **Grafo:** Executa MATCH (p:Personagem {name: 'Kaelen'})\<--(autor) RETURN autor.name.  
3. **Contexto Combinado:** O LLM recebe o fragmento textual e a confirmação estrutural de que Valerius foi o autor.  
4. **Resultado:** Resposta precisa, sem alucinações sobre outros nobres ou motivos vagos.1

## **Conclusões e Recomendações Técnicas**

A arquitetura estabelecida para o MVP do Projeto Sentinel demonstra que a alta fidelidade em sistemas RAG narrativos não requer orçamentos exorbitantes, mas sim uma engenharia cuidadosa dos fluxos de dados e armazenamento. A escolha do modelo all-mpnet-base-v2 como motor principal de precisão, aliada à infraestrutura resiliente em NestJS e ao poder relacional do Apache AGE, cria uma barreira contra alucinações que modelos puramente vetoriais não conseguem transpor.1

As diretrizes práticas para o início do desenvolvimento ("Get Started") focam em três pilares:

* **Indexação Inteligente:** Priorizar o HNSW com parâmetros m=24 e ef\_construction=128 para garantir que o conhecimento da lore seja densamente conectado no espaço vetorial.27  
* **Fragmentação Semântica:** Implementar a divisão recursiva de texto com sobreposição, tratando tabelas e biografias como unidades indivisíveis para evitar a perda de contexto crítico.16  
* **Resiliência de API:** Utilizar o padrão de backoff exponencial com jitter e fallback para OpenAI, garantindo que o sistema Sentinel permaneça operacional mesmo sob alta carga ou instabilidade de provedores externos.37

Ao seguir este framework, o projeto Daratrine estará equipado com uma ferramenta de análise de GDDs que não apenas recupera informações, mas compreende a estrutura e os relacionamentos que definem o mundo do jogo, proporcionando uma base sólida para a geração de conteúdo e suporte ao design de alta fidelidade.

#### **Referências citadas**

1. GraphRAG and Agentic Architecture: Practical Experimentation with Neo4j and NeoConverse \- Graph Database & Analytics, acessado em janeiro 30, 2026, [https://neo4j.com/blog/developer/graphrag-and-agentic-architecture-with-neoconverse/](https://neo4j.com/blog/developer/graphrag-and-agentic-architecture-with-neoconverse/)  
2. How to Implement Graph RAG Using Knowledge Graphs and Vector Databases \- Medium, acessado em janeiro 30, 2026, [https://medium.com/data-science/how-to-implement-graph-rag-using-knowledge-graphs-and-vector-databases-60bb69a22759](https://medium.com/data-science/how-to-implement-graph-rag-using-knowledge-graphs-and-vector-databases-60bb69a22759)  
3. Is all-mpnet-base-v2 better than MiniLM models? \- Zilliz Vector Database, acessado em janeiro 30, 2026, [https://zilliz.com/ai-faq/is-allmpnetbasev2-better-than-minilm-models](https://zilliz.com/ai-faq/is-allmpnetbasev2-better-than-minilm-models)  
4. Embedding Models Ranked: Small, Medium, and Large — When Each Wins | by varun rao, acessado em janeiro 30, 2026, [https://medium.com/@varunrao.aiml/embedding-models-ranked-small-medium-and-large-when-each-wins-c6e06dd04b17](https://medium.com/@varunrao.aiml/embedding-models-ranked-small-medium-and-large-when-each-wins-c6e06dd04b17)  
5. Understanding and Comparing Embedding Models for RAG and Vector Search \- Air, acessado em janeiro 30, 2026, [https://airsbigdata.tistory.com/m/231](https://airsbigdata.tistory.com/m/231)  
6. What are some popular pre-trained Sentence Transformer models and how do they differ (for example, all-MiniLM-L6-v2 vs all-mpnet-base-v2)? \- Milvus, acessado em janeiro 30, 2026, [https://milvus.io/ai-quick-reference/what-are-some-popular-pretrained-sentence-transformer-models-and-how-do-they-differ-for-example-allminilml6v2-vs-allmpnetbasev2](https://milvus.io/ai-quick-reference/what-are-some-popular-pretrained-sentence-transformer-models-and-how-do-they-differ-for-example-allminilml6v2-vs-allmpnetbasev2)  
7. Pretrained Models — Sentence Transformers documentation, acessado em janeiro 30, 2026, [https://www.sbert.net/docs/sentence\_transformer/pretrained\_models.html](https://www.sbert.net/docs/sentence_transformer/pretrained_models.html)  
8. A Comparative Analysis of Sentence Transformer Models for Automated Journal Recommendation Using PubMed Metadata \- MDPI, acessado em janeiro 30, 2026, [https://www.mdpi.com/2504-2289/9/3/67](https://www.mdpi.com/2504-2289/9/3/67)  
9. text-embedding-3-small Model | OpenAI API, acessado em janeiro 30, 2026, [https://platform.openai.com/docs/models/text-embedding-3-small](https://platform.openai.com/docs/models/text-embedding-3-small)  
10. Vector embeddings | OpenAI API, acessado em janeiro 30, 2026, [https://platform.openai.com/docs/guides/embeddings](https://platform.openai.com/docs/guides/embeddings)  
11. openai-embeddings \- HackMD, acessado em janeiro 30, 2026, [https://hackmd.io/@ll-24-25/r1RSCmxJxl/%2FcrOBwkQpSyqhAyj4LXLh0g](https://hackmd.io/@ll-24-25/r1RSCmxJxl/%2FcrOBwkQpSyqhAyj4LXLh0g)  
12. The guide to text-embedding-3-small | OpenAI \- Zilliz, acessado em janeiro 30, 2026, [https://zilliz.com/ai-models/text-embedding-3-small](https://zilliz.com/ai-models/text-embedding-3-small)  
13. RAG Chunking Strategies Deep Dive \- DEV Community, acessado em janeiro 30, 2026, [https://dev.to/vishalmysore/rag-chunking-strategies-deep-dive-2l72](https://dev.to/vishalmysore/rag-chunking-strategies-deep-dive-2l72)  
14. Mastering Document Chunking Strategies for Retrieval-Augmented Generation (RAG) | by Sahin Ahmed, Data Scientist | Medium, acessado em janeiro 30, 2026, [https://medium.com/@sahin.samia/mastering-document-chunking-strategies-for-retrieval-augmented-generation-rag-c9c16785efc7](https://medium.com/@sahin.samia/mastering-document-chunking-strategies-for-retrieval-augmented-generation-rag-c9c16785efc7)  
15. Implement RAG chunking strategies with LangChain and watsonx.ai \- IBM, acessado em janeiro 30, 2026, [https://www.ibm.com/think/tutorials/chunking-strategies-for-rag-with-langchain-watsonx-ai](https://www.ibm.com/think/tutorials/chunking-strategies-for-rag-with-langchain-watsonx-ai)  
16. Best Chunking Strategies for RAG in 2025 \- Firecrawl, acessado em janeiro 30, 2026, [https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025](https://www.firecrawl.dev/blog/best-chunking-strategies-rag-2025)  
17. Finding the Best Chunking Strategy for Accurate AI Responses | NVIDIA Technical Blog, acessado em janeiro 30, 2026, [https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/)  
18. The Best Way to Chunk Text Data for Generating Embeddings with OpenAI Models, acessado em janeiro 30, 2026, [https://dev.to/simplr\_sh/the-best-way-to-chunk-text-data-for-generating-embeddings-with-openai-models-56c9](https://dev.to/simplr_sh/the-best-way-to-chunk-text-data-for-generating-embeddings-with-openai-models-56c9)  
19. DyG-RAG: Dynamic Graph Retrieval-Augmented Generation with Event-Centric Reasoning, acessado em janeiro 30, 2026, [https://arxiv.org/html/2507.13396v1](https://arxiv.org/html/2507.13396v1)  
20. GraphRAG: Practical Guide to Supercharge RAG with Knowledge Graphs \- Learn OpenCV, acessado em janeiro 30, 2026, [https://learnopencv.com/graphrag-explained-knowledge-graphs-medical/](https://learnopencv.com/graphrag-explained-knowledge-graphs-medical/)  
21. (PDF) Extraction of characters and events from narratives \- ResearchGate, acessado em janeiro 30, 2026, [https://www.researchgate.net/publication/387459037\_Extraction\_of\_characters\_and\_events\_from\_narratives](https://www.researchgate.net/publication/387459037_Extraction_of_characters_and_events_from_narratives)  
22. Building Entity Graphs: From Unstructured Text to Graphs in Minutes \- Memgraph, acessado em janeiro 30, 2026, [https://memgraph.com/blog/unstructured-text-to-entity-graphs-rag-tool](https://memgraph.com/blog/unstructured-text-to-entity-graphs-rag-tool)  
23. Under the Covers With LightRAG: Extraction \- Graph Database & Analytics \- Neo4j, acessado em janeiro 30, 2026, [https://neo4j.com/blog/developer/under-the-covers-with-lightrag-extraction/](https://neo4j.com/blog/developer/under-the-covers-with-lightrag-extraction/)  
24. How Does an Entity Extractor Work? | Indexing in Graph RAG-3 \- Dataworkz, acessado em janeiro 30, 2026, [https://www.dataworkz.com/blog/how-does-an-entity-extractor-work-indexing-graph-rag-3/](https://www.dataworkz.com/blog/how-does-an-entity-extractor-work-indexing-graph-rag-3/)  
25. Vector Similarity Search with PostgreSQL's pgvector \- A Deep Dive | Severalnines, acessado em janeiro 30, 2026, [https://severalnines.com/blog/vector-similarity-search-with-postgresqls-pgvector-a-deep-dive/](https://severalnines.com/blog/vector-similarity-search-with-postgresqls-pgvector-a-deep-dive/)  
26. Optimize generative AI applications with pgvector indexing: A deep dive into IVFFlat and HNSW techniques | AWS Database Blog, acessado em janeiro 30, 2026, [https://aws.amazon.com/blogs/database/optimize-generative-ai-applications-with-pgvector-indexing-a-deep-dive-into-ivfflat-and-hnsw-techniques/](https://aws.amazon.com/blogs/database/optimize-generative-ai-applications-with-pgvector-indexing-a-deep-dive-into-ivfflat-and-hnsw-techniques/)  
27. Understanding vector search and HNSW index with pgvector \- Neon, acessado em janeiro 30, 2026, [https://neon.com/blog/understanding-vector-search-and-hnsw-index-with-pgvector](https://neon.com/blog/understanding-vector-search-and-hnsw-index-with-pgvector)  
28. Use pgvector for Vector Similarity Search | Apache Cloudberry (Incubating), acessado em janeiro 30, 2026, [https://cloudberry.apache.org/docs/advanced-analytics/pgvector-search/](https://cloudberry.apache.org/docs/advanced-analytics/pgvector-search/)  
29. Speed up PostgreSQL® pgvector queries with indexes, acessado em janeiro 30, 2026, [https://aiven.io/developer/postgresql-pgvector-indexes](https://aiven.io/developer/postgresql-pgvector-indexes)  
30. How to Use Cosine Similarity for Vector Search in pgvector \- Sarah Glasmacher, acessado em janeiro 30, 2026, [https://www.sarahglasmacher.com/how-to-use-cosine-similarity-in-pgvector/](https://www.sarahglasmacher.com/how-to-use-cosine-similarity-in-pgvector/)  
31. Apache AGE Extension \- Azure \- Microsoft Learn, acessado em janeiro 30, 2026, [https://learn.microsoft.com/en-us/azure/postgresql/azure-ai/generative-ai-age-overview](https://learn.microsoft.com/en-us/azure/postgresql/azure-ai/generative-ai-age-overview)  
32. Apache AGE, acessado em janeiro 30, 2026, [https://age.apache.org/](https://age.apache.org/)  
33. PostgreSQL Graph Database: Everything You Need To Know \- PuppyGraph, acessado em janeiro 30, 2026, [https://www.puppygraph.com/blog/postgresql-graph-database](https://www.puppygraph.com/blog/postgresql-graph-database)  
34. Exploring Apache-AGE Hybrid Queries \- DEV Community, acessado em janeiro 30, 2026, [https://dev.to/dukeofhazardz/exploring-apache-age-hybrid-queries-49p8](https://dev.to/dukeofhazardz/exploring-apache-age-hybrid-queries-49p8)  
35. Hub Rate limits \- Hugging Face, acessado em janeiro 30, 2026, [https://huggingface.co/docs/hub/rate-limits](https://huggingface.co/docs/hub/rate-limits)  
36. | Hugging Face Inference Endpoints RateLimitExceeded error encountered during API requests. \- Doctor Droid, acessado em janeiro 30, 2026, [https://drdroid.io/integration-diagnosis-knowledge/hugging-face-inference-endpoints-ratelimitexceeded-error-encountered-during-api-requests](https://drdroid.io/integration-diagnosis-knowledge/hugging-face-inference-endpoints-ratelimitexceeded-error-encountered-during-api-requests)  
37. Stop Breaking Your APIs \- How to Implement Proper Retry and Exponential Backoff in NestJS | Jean-Marc Möckel, acessado em janeiro 30, 2026, [https://jean-marc.io/blog/stop-breaking-your-apis-how-to-implement-proper-retry-and-exponential-backoff-in-nestjs](https://jean-marc.io/blog/stop-breaking-your-apis-how-to-implement-proper-retry-and-exponential-backoff-in-nestjs)  
38. How does the hub handles http error 429? \- Hugging Face Forums, acessado em janeiro 30, 2026, [https://discuss.huggingface.co/t/how-does-the-hub-handles-http-error-429/147346](https://discuss.huggingface.co/t/how-does-the-hub-handles-http-error-429/147346)  
39. Build an embedding pipeline with datasets \- Hugging Face, acessado em janeiro 30, 2026, [https://huggingface.co/docs/inference-endpoints/tutorials/embedding](https://huggingface.co/docs/inference-endpoints/tutorials/embedding)  
40. huggingface/text-embeddings-inference \- GitHub, acessado em janeiro 30, 2026, [https://github.com/huggingface/text-embeddings-inference](https://github.com/huggingface/text-embeddings-inference)  
41. How to obtain faster Inference Endpoint \- Hugging Face Forums, acessado em janeiro 30, 2026, [https://discuss.huggingface.co/t/how-to-obtain-faster-inference-endpoint/137032](https://discuss.huggingface.co/t/how-to-obtain-faster-inference-endpoint/137032)  
42. Batch inference \- Diffusers \- Hugging Face, acessado em janeiro 30, 2026, [https://huggingface.co/docs/diffusers/using-diffusers/batched\_inference](https://huggingface.co/docs/diffusers/using-diffusers/batched_inference)