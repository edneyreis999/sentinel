# **Arquitetura de Excelência para Governança de Testes E2E e Integração no Ecossistema NestJS: Um Guia para Auditoria Técnica**

O cenário contemporâneo do desenvolvimento de software exige que a qualidade não seja apenas um atributo desejável, mas um pilar central da engenharia de plataformas. Em ecossistemas baseados em NestJS, a complexidade inerente às arquiteturas de microsserviços e APIs híbridas (REST e GraphQL) impõe desafios significativos para a manutenção da integridade sistêmica. A automação de testes surge como a ferramenta primordial para garantir que as versões atendam aos objetivos de desempenho e qualidade, permitindo ciclos de lançamento rápidos e seguros.1 Contudo, a simples presença de testes não é suficiente; a eficácia de uma suíte de testes reside na sua arquitetura, na escolha correta das ferramentas e na adesão a padrões de governança que assegurem a manutenibilidade a longo prazo. Este relatório detalha as diretrizes de excelência para a criação de um agente de inteligência artificial voltado à auditoria técnica, capaz de discernir entre implementações robustas e estruturas frágeis que comprometem o ciclo de vida do software.2

## **Fundamentos da Testabilidade no Framework NestJS**

A escolha do NestJS como base para aplicações corporativas deve-se, em grande parte, à sua arquitetura modular e ao suporte nativo para padrões de design consolidados, como a Injeção de Dependências (DI).4 O NestJS promove o desenvolvimento de componentes desacoplados, o que é um pré-requisito para a testabilidade. O framework fornece o pacote @nestjs/testing, que introduz a classe Test para criar contextos de execução isolados, permitindo a simulação do tempo de execução do Nest sem a necessidade de inicializar toda a aplicação.1 Esta capacidade é fundamental para a criação de testes de integração eficientes, onde apenas os módulos necessários são compilados, otimizando o uso de recursos e o tempo de feedback.

Um auditor técnico deve avaliar se a implementação utiliza o método createTestingModule(), que recebe um objeto de metadados similar ao decorador @Module(). Este método retorna uma instância de TestingModule, fornecendo ganchos para gerenciar instâncias de classe e substituir provedores por mocks ou fakes através do método overrideProvider().1 A excelência na auditoria técnica é identificada quando os testes não apenas verificam o "caminho feliz", mas também exploram as fronteiras do sistema, garantindo que exceções sejam tratadas de forma previsível e que o estado da aplicação permaneça consistente após falhas.6

### **Níveis de Teste e a Pirâmide de Automação**

A governança de testes em ambientes NestJS deve seguir a lógica da pirâmide de automação, priorizando testes de baixo nível por sua velocidade e custo reduzido, enquanto reserva testes de ponta a ponta (E2E) para jornadas críticas de negócio.7 O auditor de IA deve ser treinado para reconhecer se a distribuição de testes respeita esta hierarquia, evitando o antipadrão conhecido como "sorvete de cone", onde há uma abundância de testes E2E lentos e frágeis em detrimento de uma base sólida de testes unitários e de integração.7

| Nível de Teste       | Escopo                                                  | Objetivo Principal                                                             | Ferramentas Recomendadas     |
| :------------------- | :------------------------------------------------------ | :----------------------------------------------------------------------------- | :--------------------------- |
| **Unitário**         | Funções, métodos ou classes individuais isoladas.       | Validar lógica de negócio interna e algoritmos específicos.                    | Jest, @suites/unit 1         |
| **Integração**       | Interação entre dois ou mais módulos ou provedores.     | Garantir que a fiação de dependências e a comunicação entre camadas funcionem. | @nestjs/testing, Supertest 1 |
| **E2E (End-to-End)** | Fluxo completo da aplicação, do HTTP ao banco de dados. | Simular interações reais de usuários e validar fluxos críticos de negócio.     | Supertest, Testcontainers 12 |

A distinção entre testes de integração "sociáveis" e "solitários" é um ponto de profundidade técnica que o auditor deve identificar. Testes solitários utilizam mocks para todas as dependências externas ao módulo sob teste, enquanto testes sociáveis permitem a interação com colaboradores reais, como outros serviços do mesmo módulo ou um banco de dados em memória, para validar o comportamento emergente do conjunto.14

