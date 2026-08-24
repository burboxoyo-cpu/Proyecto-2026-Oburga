import app from './app.js';
import { initDatabase } from './config/database.js';
import { seedDatabase } from './config/seed.js';

const PORT = process.env.PORT || 3000;

// Inicializar base de datos SQLite y sembrar datos de ejemplo
try {
  initDatabase();
  seedDatabase();
} catch (err) {
  console.error('❌ Error al inicializar SQLite:', err);
}

// Iniciar servidor HTTP
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor Web App MVC iniciado con éxito`);
  console.log(`📡 URL Local:        http://localhost:${PORT}`);
  console.log(`📡 Healthcheck:      http://localhost:${PORT}/api/health`);
  console.log(`🔑 Usuario Demo:     demo@example.com (pass: demo123)`);
  console.log(`🗄️  Base de Datos:    SQLite activo`);
  console.log(`====================================================`);
});
