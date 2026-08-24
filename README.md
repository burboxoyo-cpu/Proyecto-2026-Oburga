# Focus & Habits 2026 - Web App MVC de Hábitos y Tareas

Una aplicación web moderna, intuitiva y funcional para la gestión y seguimiento de **hábitos diarios** y **tareas con fechas límite y prioridades**, con soporte completo para **checklists de micro-objetivos anidados** 100% editables en tiempo real.

Construida bajo la arquitectura **MVC (Model-View-Controller)** con base de datos **SQLite**, autenticación segura (Login/Registro/Roles) y lista para desplegar en cualquier plataforma de hosting.

---

## 🌟 Características Principales

- **🏛️ Arquitectura MVC Estricta**:
  - **Models**: Acceso a datos y lógica de persistencia con SQLite nativo de alto rendimiento.
  - **Views**: Interfaz moderna, responsiva y fluida construida con plantillas EJS, Tailwind CSS, Lucide Icons y gráficos interactivos con Chart.js.
  - **Controllers**: Lógica de negocio modular, gestión de vistas y endpoints RESTful API para interacción cliente asíncrona (AJAX).
- **📋 Checklists de Micro-Objetivos Anidados**:
  - Tanto los hábitos como las tareas pueden desglosarse en pequeños sub-objetivos.
  - Cada micro-objetivo es **100% editable**: tachar/desmarcar, edición en línea de texto, agregar nuevos pasos y eliminar.
  - Las barras de porcentaje de progreso se recalculan automáticamente en vivo.
- **🔥 Registro y Rachas de Hábitos (Streaks)**:
  - Frecuencias configurables (diario, días laborables, fines de semana, semanal).
  - Cálculo de racha actual (*current streak*) y récord histórico (*longest streak*).
  - Selector visual interactivo de los últimos 7 días.
- **⚡ Tablero Kanban y Prioridades de Tareas**:
  - Clasificación por prioridades (🔴 Alta, 🟡 Media, 🟢 Baja).
  - Tablero Kanban organizado por estados: *Pendientes*, *En Progreso* y *Completadas*.
  - Filtros instantáneos por categoría, prioridad y buscador por texto.
- **🔐 Autenticación y Control de Roles**:
  - Sistema de Login y Registro con contraseñas encriptadas con `bcrypt`.
  - Sesiones seguras mediante cookies HTTP-Only y tokens JWT.
  - Estructura preparada para roles (`admin`, `user`) y permisos futuros.
- **📊 Analítica y Estadísticas**:
  - Gráficos interactivos de cumplimiento, distribución por categorías y estados.
  - Tabla de posiciones de constancia y hábitos con mayores rachas.
- **🚀 Lista para Producción / Hosting**:
  - `Dockerfile` multi-stage optimizado sobre Alpine Linux.
  - `docker-compose.yml` con volumen persistente para no perder los datos de SQLite.
  - `Procfile` para plataformas como Render, Railway o Heroku.
  - Endpoint de salud `/api/health`.

---

## 📂 Estructura del Proyecto

```
Proyecto 2026 Oburga/
├── Dockerfile                  # Configuración Docker para despliegue
├── docker-compose.yml          # Despliegue en 1 comando con volumen persistente
├── Procfile                    # Punto de entrada para Render/Railway
├── .env.example                # Plantilla de variables de entorno
├── .gitignore
├── package.json                # Dependencias y scripts
├── README.md                   # Documentación completa
├── data/                       # Almacenamiento de base de datos SQLite (.db)
├── src/
│   ├── app.js                  # Configuración de Express, middlewares y rutas
│   ├── server.js               # Punto de entrada del servidor HTTP
│   ├── config/
│   │   ├── database.js         # Conexión SQLite, esquemas e índices
│   │   └── seed.js             # Sembrado de datos de prueba y usuario demo
│   ├── middleware/
│   │   └── authMiddleware.js   # Verificación de JWT, sesiones y roles
│   ├── models/
│   │   ├── userModel.js        # Modelo de usuarios y roles
│   │   ├── categoryModel.js    # Modelo de categorías
│   │   ├── habitModel.js       # Modelo de hábitos, rachas y logs
│   │   ├── taskModel.js        # Modelo de tareas y filtros
│   │   └── checklistModel.js   # Modelo de micro-objetivos
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── habitController.js
│   │   ├── taskController.js
│   │   ├── checklistController.js
│   │   └── categoryController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── viewRoutes.js
│   │   └── apiRoutes.js
│   └── views/
│       ├── layouts/
│       │   └── main.ejs
│       ├── auth/
│       │   ├── login.ejs
│       │   └── register.ejs
│       ├── pages/
│       │   ├── dashboard.ejs
│       │   ├── habits.ejs
│       │   ├── tasks.ejs
│       │   ├── stats.ejs
│       │   └── error.ejs
│       └── partials/
│           ├── header.ejs
│           ├── sidebar.ejs
│           ├── task_card.ejs
│           └── modals.ejs
└── public/
    ├── css/
    │   └── styles.css          # Estilos personalizados y animaciones
    ├── js/
    │   ├── app.js              # Lógica cliente, reactividad y checklists
    │   └── stats.js            # Gráficos interactivos con Chart.js
    └── favicon.svg             # Favicon de la app
```

