# Decisões técnicas

Decididas no kickoff de 18/10/2026 por Stela e Geovana. Se alguma mudar, registrem uma decisão nova no fim do arquivo em vez de apagar a antiga.

## D01 · Frontend: React + TypeScript + Vite

- **Motivo:** o editor tem muito estado (ferramenta, seleção, desfazer) e muitos painéis; componentes deixam isso organizado. TypeScript pega erros de geometria antes de rodar. O build do Vite vira uma etapa real do CI.
- **Alternativas:** JavaScript puro (difícil de organizar com um editor deste tamanho); Next.js (renderização no servidor não ajuda num app que só funciona logado).

## D02 · Desenho no editor: SVG

- **Motivo:** cada nó e cada alça é um elemento que recebe clique sozinho, sem cálculo manual. Aguenta com folga os 500 pontos da RNF05.
- **Alternativa:** Canvas (mais rápido para milhares de pontos, mas exige detectar cliques na mão).

## D03 · Backend: Node.js 24 + Express 5 + TypeScript

- **Motivo:** a mesma linguagem no front e no back; as regras de validação do glifo ficam num lugar só e servem aos dois.
- **Alternativas:** PHP + Laravel e Python + FastAPI (duas linguagens no projeto).

## D04 · Banco: PostgreSQL, com os contornos em JSONB

- **Local:** Postgres 17 no Docker Compose. **Produção:** Neon, plano grátis.
- **Motivo:** o glifo é sempre lido e salvo inteiro; uma tabela por ponto seria lenta e complicada.
- **Migrações:** arquivos SQL numerados em `server/migracoes/` (001, 002…), aplicados quando o servidor inicia. O banco de produção guarda dados entre os sprints, então tabela nova ou coluna nova entra por migração, nunca recriando tudo.
- **Alternativa:** MongoDB (perderia as chaves estrangeiras que garantem a RN03).

## D05 · Fontes: opentype.js no navegador

- **Motivo:** lê .otf e .ttf (fonte aberta e importação) e gera o .otf (teste e exportação) sem servidor extra. Gerar a fonte no navegador também permite testar a fonte na hora com a API FontFace (T6).
- **Fonte aberta de partida:** Source Sans 3, licença SIL OFL 1.1. Cobre Latino, Grego e Cirílico. Arquivo e licença ficam em `web/public/modelos/`.
- **Alternativa:** fontTools em Python no servidor (mais completo, mas é outra linguagem e outro serviço para manter).

## D06 · Login: e-mail e senha com sessão

- Senhas com **bcryptjs** (não precisa compilar nada no Docker).
- Sessão com **express-session**, guardada no Postgres (**connect-pg-simple**), para ninguém ser deslogado a cada deploy.
- Cookie httpOnly, secure e SameSite=Lax; `SESSION_SECRET` como variável de ambiente.
- **Alternativas:** JWT (sair da conta e expirar ficam mais difíceis); entrar com Google ou GitHub (exige registrar o app e guardar segredos, e é difícil de testar no CI).

## D07 · Hospedagem: Render free, com Docker

- Um único serviço serve a API e o front já compilado.
- Dockerfile em dois estágios: o primeiro compila o front; o segundo leva só o necessário para rodar.
- **Alternativas:** Heroku (sem plano grátis), Railway (o plano grátis é só de teste), Vercel (publica a cada push por padrão; para só publicar depois dos testes precisaria de configuração extra).
- **Limitação:** no plano free, o app dorme depois de uns 15 minutos sem acesso, e a primeira visita demora perto de um minuto.

## D08 · CI/CD: GitHub Actions

Workflow `.github/workflows/ci-cd.yml`, que roda em todo Pull Request e em todo push no main:

| Job | O que faz |
|---|---|
| Build e testes | Tipos, lint, testes unitários, testes de integração com Postgres de serviço, build do front e `docker build` |
| E2E | Sobe o app e roda, com o selenium-side-runner, os testes de tela gravados no Selenium IDE (Chrome sem janela) |
| Deploy | Só no main e só depois dos dois anteriores: chama o deploy hook do Render, no environment `production` |