## **Diretrizes para APIs REST: Estrutura e Governança de Contratos**

No contexto de APIs REST, a qualidade dos testes de integração e E2E é medida pela precisão com que os contratos HTTP são validados. O uso do Supertest é o padrão de excelência para simular requisições contra o servidor NestJS.11 Um auditor técnico deve buscar implementações que não se limitem a verificar o código de status HTTP, mas que também validem a estrutura do corpo da resposta, os headers e, crucialmente, a persistência dos dados no PostgreSQL.11

A governança exige que cada endpoint seja testado contra uma matriz de cenários. Isso inclui a validação de DTOs (Data Transfer Objects), garantindo que o ValidationPipe do NestJS esteja corretamente configurado para rejeitar payloads malformados com o código 400 (Bad Request).7 Além disso, a auditoria deve verificar se os testes cobrem falhas de autorização (401 e 403), assegurando que os Guards do NestJS protejam os recursos sensíveis da aplicação.6

### **Padrões de Implementação para Controladores**

A arquitetura de testes para controladores deve focar no comportamento externo e não na lógica interna, que deve estar encapsulada nos serviços.16 O auditor deve sinalizar como antipadrão a existência de testes de controlador que mockam excessivamente o comportamento interno, pois isso torna o teste redundante e acoplado à implementação. Em vez disso, o foco deve estar na transformação de dados e no roteamento.

Um guia de alta qualidade define que a suíte de testes E2E deve ser estruturada cronologicamente seguindo o ciclo de vida de uma entidade. Por exemplo, em um serviço de gestão de usuários:

1. **Criação (POST):** Validação da entrada e retorno do ID.6
2. **Consulta (GET):** Verificação de que o recurso criado está acessível.11
3. **Atualização (PATCH/PUT):** Modificação parcial ou total e verificação de integridade.6
4. **Exclusão (DELETE):** Remoção lógica ou física e validação de que o recurso não é mais retornado.13

## **Governança em APIs GraphQL: Estabilidade e Integridade do Schema**

O teste de APIs GraphQL introduz complexidades adicionais devido à sua natureza de schema único e consultas flexíveis. A estabilidade do schema é o contrato primordial entre o backend e os clientes, e qualquer mudança não intencional pode ser catastrófica para a integração.18 A excelência na auditoria técnica de GraphQL exige a implementação de testes de snapshot para o schema SDL (Schema Definition Language). Ferramentas como jest-serializer-graphql-schema permitem capturar a estrutura do schema e detectar alterações acidentais em campos, tipos ou argumentos.18

Para a validação de Resolvers, a governança recomenda uma abordagem dual. Resolvers que contêm lógica de mapeamento ou transformação significativa devem ser unitariamente testados, injetando mocks de serviços através do contexto do Apollo Server.18 No entanto, a fiação completa da operação (Query ou Mutation) deve ser validada por testes de integração que utilizem o método executeOperation do Apollo ou requisições HTTP via Supertest para garantir que a resolução de campos aninhados e a injeção de Context funcionem corretamente.18

### **Desafios de Performance e o Problema N+1**

Um auditor de IA deve identificar se os testes de GraphQL abordam o problema N+1, uma falha estrutural comum onde o servidor executa múltiplas consultas ao banco de dados para resolver listas de relacionamentos.21 A implementação de DataLoaders deve ser auditada através de testes que verifiquem o número de chamadas ao banco de dados PostgreSQL. Um teste de alta qualidade para esta funcionalidade deve:

- Realizar uma consulta por uma lista de entidades com campos de relacionamento.
- Assertar que o provedor de dados (repositório) foi chamado apenas uma vez para o conjunto de IDs (batching), em vez de uma vez para cada entidade individual.18

### **Subscrições e Tempo Real**

As subscrições GraphQL (Subscriptions) representam um desafio de teste único, pois operam sobre WebSockets em vez de ciclos tradicionais de requisição-resposta HTTP.23 A governança técnica exige que o auditor verifique a configuração do protocolo graphql-ws e a presença de testes que simulem a publicação de eventos via PubSub e a subsequente recepção pelo cliente inscrito.23 A segurança nestes canais também deve ser auditada, verificando se o hook onConnect realiza a autenticação do token JWT antes de permitir a abertura da conexão.23

