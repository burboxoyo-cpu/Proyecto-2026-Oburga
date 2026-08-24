import app from '../src/app.js';
import { initDatabase } from '../src/config/database.js';
import { seedDatabase } from '../src/config/seed.js';

initDatabase();
seedDatabase();

const server = app.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🌐 Servidor de pruebas iniciado en ${baseUrl}\n`);

  let passed = 0;
  let total = 0;

  function check(cond, msg) {
    total++;
    if (cond) {
      console.log(`  ✅ [HTTP PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [HTTP FAIL] ${msg}`);
    }
  }

  try {
    // 1. Healthcheck
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    check(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health responde 200 OK y status "ok"');

    // 2. Login Page
    const loginPageRes = await fetch(`${baseUrl}/login`);
    check(loginPageRes.status === 200, 'GET /login responde 200 OK');

    // 3. Login POST
    const loginPostRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'demo123' })
    });
    const loginJson = await loginPostRes.json();
    const setCookie = loginPostRes.headers.get('set-cookie');
    check(loginPostRes.status === 200 && loginJson.success === true, 'POST /login valida credenciales correctamente');
    check(setCookie && setCookie.includes('token='), 'POST /login genera cookie de sesión segura');

    const tokenCookie = setCookie ? setCookie.split(';')[0] : '';

    // 4. Dashboard View
    const dashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Cookie': tokenCookie }
    });
    check(dashRes.status === 200, 'GET /dashboard responde 200 OK con sesión');

    // 5. Habits View
    const habitsRes = await fetch(`${baseUrl}/habits`, {
      headers: { 'Cookie': tokenCookie }
    });
    check(habitsRes.status === 200, 'GET /habits responde 200 OK con sesión');

    // 6. Tasks View
    const tasksRes = await fetch(`${baseUrl}/tasks`, {
      headers: { 'Cookie': tokenCookie }
    });
    check(tasksRes.status === 200, 'GET /tasks responde 200 OK con sesión');

    // 7. Stats API
    const statsApiRes = await fetch(`${baseUrl}/api/stats`, {
      headers: { 'Cookie': tokenCookie }
    });
    const statsData = await statsApiRes.json();
    check(statsApiRes.status === 200 && statsData.success === true, 'GET /api/stats retorna métricas JSON estructuradas');

    console.log(`\n🎉 Pruebas HTTP Completadas: ${passed}/${total} exitosas.\n`);
  } catch (err) {
    console.error('Error durante pruebas HTTP:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
