const http = require('http');
const { createTables } = require('../../lib/tables');

/**
 * Cria as tabelas deste arquivo de teste no DynamoDB Local.
 */
async function setupTestTables() {
  await createTables();
}

/**
 * Sobe a aplicação em uma porta aleatória e devolve um helper de requisição.
 */
async function startServer() {
  const { createApp } = require('../../app');
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, url, { body, headers = {} } = {}) {
    const res = await fetch(baseUrl + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return { status: res.status, body: json, text, headers: res.headers };
  }

  /**
   * GET com node:http (o fetch do Node envia Cache-Control: no-cache junto com
   * If-None-Match, o que impede testar o 304 como um navegador faria).
   */
  function rawGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
      http.get(baseUrl + url, { headers }, (res) => {
        let text = '';
        res.on('data', (chunk) => { text += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, text, headers: res.headers }));
      }).on('error', reject);
    });
  }

  return { baseUrl, request, rawGet, close: () => new Promise((resolve) => server.close(resolve)) };
}

module.exports = { setupTestTables, startServer };