## **O Coração da Persistência: Estratégias para PostgreSQL**

O gerenciamento do estado do banco de dados PostgreSQL é, frequentemente, a maior fonte de instabilidade (flakiness) em testes automatizados. A auditoria técnica deve avaliar criticamente a estratégia de isolamento de dados adotada pela equipe.25 O uso de mocks para o banco de dados em testes de integração é considerado um antipadrão de baixo nível, pois falha em detectar erros de sintaxe SQL, violações de restrições de integridade e comportamentos específicos do PostgreSQL.13

### **Comparativo de Estratégias de Gerenciamento de Banco de Dados**

A escolha da estratégia depende do balanço entre velocidade de execução e fidelidade ao ambiente de produção. O auditor deve identificar se a escolha é consciente e tecnicamente justificada.

| Estratégia                  | Mecanismo                                                               | Nível de Isolamento                        | Impacto na Performance             |
| :-------------------------- | :---------------------------------------------------------------------- | :----------------------------------------- | :--------------------------------- |
| **Testcontainers**          | Sobe um container Docker real do PostgreSQL por suíte de testes.        | Máximo (Sandbox total).13                  | Alto (tempo de startup do Docker). |
| **Transactional Rollbacks** | Involve cada teste em uma transação SQL e executa um ROLLBACK ao final. | Médio (Pode ter conflitos com sequências). | Mínimo (Extremamente rápido).25    |
| **Unique Schemas**          | Cria um esquema PostgreSQL diferente por execução de teste.             | Alto (Evita colisões de nomes de tabela).  | Moderado.26                        |
| **IntegreSQL / Poolers**    | Gerencia um conjunto de bancos de dados pré-criados e limpos.           | Alto (Isolamento por banco).               | Baixo (Acesso imediato).26         |

O uso de **Testcontainers** é a diretriz recomendada para governança de nível enterprise, pois garante que os testes ocorram em um ambiente idêntico ao de produção, eliminando o problema de "funciona na minha máquina".13 O auditor deve verificar se a implementação automatiza o processo de migrações (npx prisma migrate ou similar) dentro do container antes da execução dos testes para assegurar a paridade do schema.15

## **Padrões de Design e Governança de Dados de Teste**

A manutenibilidade de uma suíte de testes é diretamente proporcional à legibilidade e reutilização do código de teste. Um agente de auditoria de IA deve identificar o uso de padrões de criação de objetos que evitem a duplicação de dados e a fragilidade dos testes diante de mudanças no schema.7

### **Object Mother vs. Test Data Builder**

A gestão de fixtures (dados fixos) é uma fonte comum de "General Fixture Smell", onde o setup de um teste cria mais dados do que o necessário, obscurecendo a relação entre causa e efeito.30

- **Object Mother:** Este padrão utiliza classes de fábrica que retornam instâncias de entidades com estados predefinidos (ex: UserMother.createAdmin()). É útil para cenários simples, mas pode sofrer de explosão de métodos à medida que as variações aumentam.29
- **Test Data Builder:** Este padrão oferece uma interface fluente para construir objetos complexos, permitindo sobrescrever apenas os campos necessários para o teste (ex: new UserBuilder().withEmail('test@test.com').build()). Esta é a diretriz preferencial para sistemas com entidades complexas.14

O auditor de IA deve recomendar a fusão de ambos: um Object Mother que fornece instâncias básicas de Builders. Isso permite que a equipe de desenvolvimento tenha o melhor de dois mundos: rapidez na criação de dados padrão e flexibilidade para casos de borda.29

## **Taxonomia de Test Smells e Falhas Estruturais**

O sucesso de um agente de auditoria técnica reside na sua capacidade de identificar padrões de código "fedorentos" (test smells) que indicam uma arquitetura de testes degradada. Estes padrões aumentam o custo de manutenção e reduzem a confiança na suíte de testes.2

### **Lista de Auditoria para Identificação de Test Smells**

