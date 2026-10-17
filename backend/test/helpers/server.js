const { execSync } = require('child_process');
const path = require('path');

/**
 * Cria o schema no banco temporário (prisma migrate deploy).
 */
function migrateTestDb() {
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..', '..'),
    env: process.env,
    stdio: 'ignore',
  });
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

  return { request, close: () => new Promise((resolve) => server.close(resolve)) };
}

module.exports = { migrateTestDb, startServer };
