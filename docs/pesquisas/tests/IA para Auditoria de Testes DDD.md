# **Governança Técnica e Métricas de Qualidade para Auditoria de Testes na Camada Core via Inteligência Artificial**

A evolução da engenharia de software contemporânea, especialmente em ecossistemas que exigem alta manutenibilidade e escalabilidade, consolidou o Domain-Driven Design (DDD) e a Clean Architecture como pilares fundamentais para a construção de sistemas robustos. No entanto, a complexidade inerente a essas abordagens introduz desafios significativos na manutenção da integridade arquitetural ao longo do tempo. A emergência de agentes de inteligência artificial capazes de atuar não apenas como copilotos de codificação, mas como auditores de governança técnica, oferece uma oportunidade sem precedentes para automatizar a avaliação da qualidade do código de teste. Este relatório detalha as heurísticas, métricas e pesos necessários para a criação de um sistema de pontuação de 0 a 10, focado na saúde arquitetural e na eficiência de escrita de testes unitários e de integração na camada Core (Domain e Application) de sistemas desenvolvidos em TypeScript.

## **Fundamentos da Camada Core e a Necessidade de Isolamento**

A camada Core, em uma arquitetura limpa, é composta pelo Domínio e pela Aplicação. Esta zona representa o repositório de toda a lógica de negócio e regras de orquestração que definem a identidade do sistema.1 A pureza arquitetural nesta camada é ditada pela Regra de Dependência, que estabelece que as dependências de código-fonte devem apontar apenas para dentro, em direção aos círculos concêntricos de maior abstração.3 O domínio, portanto, não deve possuir conhecimento algum sobre bancos de dados, frameworks, ou protocolos de comunicação externa.1

A auditoria automatizada por IA deve priorizar a verificação deste isolamento. Quando testes de domínio importam diretamente bibliotecas de infraestrutura ou drivers de banco de dados, ocorre o fenômeno do acoplamento alucinado, onde o código parece funcional mas viola o princípio da inversão de controle.3 Esta violação aumenta o débito técnico estrutural, tornando o sistema rígido e difícil de evoluir sem causar efeitos colaterais em cascata.4

### **A Anatomia da Camada de Domínio em TypeScript**

No contexto do TypeScript puro, a modelagem do domínio utiliza classes e interfaces para expressar a Linguagem Ubíqua.1 O sistema de tipos do TypeScript é uma ferramenta poderosa para impor invariantes em tempo de compilação, mas a validação de regras de negócio complexas exige testes unitários rigorosos.6 Os principais blocos de construção táticos do DDD — Entidades, Objetos de Valor e Agregados — exigem estratégias de teste distintas que um agente de IA deve ser capaz de identificar e avaliar.1

| Elemento de Domínio      | Características Técnicas                                     | Foco da Auditoria de Teste                                                    |
| :----------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Entidade (Entity)**    | Identidade única (ID), estado mutável, ciclo de vida.        | Validação de transições de estado e persistência da identidade.               |
| **Objeto de Valor (VO)** | Imutabilidade, igualdade por atributos, auto-validação.      | Testes de igualdade estrutural e rejeição de estados inválidos no construtor. |
| **Agregado (Aggregate)** | Raiz de agregado, limite de consistência, invariantes.       | Testes de integridade de grupo e execução de comandos via raiz.               |
| **Serviço de Domínio**   | Sem estado, lógica multi-agregados, orquestração de negócio. | Validação de fluxos complexos que não cabem em uma única entidade.            |

1

A eficiência da escrita nestes testes é medida pela densidade de lógica de negócio versus a verbosidade do código. Em sistemas auditados por IA, a economia de tokens torna-se uma métrica de manutenibilidade; código excessivamente prolixo ou com boilerplate desnecessário consome a janela de contexto de modelos de linguagem e aumenta o custo cognitivo para revisores humanos e artificiais.12

## **Heurísticas de Saúde Arquitetural para Auditoria Automatizada**

Para que um agente de IA atribua uma nota de saúde arquitetural, ele deve aplicar heurísticas que transcendem a simples cobertura de código. A cobertura de código é um ponto de partida necessário, mas não é um indicador direto de qualidade.14 A auditoria deve focar na "forma" do teste e em como ele interage com as fronteiras do sistema.

### **O Uso de Repositórios Fake e In-Memory**