1. **Assertion Roulette:** Ocorre quando um método de teste contém múltiplas asserções sem mensagens de erro explicativas. Se o teste falha, é difícil determinar qual asserção falhou sem depuração manual.2
2. **Magic Number / Hard-coded Values:** Valores numéricos ou strings literais sem explicação semântica. O auditor deve exigir o uso de constantes ou geradores de dados aleatórios controlados (como Faker).2
3. **General Fixture:** Uma configuração de setup (beforeEach) que cria um ambiente muito amplo para testes que utilizam apenas uma pequena parte. Isso degrada a performance e aumenta a fragilidade.30
4. **Sensitive Equality:** Asserções que verificam o objeto inteiro (toEqual) incluindo campos voláteis como createdAt ou id, em vez de focar nos campos relevantes para o comportamento testado. Isso causa falhas irrelevantes quando o formato da data ou a estratégia de ID mudam.14
5. **Test Maverick:** Testes que residem em uma suíte com setup pesado, mas que não utilizam o setup, gerando overhead desnecessário.30
6. **Exception Handling Manual:** O uso de blocos try/catch dentro dos testes para validar erros, em vez de utilizar os métodos especializados do framework de teste (ex: expect(fn).rejects.toThrow()).2

## **O Agente de IA para Auditoria Técnica: Critérios e Avaliação**

A criação de um agente de IA para auditar testes exige uma abordagem que vá além da análise estática de código tradicional (como ESLint). O agente deve realizar uma análise semântica e comportamental, verificando se os testes de fato protegem a lógica de negócio ou se são apenas "teatro de cobertura".32

### **Metodologias de Avaliação do Agente**

A avaliação de um agente de auditoria técnica deve ser baseada em trajetórias de decisão, não apenas em resultados binários. O auditor de auditorias deve verificar:

- **Acurácia na Identificação de Smells:** O agente deve ser capaz de detectar instâncias de smells com alta precisão e sugerir refatorações automáticas baseadas em definições de linguagem natural.2
- **Análise de Trajetória:** O agente deve rastrear como um erro em uma camada (ex: uma falha de validação em um DTO) propaga-se através dos testes, garantindo que as falhas sejam detectadas na camada correta.33
- **Robustez sob Estresse:** O agente deve ser submetido a testes adversariais para garantir que não sofra alucinações ao analisar bases de código complexas ou pouco convencionais.32

| Componente da IA        | Responsabilidade Técnica                                                   | Fonte de Dados                        |
| :---------------------- | :------------------------------------------------------------------------- | :------------------------------------ |
| **Camada de Percepção** | Coleta de código-fonte, logs de execução e cobertura.                      | Arquivos.spec.ts, Repositórios Git.35 |
| **Knowledge Base**      | Repositório de padrões de excelência e histórico de bugs.                  | Documentação NestJS, Post-mortems.35  |
| **Reasoning Engine**    | Avaliação do código contra regras de governança e lógica de negócio.       | Modelos LLM (Llama, Phi, GPT).2       |
| **Feedback Loop**       | Aprendizado contínuo com base nas correções aceitas pelos desenvolvedores. | Pull Request Reviews.35               |

## **Governança Corporativa e Manutenibilidade em Larga Escala**

Em ecossistemas vastos, a governança de testes deve ser integrada ao pipeline de Integração Contínua (CI). O auditor técnico deve garantir que os testes não sejam apenas uma tarefa de desenvolvimento, mas uma política de release. Isso inclui a definição de limiares (thresholds) de cobertura de código, mas com uma ressalva técnica: a cobertura quantitativa deve ser secundária à cobertura qualitativa dos caminhos de decisão (branch coverage).6

A manutenibilidade é sustentada por uma arquitetura de testes modular. O auditor deve desencorajar o acoplamento excessivo entre arquivos de teste, promovendo o uso de utilitários de setup compartilhados, mas evitando "global mocks" que introduzam dependências ocultas entre suítes independentes.7

### **Práticas de Excelência para o Ambiente de CI**

- **Isolamento de Banco de Dados:** Cada build no CI deve ter sua própria instância de banco de dados PostgreSQL (via Docker), garantindo que testes concorrentes em diferentes PRs não interfiram entre si.13
- **Fail Fast:** Ordenar os testes para que os mais rápidos e com maior probabilidade de falha (unitários) executem primeiro, abortando a execução se houver falhas críticas antes de subir containers pesados para E2E.18
- **Sanitização de Logs:** Garantir que dados sensíveis, como senhas de teste ou tokens JWT, não vazem nos logs do CI durante a execução de testes falhos.36

