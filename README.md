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
    * [Prisma](https://www.prisma.io/) como ORM para interação com o banco de dados
    * **Banco de Dados:** [SQLite](https://www.sqlite.org/index.html) (volume Docker persistente)
    * **Autenticação do admin:** token JWT de sessão
    * **Testes:** `node:test` (runner nativo do Node)
* **Orquestração e Deploy:**
    * [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) para containerização
    * **Servidor:** [AWS EC2](https://aws.amazon.com/ec2/) com [Caddy](https://caddyserver.com/) (HTTPS automático)

## ⚙️ Configuração e Instalação Local

Para rodar este projeto na sua máquina local, siga os passos abaixo.

### Pré-requisitos
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/en) (versão 24, ver `.nvmrc`)
* [Docker](https://www.docker.com/products/docker-desktop/) e Docker Compose

### Passos
1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Arthur1220/BRCO---SIMPLE.git
    cd BRCO---SIMPLE
    ```

2.  **Configure o Backend:**
    * Navegue até a pasta do backend: `cd backend`
    * Crie um arquivo de ambiente: `cp .env.example .env` (ou crie um `.env` manualmente).
    * Preencha as variáveis de ambiente no arquivo `.env`.
    * Instale as dependências: `npm install`
    * Execute as migrações do Prisma para criar o banco de dados local: `npx prisma migrate dev`
    * Volte para a pasta raiz: `cd ..`

3.  **Configure o Frontend:**
    * Navegue até a pasta do frontend: `cd frontend`
    * Instale as dependências: `npm install` (o frontend não precisa de variáveis de ambiente)
    * Volte para a pasta raiz: `cd ..`

4.  **Inicie a Aplicação com Docker Compose:**
    Na raiz do projeto (onde está o arquivo `docker-compose.yml`), rode o comando:
    ```bash
    docker compose --profile local up --build -d
    ```
    Isso irá construir as imagens e iniciar o backend, o Caddy e o frontend (perfil `local`).
    Sem Docker, rode `npm run dev` no backend e no frontend (o Vite encaminha `/api` para a porta 3000).

5.  **Acesse a Aplicação:**
    * **Frontend:** [http://localhost:8080](http://localhost:8080)
    * **Backend API (via Caddy):** [https://localhost](https://localhost)
    * **Documentação da API (Swagger):** [https://localhost/api-docs](https://localhost/api-docs)
    * **Painel de Admin (Login):** [http://localhost:8080/admin](http://localhost:8080/admin)

## 🧪 Testes

```bash
cd backend
npm test
```

Os testes cobrem as fórmulas (valores de referência em `test/fixtures/golden.json`), o solver de dieta, o CSV, a validação dos alimentos e a autenticação. Ao corrigir uma fórmula de propósito, regenere as referências com `npm run test:update-golden` e revise o diff.

## ☁️ Estratégia de Deploy

* O **Backend** é containerizado com Docker e implantado em uma instância **AWS EC2**, atrás do **Caddy** (HTTPS automático). Só as portas 80 e 443 ficam abertas.
* O **Frontend** é implantado na **Netlify**. O proxy do Netlify (`netlify.toml`) encaminha `/api` para o backend via HTTPS e **assina** cada requisição; o backend recusa o que não vem assinado.
* O painel admin usa login por senha, que gera um token de sessão de 2 horas. Nenhuma chave fica no código do frontend.

Passo a passo completo, variáveis e migração do servidor atual: **[DEPLOY.md](DEPLOY.md)**.

---

Feito com ❤️ por Arthur Azevedo.