Um dos critérios mais críticos para a nota de 0 a 10 é a forma como as dependências de infraestrutura são tratadas. No contexto da camada Core, o uso de repositórios reais ou mocks frágeis é desencorajado em favor de fakes in-memory.15 Os fakes são implementações simplificadas, mas funcionais, de interfaces de repositório, permitindo que os testes validem o comportamento do estado sem incorrer na latência ou complexidade de um banco de dados real.16

O agente de IA deve avaliar se os fakes estão sendo utilizados para manter o isolamento. O uso de mocks de comportamento (como jest.fn().mockReturnValue()) muitas vezes leva a testes que conhecem demais a implementação interna da unidade sob teste, resultando em fragilidade.18 Fakes, por outro lado, promovem testes baseados em resultados, onde o estado final do sistema é validado após uma operação de negócio, o que é muito mais valioso para a governança técnica de longo prazo.15

### **Detecção de Vazamento de Abstração**

A IA deve ser programada para identificar quando tipos de infraestrutura "vazam" para os testes de domínio. Por exemplo, a presença de decoradores de ORM (como TypeORM ou Prisma) ou anotações de serialização JSON dentro de entidades de domínio é um sinal de alerta.3 Em testes, isso se manifesta quando o setup do teste exige a configuração de um contexto de banco de dados para testar uma simples regra de cálculo de desconto. Um escore alto exige que o domínio seja "POJO" (Plain Old JavaScript Objects) ou "POTO" (Plain Old TypeScript Objects), garantindo que a lógica possa ser executada em qualquer ambiente sem fricção tecnológica.2

## **Eficiência de Escrita e Economia de Tokens no Código de Teste**

Com o avanço da automação via IA, a forma como o código é estruturado impacta diretamente a capacidade das LLMs de processar, entender e manter o sistema. A eficiência de escrita não é apenas uma questão de brevidade, mas de clareza semântica e densidade de informação.12

### **Otimização para Modelos de Linguagem**

A pesquisa indica que modelos de linguagem mantêm o desempenho mesmo com a remoção de elementos de formatação não essenciais, mas a estruturação lógica clara é vital para a precisão.12 Para um agente de auditoria, testes que utilizam padrões de criação densos, como o Object Mother ou Test Data Builders, são preferíveis a setups manuais extensos.2

A economia de tokens é obtida através da redução de boilerplate. Quando um teste de caso de uso requer a criação de um usuário, um pedido e dez produtos, a instanciação manual desses objetos em cada teste consome tokens desnecessários e obscurece a intenção do teste.12 A IA deve pontuar positivamente o uso de fábricas que permitem a criação de estados complexos com comandos mínimos, mantendo o foco na regra de negócio que está sendo validada.1

### **Linguagem Ubíqua e Grounding Semântico**

A nomenclatura dos testes deve refletir a Linguagem Ubíqua do domínio.1 Nomes de testes como deve_adicionar_item_corretamente são genéricos e fornecem pouco contexto para um auditor de IA. Em contraste, deve_impedir_adicao_de_item_quando_estoque_for_insuficiente estabelece um limite claro e uma regra de negócio explícita.7 Este nível de detalhe melhora o "grounding" semântico da IA, permitindo que ela identifique se o teste está realmente cobrindo a regra que se propõe a validar.23

## **Critérios de Avaliação e Pesos para a Nota de 0 a 10**

A atribuição da nota final deve ser baseada em um algoritmo ponderado que equilibra a pureza arquitetural, a qualidade tática do teste e a manutenibilidade do código. Abaixo, detalha-se a matriz de avaliação normativa que o agente de IA deve seguir.

### **Matriz de Pontuação de Governança Técnica**

| Categoria                 | Critério Específico           | Peso | Heurística de Avaliação                                                                                       |
| :------------------------ | :---------------------------- | :--- | :------------------------------------------------------------------------------------------------------------ |
| **Saúde Arquitetural**    | Isolamento de Infraestrutura  | 40%  | Penalizar o uso de bibliotecas externas, acesso direto a IO ou imports de camadas externas dentro do domínio. |
| **Qualidade Tática**      | Integridade de Invariantes    | 30%  | Verificar se o teste valida caminhos de erro e regras de negócio, não apenas o fluxo feliz ("happy path").    |
| **Eficiência de Escrita** | Token Economy e Boilerplate   | 20%  | Avaliar a densidade de código. Uso de builders/factories e clareza na estrutura Arrange-Act-Assert.           |
| **Design de Teste**       | Estabilidade e Desacoplamento | 10%  | Preferência por Fakes sobre Mocks. Independência total entre testes (ausência de estado compartilhado).       |