## **Conclusão: O Caminho para a Automação de Alta Qualidade**

A excelência em testes no ecossistema NestJS não é alcançada por acidente, mas sim por meio de uma arquitetura deliberada e uma governança rigorosa. A transição de um modelo de testes artesanais para um sistema de auditoria automatizado por IA exige a formalização dos padrões aqui descritos. Um guia de diretrizes para implementação de alta qualidade deve priorizar o desacoplamento de dependências, a estabilidade dos contratos de API (REST e GraphQL) e o gerenciamento isolado do estado persistente no PostgreSQL.

Ao identificar proativamente falhas estruturais como "Assertion Roulette" ou "General Fixtures", e ao promover o uso de padrões robustos como Test Data Builders e Testcontainers, as organizações podem garantir que suas suítes de testes atuem como um verdadeiro acelerador de inovação, em vez de uma barreira de manutenção. O agente de auditoria técnica torna-se, assim, um parceiro estratégico na preservação da saúde do software, assegurando que cada linha de código de teste agregue valor real à resiliência e confiabilidade da plataforma. A convergência entre engenharia de software clássica e inteligência artificial abre uma nova fronteira para a garantia de qualidade, onde a excelência é continuamente monitorada, auditada e aprimorada.

#### **Referências citadas**

1. Testing | NestJS \- A progressive Node.js framework, acessado em fevereiro 3, 2026, [https://docs.nestjs.com/fundamentals/testing](https://docs.nestjs.com/fundamentals/testing)
2. Agentic LMs: Hunting Down Test Smells \- arXiv, acessado em fevereiro 3, 2026, [https://arxiv.org/html/2504.07277v2](https://arxiv.org/html/2504.07277v2)
3. tsDetect: An Open Source Test Smells Detection Tool, acessado em fevereiro 3, 2026, [https://testsmells.org/assets/publications/FSE2020_TechnicalPaper.pdf](https://testsmells.org/assets/publications/FSE2020_TechnicalPaper.pdf)
4. NestJS \- A progressive Node.js framework, acessado em fevereiro 3, 2026, [https://nestjs.com/](https://nestjs.com/)
5. Why to use Nest-JS for Enterprise-Level Applications | by Vigneshwaran \- Medium, acessado em fevereiro 3, 2026, [https://medium.com/@vigneshwaran.vwk/why-to-use-nest-js-for-enterprise-level-applications-efa213c5ff0b](https://medium.com/@vigneshwaran.vwk/why-to-use-nest-js-for-enterprise-level-applications-efa213c5ff0b)
6. How to Write Unit Tests and E2E Tests for NestJS Applications, acessado em fevereiro 3, 2026, [https://www.freecodecamp.org/news/nestjs-unit-testing-e2e-testing-guide/](https://www.freecodecamp.org/news/nestjs-unit-testing-e2e-testing-guide/)
7. Best Practices & Common Pitfalls when Testing NestJS Apps \- Amplication, acessado em fevereiro 3, 2026, [https://amplication.com/blog/best-practices-and-common-pitfalls-when-testing-my-nestjs-app](https://amplication.com/blog/best-practices-and-common-pitfalls-when-testing-my-nestjs-app)
8. unit vs integration vs e2e testing in nestjs projects? : r/Nestjs_framework \- Reddit, acessado em fevereiro 3, 2026, [https://www.reddit.com/r/Nestjs_framework/comments/1qjtpwc/unit_vs_integration_vs_e2e_testing_in_nestjs/](https://www.reddit.com/r/Nestjs_framework/comments/1qjtpwc/unit_vs_integration_vs_e2e_testing_in_nestjs/)
9. Software Testing Anti-Patterns and Ways To Avoid Them \- testRigor Blog, acessado em fevereiro 3, 2026, [https://testrigor.com/blog/anti-patterns-in-software-testing/](https://testrigor.com/blog/anti-patterns-in-software-testing/)
10. Suites (Automock) | NestJS \- A progressive Node.js framework, acessado em fevereiro 3, 2026, [https://docs.nestjs.com/recipes/suites](https://docs.nestjs.com/recipes/suites)
11. Exploring End-to-End Testing in NestJS with Supertest | by Weerayut Teja \- Medium, acessado em fevereiro 3, 2026, [https://medium.com/@wteja/exploring-end-to-end-testing-in-nestjs-with-supertest-384fd40d814](https://medium.com/@wteja/exploring-end-to-end-testing-in-nestjs-with-supertest-384fd40d814)
12. How to add E2E Tests for Nestjs graphql \- DEV Community, acessado em fevereiro 3, 2026, [https://dev.to/tkssharma/how-to-add-e2e-tests-for-nestjs-graphql-161g](https://dev.to/tkssharma/how-to-add-e2e-tests-for-nestjs-graphql-161g)
13. Supercharge Your Integration Tests for NestJS Application with ..., acessado em fevereiro 3, 2026, [https://medium.com/@umakantabehera/supercharge-your-integration-tests-for-nestjs-application-with-testcontainers-751e66119814](https://medium.com/@umakantabehera/supercharge-your-integration-tests-for-nestjs-application-with-testcontainers-751e66119814)
14. Top 10 Unit Testing Anti-Patterns in .NET and How to Avoid Them \- bool.dev, acessado em fevereiro 3, 2026, [https://bool.dev/blog/detail/top-10-unit-testing-antipatterns-in-dotnet](https://bool.dev/blog/detail/top-10-unit-testing-antipatterns-in-dotnet)
15. Improving Integration/E2E testing using NestJS and TestContainers \- DEV Community, acessado em fevereiro 3, 2026, [https://dev.to/medaymentn/improving-intergratione2e-testing-using-nestjs-and-testcontainers-3eh0](https://dev.to/medaymentn/improving-intergratione2e-testing-using-nestjs-and-testcontainers-3eh0)
16. Scalable Architecture with NestJS: Best Practices Guide \- Mindbowser, acessado em fevereiro 3, 2026, [https://www.mindbowser.com/scalable-architecture-nestjs/](https://www.mindbowser.com/scalable-architecture-nestjs/)
17. 5 best practices for NestJS applications | Tech Tonic \- Medium, acessado em fevereiro 3, 2026, [https://medium.com/deno-the-complete-reference/5-best-practices-for-nestjs-applications-831d0566a534](https://medium.com/deno-the-complete-reference/5-best-practices-for-nestjs-applications-831d0566a534)
18. Testing Best Practices \- GraphQL.js, acessado em fevereiro 3, 2026, [https://www.graphql-js.org/docs/testing-best-practices/](https://www.graphql-js.org/docs/testing-best-practices/)
19. Testing best practices for a GraphQL server \- Reddit, acessado em fevereiro 3, 2026, [https://www.reddit.com/r/graphql/comments/8b0tku/testing_best_practices_for_a_graphql_server/](https://www.reddit.com/r/graphql/comments/8b0tku/testing_best_practices_for_a_graphql_server/)
20. Integration Testing \- Apollo GraphQL Docs, acessado em fevereiro 3, 2026, [https://www.apollographql.com/docs/apollo-server/testing/testing](https://www.apollographql.com/docs/apollo-server/testing/testing)
21. Testing with Apollo Federation \- Apollo GraphQL Docs, acessado em fevereiro 3, 2026, [https://www.apollographql.com/docs/graphos/platform/production-readiness/testing-with-apollo-federation](https://www.apollographql.com/docs/graphos/platform/production-readiness/testing-with-apollo-federation)
22. Best Practices in Testing GraphQL APIs \- Amplication, acessado em fevereiro 3, 2026, [https://amplication.com/blog/best-practices-in-testing-graphql-apis](https://amplication.com/blog/best-practices-in-testing-graphql-apis)
23. GraphQL \+ TypeScript \- Subscriptions | NestJS \- A progressive Node.js framework, acessado em fevereiro 3, 2026, [https://docs.nestjs.com/graphql/subscriptions](https://docs.nestjs.com/graphql/subscriptions)
24. Using GraphQL Subscriptions in NestJS: A Comprehensive Guide ..., acessado em fevereiro 3, 2026, [https://arnab-k.medium.com/using-graphql-subscriptions-in-nestjs-a147d72cc381](https://arnab-k.medium.com/using-graphql-subscriptions-in-nestjs-a147d72cc381)
25. Different strategies for testing interaction with a Postgres DB : r/node \- Reddit, acessado em fevereiro 3, 2026, [https://www.reddit.com/r/node/comments/1bi0ufv/different_strategies_for_testing_interaction_with/](https://www.reddit.com/r/node/comments/1bi0ufv/different_strategies_for_testing_interaction_with/)
26. When running e-2e tests, how to create a postgresql database using Docker and TypeOrm, acessado em fevereiro 3, 2026, [https://www.reddit.com/r/nestjs/comments/1dk1o2z/when_running_e2e_tests_how_to_create_a_postgresql/](https://www.reddit.com/r/nestjs/comments/1dk1o2z/when_running_e2e_tests_how_to_create_a_postgresql/)
27. When E2E Tests In NestJS Gives Me a Headache \- DEV Community, acessado em fevereiro 3, 2026, [https://dev.to/kasir-barati/when-e2e-tests-in-nestjs-gives-me-a-headache-59ed](https://dev.to/kasir-barati/when-e2e-tests-in-nestjs-gives-me-a-headache-59ed)
28. Prisma VS TypeORM \- description and comparison \- DEV Community, acessado em fevereiro 3, 2026, [https://dev.to/afl_ext/prisma-vs-typeorm-description-and-comparison-4bob](https://dev.to/afl_ext/prisma-vs-typeorm-description-and-comparison-4bob)
29. Test Data Builders and Object Mother: another look \- Codeleak.pl, acessado em fevereiro 3, 2026, [https://blog.codeleak.pl/2014/06/test-data-builders-and-object-mother.html](https://blog.codeleak.pl/2014/06/test-data-builders-and-object-mother.html)
30. Automated Detection of Test Fixture Strategies and Smells \- UVIC, acessado em fevereiro 3, 2026, [https://chisel.cs.uvic.ca/pubs/greiler-ICST2013.pdf](https://chisel.cs.uvic.ca/pubs/greiler-ICST2013.pdf)
31. Agentic SLMs: Hunting Down Test Smells \- arXiv, acessado em fevereiro 3, 2026, [https://arxiv.org/html/2504.07277v1](https://arxiv.org/html/2504.07277v1)
32. How to Evaluate AI Agents: A Practical Checklist for Production \- Maxim AI, acessado em fevereiro 3, 2026, [https://www.getmaxim.ai/articles/how-to-evaluate-ai-agents-a-practical-checklist-for-production/](https://www.getmaxim.ai/articles/how-to-evaluate-ai-agents-a-practical-checklist-for-production/)
33. The AI Agent Behavioral Validation Testing Playbook \- Galileo AI: The AI Observability and Evaluation Platform, acessado em fevereiro 3, 2026, [https://galileo.ai/learn/ai-observability/ai-agent-testing-behavioral-validation](https://galileo.ai/learn/ai-observability/ai-agent-testing-behavioral-validation)
34. How should we test and certify AI agents before using them in real workflows? \- Reddit, acessado em fevereiro 3, 2026, [https://www.reddit.com/r/AI_Agents/comments/1p4ql0d/how_should_we_test_and_certify_ai_agents_before/](https://www.reddit.com/r/AI_Agents/comments/1p4ql0d/how_should_we_test_and_certify_ai_agents_before/)
35. AI Agent Testing: Level Up Your QA Process \- Testomat.io, acessado em fevereiro 3, 2026, [https://testomat.io/blog/ai-agent-testing/](https://testomat.io/blog/ai-agent-testing/)
36. Building a Comprehensive Audit System in NestJS (and Express.JS) | by Uchechukwu Samuel Ottah | Medium, acessado em fevereiro 3, 2026, [https://medium.com/@usottah/building-a-comprehensive-audit-system-in-nestjs-and-express-js-b34af8588f58](https://medium.com/@usottah/building-a-comprehensive-audit-system-in-nestjs-and-express-js-b34af8588f58)