---

## 💻 Instalación y Ejecución Local

### 1. Clonar el repositorio y acceder a la carpeta
```bash
cd "Proyecto 2026 Oburga"
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` a partir de `.env.example`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_change_in_production_2026
DB_PATH=./data/habits_tasks.db
```

### 4. Iniciar la aplicación
```bash
npm start
```
O en modo desarrollo con auto-recarga:
```bash
npm run dev
```

Abre tu navegador en: **`http://localhost:3000`**

### 🔑 Credenciales de Prueba (Demo)
- **Correo:** `demo@example.com`
- **Contraseña:** `demo123`
- **Rol:** `admin`

*(También puedes registrar un usuario nuevo desde la pantalla de Registro o usar el botón "Rellenar con Usuario Demo").*

---

## 🌐 Guía de Despliegue / Hosting

### Opción A: Despliegue con Docker Compose (Recomendado para VPS / Servidor Propio)

1. Asegúrate de tener Docker y Docker Compose instalados en tu servidor.
2. Ejecuta en la raíz del proyecto:
```bash
docker-compose up -d --build
```
3. La aplicación estará corriendo en el puerto `3000` con persistencia automática de datos en el volumen `sqlite_data`.

---

### Opción B: Despliegue en Render (Render.com)

1. Crea un nuevo **Web Service** en Render y conecta tu repositorio Git.
2. Configuración:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Agrega las variables de entorno en el panel de Render:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = *(genera una clave secreta aleatoria)*
   - `DB_PATH` = `/var/data/habits_tasks.db`
4. *(Opcional)* Añade un **Persistent Disk** montado en `/var/data` para persistir la base de datos SQLite entre reinicios.

---

### Opción C: Despliegue en Railway (Railway.app)

1. En Railway, selecciona **"Deploy from GitHub repo"**.
2. Railway detectará automáticamente el archivo `Dockerfile` o `Procfile`.
3. Ve a la pestaña **Variables** y agrega:
   - `JWT_SECRET` = *(clave secreta)*
   - `NODE_ENV` = `production`
4. Añade un volumen persistente montado en `/app/data` desde la configuración de Railway.

---

### Opción D: Despliegue en Fly.io

1. Instala `flyctl` y ejecuta:
```bash
fly launch
fly volumes create sqlite_data --size 1
```
2. Monta el volumen en `fly.toml`:
```toml
[mounts]
  source = "sqlite_data"
  destination = "/app/data"
```
3. Despliega con:
```bash
fly deploy
```

---

## 🛠️ API REST Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/health` | Healthcheck para balanceadores y hosting |
| `GET` | `/api/me` | Perfil del usuario actual |
| `GET` | `/api/stats` | Datos estadísticos para gráficos |
| `GET` | `/api/habits` | Listar hábitos del usuario |
| `POST` | `/api/habits` | Crear hábito con micro-objetivos |
| `PUT` | `/api/habits/:id` | Actualizar hábito |
| `DELETE` | `/api/habits/:id` | Eliminar hábito |
| `POST` | `/api/habits/:id/toggle` | Registrar / desmarcar cumplimiento diario |
| `GET` | `/api/tasks` | Listar tareas con filtros |
| `POST` | `/api/tasks` | Crear tarea con micro-objetivos |
| `PUT` | `/api/tasks/:id` | Actualizar tarea |
| `PATCH` | `/api/tasks/:id/status` | Cambiar estado de tarea |
| `DELETE` | `/api/tasks/:id` | Eliminar tarea |
| `POST` | `/api/checklists` | Añadir micro-objetivo |
| `PUT` | `/api/checklists/:id` | Editar título de micro-objetivo |
| `PATCH` | `/api/checklists/:id/toggle` | Tachar / desmarcar micro-objetivo |
| `DELETE` | `/api/checklists/:id` | Eliminar micro-objetivo |
| `GET` | `/api/categories` | Listar categorías del usuario |
| `POST` | `/api/categories` | Crear nueva categoría |

---

## 📜 Licencia

Proyecto desarrollado bajo licencia MIT. Listo para uso personal, comercial o institucional.