3

Para o cálculo da nota final ![][image1], utiliza-se a seguinte fórmula:

![][image2]  
Onde cada escore de categoria é avaliado em uma escala de 0 a 10 com base nos sub-critérios definidos a seguir.

## **Detalhamento das Categorias de Auditoria**

### **1\. Saúde Arquitetural (Peso: 4.0)**

Esta categoria é a espinha dorsal da Clean Architecture. O isolamento do domínio é o que permite a agilidade de negócio e a facilidade de testes.1 O auditor de IA deve analisar a árvore de dependências do arquivo de teste.

- **Regra de Ouro (Isolamento):** O domínio deve ser agnóstico a drivers. Se houver imports de pacotes como mysql, axios, ou aws-sdk nos arquivos da camada Core, a nota desta seção deve ser reduzida drasticamente.3
- **Tratamento de Dependências:** O uso de Injeção de Dependência (DI) é obrigatório. Testes que instanciam dependências concretas dentro do caso de uso, impedindo a substituição por fakes, são considerados de baixa qualidade.1
- **Pureza das Entidades:** Entidades que contêm lógica de persistência (Active Record) são desencorajadas em prol de entidades puras gerenciadas por repositórios independentes.1

### **2\. Qualidade Tática do Teste (Peso: 3.0)**

A qualidade tática refere-se à eficácia do teste em proteger o sistema contra regressões e garantir que as regras de negócio sejam respeitadas.27

- **Teste de Invariantes:** Agregados existem para proteger invariants.1 O auditor deve procurar por casos de teste que tentam forçar o sistema a estados inválidos. Se apenas o fluxo de sucesso for testado, a nota deve ser limitada a 5.0 nesta categoria.8
- **Objetos de Valor:** Devem ser testados quanto à sua imutabilidade e capacidade de auto-validação.8 A IA deve verificar se os testes de VO garantem que nenhuma propriedade pode ser alterada após a criação.
- **Encapsulamento:** Testes que dependem da inspeção de atributos privados (quebrando o encapsulamento) para verificar o sucesso de uma operação são penalizados. O teste deve validar o comportamento observável através da interface pública.20

### **3\. Eficiência de Escrita e Token Economy (Peso: 2.0)**

Esta categoria avalia o custo de manutenção do código para sistemas automatizados e humanos. Um código eficiente consome menos memória de trabalho (e tokens de LLM).12

- **Densidade Semântica:** A IA avalia a relação entre linhas de código e complexidade de negócio coberta. O uso de padrões como o TOON (Token-Oriented Object Notation) para representar dados de entrada em prompts de IA é um diferencial positivo.13
- **Boilerplate Reduction:** Testes que repetem dez linhas de setup para cada duas linhas de execução são ineficientes. O uso de funções auxiliares de setup ou fábricas de dados centralizadas é mandatório para notas acima de 8.0.16
- **Nomenclatura Contextual:** A IA deve analisar se o nome do teste e das variáveis auxiliares permite entender o cenário sem ler a implementação. Nomes crípticos ou excessivamente longos e redundantes prejudicam a pontuação.7

### **4\. Design de Teste e Dublês (Peso: 1.0)**

O foco aqui é a robustez do teste contra mudanças estruturais que não alteram o comportamento.15

- **Fakes vs. Mocks:** A preferência por fakes (implementações reais simplificadas) em vez de mocks (espionagem de comportamento) é valorizada. Fakes permitem refatorar a lógica interna do domínio sem quebrar o teste, desde que o contrato do repositório seja mantido.18
- **Independência e Determinismo:** Testes que dependem de variáveis globais mutáveis ou que produzem resultados diferentes dependendo da ordem de execução recebem nota zero nesta categoria.2

## **Heurísticas Normativas e Regras de Ouro (Checklist)**

Para facilitar a implementação do agente de auditoria, define-se um checklist normativo. Cada item deve ser verificado binariamente (Passa/Não Passa) e influenciar o escore da categoria correspondente.

### **Checklist de Auditoria para o Agente de IA**

#### **Camada de Domínio (Entidades e Agregados)**

