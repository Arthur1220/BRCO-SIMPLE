# BRCO: Calculadora de Exigências Nutricionais para Caprinos e Ovinos

![BRCO Screenshot](frontend/src/assets/images/ovino-caprino.png)

## ❯ Descrição

O **BRCO** é um portal de acesso livre e uma ferramenta de cálculo para otimizar a nutrição de caprinos e ovinos. O sistema fornece cálculos precisos de Exigências Nutricionais e de NDT (Nutrientes Digestíveis Totais) com base em equações validadas cientificamente com base totalmente nacional, publicadas no livro "Exigências Nutricionais de Caprinos e Ovinos de Corte - BR-CORTE".

O objetivo é fornecer a produtores, estudantes e pesquisadores uma ferramenta gratuita, eficiente e intuitiva para promover práticas de nutrição mais sustentáveis e eficazes.

## ✨ Funcionalidades Principais

* **Cálculo de Exigências Nutricionais:** Determina as exigências de energia, proteína e minerais para caprinos e ovinos.
* **Cálculo de NDT:** Analisa a composição de alimentos para determinar seu valor energético.
* **Exportação de Relatórios:** Gera relatórios completos dos cálculos em formato CSV.
* **Painel Administrativo:** Uma área segura para visualização de estatísticas de uso da plataforma.
* **Interface Responsiva:** Design moderno e adaptável para uso em desktop e dispositivos móveis.

## 🚀 Tecnologias Utilizadas

O projeto foi construído com uma stack de JavaScript moderna, separando claramente as responsabilidades do frontend e do backend.