- O ruleset do main exige os checks "Build e testes" e "E2E".
- O Auto-Deploy do Render fica desligado: quem manda publicar é o pipeline.

## D09 · Testes

- **Vitest:** testes unitários do front e do back (geometria, validação, conversão de formatos).
- **Supertest:** testes de integração da API, com Postgres de verdade.
- **Selenium IDE:** testes de tela dos fluxos simples (entrar, criar fonte, exportar). A Geovana grava os testes na extensão do navegador, sem programar, e salva os arquivos `.side` em `e2e/`. No CI, o selenium-side-runner roda todos. Arrastar nós no editor é testado em código, com Vitest, porque gravar arraste em SVG é frágil.
- **Alternativa ao Selenium IDE:** Playwright (mais poderoso, mas exige escrever código; o Selenium IDE deixa a QA gravar os testes sozinha).
- **Teste de ida e volta da exportação:** gerar o .otf, ler de novo com opentype.js e conferir nomes, caracteres e larguras.

## D10 · Monitoramento

- **Erros:** Sentry no navegador e no servidor.
- **Logs:** pino-http, uma linha JSON por requisição, visível na aba Logs do Render.
- **Disponibilidade e tempo de resposta:** UptimeRobot no `/health`, a cada 5 minutos.
- **Alternativas:** Grafana Cloud e LogRocket, citados no enunciado; pedem mais configuração para o mesmo resultado neste MVP.

## D11 · Estrutura do repositório

```
web/        React (telas, editor, opentype.js)
server/     Express (API, sessões, migrações)
shared/     tipos do glifo e regras de validação usados pelo web e pelo server
e2e/        testes de tela do Selenium IDE (arquivos .side)
docs/       ERS, decisões, sprints, pipeline, prints
```

Um único `package.json` na raiz, com os scripts `dev`, `build`, `test` e `test:e2e`.

## D12 · Fluxo Git: GitHub Flow

- O `main` é protegido: só recebe código por Pull Request com 1 aprovação e checks verdes.
- Uma branch por issue: `feature/`, `fix/`, `test/`, `ci/` ou `docs/`, mais o número e um nome curto. Exemplo: `feature/28-editor-selecao`.
- O merge é feito com Squash and merge, e a branch é apagada depois.
- Mensagens de commit começam com `feat:`, `fix:`, `test:`, `ci:`, `docs:` ou `chore:`.

## D13 · Scrum

- Sprints de 2 a 3 dias, para entregar algo funcionando com frequência e receber retorno rápido: S0 17–18/10, S1 19–21/10, S2 22–24/10, S3 25–26/10.
- No GitHub: sprint = Milestone, quadro = Projects, épico = issue com sub-issues (#1 a #8, US01 a US08), tarefa = sub-issue.
- Daily por comentário na issue "Scrum · Sprint N"; planning, review e retro registradas em `docs/sprints.md`.
- Cada sprint fecha com uma release: v0.1.0 (S1), v0.2.0 (S2), v1.0.0 (S3).
- Cliente: a startup do enunciado, representada pelo professor.
- Stela: desenvolvimento e DevOps. Responsável pela ERS, pela interface, pela configuração do GitHub, pelo CI/CD, pelo deploy, pelo monitoramento e pelo app.
- O repositório está na conta pessoal da Geovana, e só a dona mexe em Settings. Por isso a Geovana configura o ruleset do main e cadastra os secrets.
- Geovana: QA e Product Owner. Testa e aprova cada PR da Stela (o ruleset exige 1 aprovação, então nada entra sem ela), escreve os cenários de teste nas issues, faz o teste exploratório e junta os prints. Também conduz as cerimônias (papel de Scrum Master) e registra cada uma em `docs/sprints.md` por PR.
- A ordem das tarefas é decidida pelas duas, na Planning de cada sprint.
- O Scrum recomenda que Product Owner e Scrum Master sejam pessoas diferentes. Num time de duas pessoas os papéis se acumulam; a Geovana fica com os dois, e a Stela com o desenvolvimento e o DevOps.