- \*\*\*\* O agregado é acessado apenas pela sua raiz (Aggregate Root)? 1
- \*\*\*\* Existem testes para violação de invariantes (ex: valores negativos, limites excedidos)? 8
- \*\*\*\* As entidades de domínio estão livres de anotações de infraestrutura (decoradores de DB)? 1
- \*\*\*\* A lógica de igualdade de Entidades é baseada em ID e não em atributos? 1

#### **Objetos de Valor (Value Objects)**

- **\[V1\]** O teste garante que o objeto é imutável (uso de readonly)? 1
- **\[V2\]** O construtor lança erro ou retorna um falha para dados inválidos? 8
- **\[V3\]** Há testes de igualdade por valor entre duas instâncias diferentes? 9

#### **Camada de Aplicação (Casos de Uso)**

- **\[A1\]** O repositório utilizado no teste é uma implementação in-memory (Fake)? 15
- **\[A2\]** O teste utiliza DTOs para entrada e saída, isolando o domínio do mundo externo? 8
- **\[A3\]** O tratamento de erros de negócio utiliza o padrão Result em vez de exceções genéricas? 9
- **\[A4\]** O teste foca na orquestração e não contém lógica de cálculo de negócio (que deve estar no domínio)? 2

#### **Eficiência e Token Economy**

- **\[E1\]** O setup do teste (Arrange) utiliza factories para reduzir verbosidade? 12
- **\[E2\]** O nome do teste segue a linguagem ubíqua e descreve o comportamento esperado? 1
- **\[E3\]** A complexidade ciclomática do arquivo de teste é baixa (ausência de lógica condicional)? 25

## **O Fenômeno do Débito Técnico Silencioso**

A auditoria via IA é particularmente eficaz na detecção de problemas que humanos costumam ignorar sob pressão de prazos. O débito técnico arquitetural difere do débito de código local por ser sistêmico e invisível em pequenas mudanças de código (Pull Requests).5

### **Débito Arquitetural vs. Débito de Código**

| Tipo de Débito   | Manifestação                                   | Impacto Detectado pela IA                                        |
| :--------------- | :--------------------------------------------- | :--------------------------------------------------------------- |
| **Código Local** | Funções complexas, nomes ruins.                | Localizado, fácil de refatorar por um engenheiro.                |
| **Arquitetural** | Vazamento de camadas, dependências circulares. | Sistêmico, exige re-arquitetura e afeta todo o Core.             |
| **AI-Specific**  | Hallucinated complexity, excesso de tokens.    | Aumenta o custo de API e reduz a precisão da geração automática. |

3

O agente de IA deve ser capaz de correlacionar a pontuação de saúde arquitetural com a viabilidade de manutenção a longo prazo. Um escore consistentemente abaixo de 6.0 na categoria de Saúde Arquitetural indica que o sistema está em um caminho de "rigidez", onde cada nova funcionalidade exige mudanças desproporcionais nos testes existentes devido ao alto acoplamento.5

## **Implementação Prática: O Algoritmo de Auditoria**

O fluxo de trabalho para o agente de IA deve seguir uma sequência de análise estática e semântica. Primeiramente, utiliza-se a análise de Árvore de Sintaxe Abstrata (AST) para verificar as regras estruturais (imports, chamadas de métodos, injeção de dependência).3 Em seguida, aplica-se a análise semântica via LLM para avaliar a qualidade dos nomes e a adequação das invariantes testadas à lógica de negócio.24

### **Auditoria de Invariantes via Agentic AI**

Uma abordagem inovadora é o uso de "Agentes de Penetração de Domínio". Estes agentes tentam, de forma autônoma, modificar a implementação do domínio para inserir bugs sutis (ex: remover uma validação de limite). Se o conjunto de testes continuar passando, o agente de auditoria penaliza severamente a nota de Qualidade Tática, pois os testes falharam em sua missão de documentar e proteger as regras de negócio.7

Esta técnica garante que a nota 10.0 não seja apenas estética, mas represente um sistema onde os testes são "vivos" e realmente exercem pressão sobre a implementação correta do Core.7

## **Conclusões e Recomendações Normativas**

A criação de um agente de IA para auditoria técnica na camada Core exige um equilíbrio entre o rigor arquitetural e a pragmática do desenvolvimento moderno. A métrica de 0 a 10 proposta fornece uma visão clara da saúde do sistema, permitindo que as equipes identifiquem onde o isolamento do domínio está falhando ou onde a manutenção está se tornando proibitivamente cara devido ao excesso de tokens e verbosidade.

As principais diretrizes para maximizar a nota de auditoria são:

1. **Priorizar o Isolamento:** Manter a camada Core completamente livre de infraestrutura. O uso de in-memory fakes é a pedra angular para atingir a nota máxima em Saúde Arquitetural.1
2. **Focar em Invariantes:** Testar o comportamento do agregado em face de entradas inválidas, garantindo que o domínio seja a "fonte única da verdade" para as regras de negócio.8
3. **Adotar a Token Economy:** Estruturar os testes de forma densa e semântica, utilizando fábricas de dados e nomes que reflitam o negócio, o que facilita a manutenção humana e por IA.12
4. **Desacoplar do Test Runner:** Embora utilize-se Jest ou Vitest, o código de teste de domínio deve depender o mínimo possível de APIs específicas do framework de teste, facilitando futuras migrações e auditorias externas.

Ao adotar estas heurísticas, as organizações transformam o código de teste de um fardo de manutenção em um ativo de governança técnica, garantindo que a arquitetura evolua de forma controlada, previsível e otimizada para a era da inteligência artificial.

#### **Referências citadas**

1. Domain-Driven Design in TypeScript \- Spaceout, acessado em fevereiro 3, 2026, [https://www.spaceout.pl/domain-driven-design-in-typescript/](https://www.spaceout.pl/domain-driven-design-in-typescript/)
2. Unit Testing in Clean Architecture with .NET | by Anish Bilas Panta | Level Up Coding, acessado em fevereiro 3, 2026, [https://levelup.gitconnected.com/unit-testing-in-clean-architecture-with-net-ae503cad045d](https://levelup.gitconnected.com/unit-testing-in-clean-architecture-with-net-ae503cad045d)
3. Quantitative Analysis of Technical Debt and Pattern Violation in Large Language Model Architectures \- arXiv, acessado em fevereiro 3, 2026, [https://arxiv.org/html/2512.04273v1](https://arxiv.org/html/2512.04273v1)
4. Understanding architectural technical debt \- Multiplayer, acessado em fevereiro 3, 2026, [https://www.multiplayer.app/blog/understanding-architectural-technical-debt/](https://www.multiplayer.app/blog/understanding-architectural-technical-debt/)
5. Technical Debt vs. Architecture Debt: Don't Confuse Them \- The New Stack, acessado em fevereiro 3, 2026, [https://thenewstack.io/technical-debt-vs-architecture-debt-dont-confuse-them/](https://thenewstack.io/technical-debt-vs-architecture-debt-dont-confuse-them/)
6. Building Scalable Apps with DDD, TDD, DI, Nx, and TypeScript — Part 1 \- Medium, acessado em fevereiro 3, 2026, [https://medium.com/@nima.shokofar/part-1-building-scalable-applications-a-deep-dive-into-ddd-tdd-and-di-using-nx-and-typescript-18ae09a33577](https://medium.com/@nima.shokofar/part-1-building-scalable-applications-a-deep-dive-into-ddd-tdd-and-di-using-nx-and-typescript-18ae09a33577)
7. 10 Tips for Success with Typescript Unit Testing | early Blog, acessado em fevereiro 3, 2026, [https://www.startearly.ai/post/typescript-unit-testing-tips](https://www.startearly.ai/post/typescript-unit-testing-tips)
8. How to Design & Persist Aggregates \- Domain-Driven Design w ..., acessado em fevereiro 3, 2026, [https://khalilstemmler.com/articles/typescript-domain-driven-design/aggregate-design-persistence/](https://khalilstemmler.com/articles/typescript-domain-driven-design/aggregate-design-persistence/)
9. \[DDD\] Tactical Design Patterns Part 1: Domain Layer \- DEV Community, acessado em fevereiro 3, 2026, [https://dev.to/minericefield/ddd-tactical-design-patterns-part-1-domain-layer-j38](https://dev.to/minericefield/ddd-tactical-design-patterns-part-1-domain-layer-j38)
10. Unit Tests \- Should I have unit tests for the Entity/Value Object level or just at the Aggregate Root level? \- Stack Overflow, acessado em fevereiro 3, 2026, [https://stackoverflow.com/questions/60749027/unit-tests-should-i-have-unit-tests-for-the-entity-value-object-level-or-just](https://stackoverflow.com/questions/60749027/unit-tests-should-i-have-unit-tests-for-the-entity-value-object-level-or-just)
11. Implementing Domain Driven Design (DDD) in Clean Architecture \- Part 1 \- Wafi Solutions, acessado em fevereiro 3, 2026, [https://www.wafisolutions.com/implementing-domain-driven-design-ddd-in-clean-architecture-part-1/](https://www.wafisolutions.com/implementing-domain-driven-design-ddd-in-clean-architecture-part-1/)
12. The Hidden Cost of Readability: How Code Formatting Silently Consumes Your LLM Budget, acessado em fevereiro 3, 2026, [https://arxiv.org/html/2508.13666v1](https://arxiv.org/html/2508.13666v1)
13. TOON (Token-Oriented Object Notation): The Guide to Maximizing LLM Efficiency and Accuracy \- Vatsal Shah, acessado em fevereiro 3, 2026, [https://vatsalshah.in/blog/toon-token-oriented-object-notation-guide](https://vatsalshah.in/blog/toon-token-oriented-object-notation-guide)
14. Unit Testing Clean Architecture Use Cases \- Milan Jovanović, acessado em fevereiro 3, 2026, [https://www.milanjovanovic.tech/blog/unit-testing-clean-architecture-use-cases](https://www.milanjovanovic.tech/blog/unit-testing-clean-architecture-use-cases)
15. Mock vs Stub vs Fake: Key Differences and When to Use Each | BrowserStack, acessado em fevereiro 3, 2026, [https://www.browserstack.com/guide/mock-vs-stub-vs-fake](https://www.browserstack.com/guide/mock-vs-stub-vs-fake)
16. Boost Your TypeScript Testing Skills \- Master Mocks and Stubs for Effective Unit Testing, acessado em fevereiro 3, 2026, [https://moldstud.com/articles/p-boost-your-typescript-testing-skills-master-mocks-and-stubs-for-effective-unit-testing](https://moldstud.com/articles/p-boost-your-typescript-testing-skills-master-mocks-and-stubs-for-effective-unit-testing)
17. What's the point of testing fake repositories? \- Stack Overflow, acessado em fevereiro 3, 2026, [https://stackoverflow.com/questions/406731/whats-the-point-of-testing-fake-repositories](https://stackoverflow.com/questions/406731/whats-the-point-of-testing-fake-repositories)
18. When to use Fakes instead of Mocks | by Christian Dehning \- Medium, acessado em fevereiro 3, 2026, [https://medium.com/@CDehning/when-to-use-fakes-instead-of-mocks-c80188b9a3f1](https://medium.com/@CDehning/when-to-use-fakes-instead-of-mocks-c80188b9a3f1)
19. Mocks or fakes? : r/androiddev \- Reddit, acessado em fevereiro 3, 2026, [https://www.reddit.com/r/androiddev/comments/cfbszb/mocks_or_fakes/](https://www.reddit.com/r/androiddev/comments/cfbszb/mocks_or_fakes/)
20. Testing actual behavior | Matthias Noback, acessado em fevereiro 3, 2026, [https://matthiasnoback.nl/2018/06/testing-actual-behavior/](https://matthiasnoback.nl/2018/06/testing-actual-behavior/)
21. How to manage entity dependencies when testing a use case in Clean Architecture ( or DDD ) \- Stack Overflow, acessado em fevereiro 3, 2026, [https://stackoverflow.com/questions/69622394/how-to-manage-entity-dependencies-when-testing-a-use-case-in-clean-architecture](https://stackoverflow.com/questions/69622394/how-to-manage-entity-dependencies-when-testing-a-use-case-in-clean-architecture)
22. TOON (Token-Oriented Object Notation) — The Smarter, Lighter JSON for LLMs \- DEV Community, acessado em fevereiro 3, 2026, [https://dev.to/abhilaksharora/toon-token-oriented-object-notation-the-smarter-lighter-json-for-llms-2f05](https://dev.to/abhilaksharora/toon-token-oriented-object-notation-the-smarter-lighter-json-for-llms-2f05)
23. GEO guide: How to optimize your docs for AI search and LLM ingestion \- GitBook, acessado em fevereiro 3, 2026, [https://gitbook.com/docs/guides/seo-and-llm-optimization/geo-guide](https://gitbook.com/docs/guides/seo-and-llm-optimization/geo-guide)
24. How to Prompt LLMs for Better, Faster Security Reviews \- Crash Override, acessado em fevereiro 3, 2026, [https://crashoverride.com/blog/prompting-llm-security-reviews](https://crashoverride.com/blog/prompting-llm-security-reviews)
25. Test Metrics: The 4 That Are Critical to Your QA Health \- Testim, acessado em fevereiro 3, 2026, [https://www.testim.io/blog/test-metrics-critical-to-your-qa-health/](https://www.testim.io/blog/test-metrics-critical-to-your-qa-health/)
26. Difference between Domain Driven Design and Clean Architecture, acessado em fevereiro 3, 2026, [https://softwareengineering.stackexchange.com/questions/405973/difference-between-domain-driven-design-and-clean-architecture](https://softwareengineering.stackexchange.com/questions/405973/difference-between-domain-driven-design-and-clean-architecture)
27. Pragmatic way to unit test your DDD tactical patterns using both the unit testing school of thought and the famous test pyramid \- Normand Bédard, acessado em fevereiro 3, 2026, [https://normand-bedard.medium.com/pragmatic-way-to-unit-test-your-ddd-tactical-patterns-using-both-the-unit-testing-school-of-thought-6958034b78ad](https://normand-bedard.medium.com/pragmatic-way-to-unit-test-your-ddd-tactical-patterns-using-both-the-unit-testing-school-of-thought-6958034b78ad)
28. Detection of LLM-Paraphrased Code and Identification of the Responsible LLM Using Coding Style Features \- arXiv, acessado em fevereiro 3, 2026, [https://arxiv.org/html/2502.17749v1](https://arxiv.org/html/2502.17749v1)
29. Is a mocking framework useful if I'm unit testing a repository/database? \[duplicate\], acessado em fevereiro 3, 2026, [https://softwareengineering.stackexchange.com/questions/256499/is-a-mocking-framework-useful-if-im-unit-testing-a-repository-database](https://softwareengineering.stackexchange.com/questions/256499/is-a-mocking-framework-useful-if-im-unit-testing-a-repository-database)
30. Designing the Domain Layer in Clean Architecture for Hospital Systems \- Medium, acessado em fevereiro 3, 2026, [https://medium.com/@mdasraful.islam/designing-the-domain-layer-in-clean-architecture-for-hospital-systems-9e73b79b35d0](https://medium.com/@mdasraful.islam/designing-the-domain-layer-in-clean-architecture-for-hospital-systems-9e73b79b35d0)
31. ‍ Testing the modules of your MVVM \+ Clean Architecture Android project Part 2: Testing the Use Cases\[Beginner\] | by Sabrina Cara | Huawei Developers | Medium, acessado em fevereiro 3, 2026, [https://medium.com/huawei-developers/testing-the-modules-of-your-mvvm-clean-architecture-android-project-part-2-testing-the-use-d2b5ddf5380a](https://medium.com/huawei-developers/testing-the-modules-of-your-mvvm-clean-architecture-android-project-part-2-testing-the-use-d2b5ddf5380a)
32. Technical Debt vs. Architectural Technical Debt \- vFunction, acessado em fevereiro 3, 2026, [https://vfunction.com/blog/technical-debt-vs-architectural-technical-debt-what-to-know/](https://vfunction.com/blog/technical-debt-vs-architectural-technical-debt-what-to-know/)
33. Building an LLM evaluation framework: best practices \- Datadog, acessado em fevereiro 3, 2026, [https://www.datadoghq.com/blog/llm-evaluation-framework-best-practices/](https://www.datadoghq.com/blog/llm-evaluation-framework-best-practices/)

[image1]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAABF0lEQVR4Xu2TvUoDQRRGr1qZSkTSpBQMIjZ5AAvjA0jE0jYJ1jZ2go1VQLCxsgkk8SUELRQUkQTSBEJIo502kkLUnHFm2J27m8J+Dxx25n7D/C0jkvFftnGIr/iGzTD+4xFHOBA7thGkijZ+4A+uqmwBT/AWC2GUpItH+CvpK57hvi5qiniNS/iJ75gLRojcYV7VEtTw0LUvxe6qGsWyiM+x/kxauO7am2InMkf1lPEi1p/Ji+rfiJ1sy/VPcS+K0/H3E6cidiJfN/ezEsXp1CW6H4/53WP8wjV8CuN0Orihi3Asdlf3eK6yBHPYd1+NOcpE7GS7KktwgD2c14HjCr9xWQeeHbHvyqxoNE/DvDlNCR90MSMDpvMbNCf6RtASAAAAAElFTkSuQmCC
[image2]: data:image/png;base64,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