* **Frontend:**
    * [Vue.js](https://vuejs.org/) (com a Composition API)
    * [Vite](https://vitejs.dev/) como ferramenta de build
    * [Vue Router](https://router.vuejs.org/) para roteamento
    * [Pinia](https://pinia.vuejs.org/) para gerenciamento de estado
    * [Axios](https://axios-http.com/) para chamadas de API
    * **Deploy:** [Netlify](https://www.netlify.com/)
* **Backend:**
    * [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/pt-br/)
    * **Banco de Dados:** [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) (sob demanda)
    * **Autenticação do admin:** token JWT de sessão
    * **Testes:** `node:test` (runner nativo do Node)
* **Infraestrutura e Deploy:**
    * [AWS Lambda](https://aws.amazon.com/lambda/) com Function URL (região `sa-east-1`)
    * [AWS SAM](https://aws.amazon.com/serverless/sam/) (`backend/template.yaml`)
    * [Docker](https://www.docker.com/) só no desenvolvimento, para o DynamoDB Local

## ⚙️ Configuração e Instalação Local

Para rodar este projeto na sua máquina local, siga os passos abaixo.

### Pré-requisitos
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/en) (versão 24, ver `.nvmrc`)
* [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose (para o DynamoDB Local)

### Passos
1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Arthur1220/BRCO---SIMPLE.git
    cd BRCO---SIMPLE
    ```

2.  **Suba o DynamoDB Local** (na raiz do projeto):
    ```bash
    docker compose up -d
    ```
    Se a porta 8000 estiver ocupada, use outra: `DYNAMODB_PORT=8010 docker compose up -d` (e ajuste `DYNAMODB_ENDPOINT` no `.env`).

3.  **Configure o Backend:**
    * Navegue até a pasta do backend: `cd backend`
    * Crie um arquivo de ambiente: `cp .env.example .env` e preencha as variáveis.
    * Instale as dependências: `npm install`
    * Crie as tabelas e cadastre os alimentos iniciais: `npm run db:create-tables && npm run seed`
    * Inicie a API: `npm run dev` (porta 3000)

4.  **Configure o Frontend** (em outro terminal):
    * `cd frontend && npm install && npm run dev` (o Vite encaminha `/api` para a porta 3000)

5.  **Acesse a Aplicação:**
    * **Frontend:** [http://localhost:5173](http://localhost:5173)
    * **Documentação da API v1 (gerada do código):** [http://localhost:3000/api-docs/v1](http://localhost:3000/api-docs/v1)
    * **Painel de Admin (Login):** [http://localhost:5173/admin](http://localhost:5173/admin)

## 🧭 API v1 (contrato de apresentação)

O backend concentra todas as regras; o frontend apenas exibe e coleta dados. Documentação completa e sempre atualizada em `/api-docs/v1` (gerada do código).

| Pasta (backend) | Papel |
|---|---|
| `domain/` | Fórmulas científicas puras (exigências, NDT, dieta). `domain/version.js` versiona as fórmulas |
| `catalog/` | Espécies, genótipos, sexos, regras da dieta e metadados dos resultados (codes, grupos, labels pt/en) |
| `contracts/` | Schemas Zod: validação de entrada, respostas e geração do OpenAPI |
| `presenters/` | Transformam o resultado bruto do domínio na resposta da v1 e no CSV |
| `services/` | Execução dos cálculos e estatísticas |
| `repositories/` | Acesso ao DynamoDB (alimentos, cálculos salvos e registros de uso) |
| `controllers/v1`, `routes/v1` | Endpoints da v1 |

| Endpoint | Descrição |
|---|---|
| `GET /api/v1/catalog` | Opções, campos (label, unidade, limites) e regras para montar as telas (ETag, revalidado a cada acesso) |
| `GET /api/v1/foods` | Alimentos cadastrados (nutrientes em g/kg MS) |
| `POST /api/v1/calculations/{requirements,ndt,diet}` | Calcula, salva e devolve o resultado pronto para exibir |
| `GET /api/v1/calculations/:id` | Cálculo salvo (link compartilhável) |
| `GET /api/v1/calculations/:id/export.csv` | CSV gerado pelo servidor |
| `/api/v1/admin/*` | Login, estatísticas, histórico e cadastro de alimentos |

* **Idiomas:** `pt-BR` (padrão) e `en`, por `?lang=en` ou `Accept-Language`.
* **Erros:** sempre `{ "error": { "code", "message", "fields": [{ "path", "code", "message" }] } }`, com mensagens prontas para exibir.
* **Retenção:** cálculos ficam guardados por 6 meses e são apagados automaticamente (TTL do DynamoDB).
* **Fonte única:** limites e regras dos campos ficam em `contracts/`; a mesma definição valida a entrada e alimenta o catálogo.

## 🧪 Testes

```bash
docker compose up -d   # DynamoDB Local (na raiz)
cd backend
npm test
```

Cada arquivo de teste cria as próprias tabelas no DynamoDB Local. Os testes também cobrem o handler da Lambda (eventos da Function URL) e a migração do SQLite antigo.

Os testes cobrem as fórmulas (valores de referência em `test/fixtures/golden.json`), o solver de dieta, o CSV, a validação, a autenticação e o contrato da v1: toda chave do domínio precisa de metadado de apresentação, e toda rota precisa estar no OpenAPI. Ao corrigir uma fórmula de propósito, regenere as referências com `npm run test:update-golden` e revise o diff.

## ☁️ Estratégia de Deploy

* O **Backend** roda numa **AWS Lambda** (Function URL, `sa-east-1`) com dados no **DynamoDB**, tudo definido em `backend/template.yaml` e publicado com `sam deploy`.
* O **Frontend** é implantado na **Netlify**. O proxy do Netlify (`netlify.toml`) encaminha `/api` para o backend via HTTPS e **assina** cada requisição; o backend recusa o que não vem assinado.
* O painel admin usa login por senha, que gera um token de sessão de 2 horas. Nenhuma chave fica no código do frontend.

Passo a passo completo, variáveis e migração dos dados do servidor antigo: **[DEPLOY.md](DEPLOY.md)**.

---

Feito com ❤️ por Arthur Azevedo.