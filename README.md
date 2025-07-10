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
    * **Banco de Dados:** [SQLite](https://www.sqlite.org/index.html) (para desenvolvimento)
    * **Geração de CSV:** [json2csv](https://www.npmjs.com/package/json2csv)
* **Orquestração e Deploy:**
    * [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) para containerização
    * **Servidor:** [AWS EC2](https://aws.amazon.com/ec2/)

## ⚙️ Configuração e Instalação Local

Para rodar este projeto na sua máquina local, siga os passos abaixo.

### Pré-requisitos
* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/en) (versão 18 ou superior)
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
    * Crie um arquivo de ambiente local: `cp .env.local.example .env.local` (ou crie-o manualmente).
    * Preencha as variáveis de ambiente no arquivo `.env.local`.
    * Instale as dependências: `npm install`
    * Volte para a pasta raiz: `cd ..`

4.  **Inicie a Aplicação com Docker Compose:**
    Na raiz do projeto (onde está o arquivo `docker-compose.yml`), rode o comando:
    ```bash
    docker-compose up --build -d
    ```
    Isso irá construir as imagens e iniciar os containers do frontend e do backend.

5.  **Acesse a Aplicação:**
    * **Frontend:** [http://localhost:8080](http://localhost:8080)
    * **Backend API:** [http://localhost:3000](http://localhost:3000)
    * **Documentação da API (Swagger):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
    * **Painel de Admin (Login):** [http://localhost:8080/admin-login](http://localhost:8080/admin-login)

## ☁️ Estratégia de Deploy

* O **Backend** é containerizado com Docker e implantado em uma instância **AWS EC2**. A segurança é gerenciada por chaves de API e um Security Group na AWS.
* O **Frontend** é implantado na **Netlify**, que se conecta ao backend na AWS. Um proxy do Netlify (`netlify.toml`) é usado para resolver o problema de "Mixed Content" (HTTPS -> HTTP).

---

Feito com ❤️ por Arthur Azevedo.