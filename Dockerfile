# ==========================================
# Dockerfile - Web App MVC Hábitos y Tareas
# Node.js 24 Alpine (Ligero y Seguro)
# ==========================================

FROM node:24-alpine AS runner

WORKDIR /app

# Establecer entorno de producción
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/habits_tasks.db

# Copiar manifiesto de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar el código fuente de la aplicación
COPY . .

# Crear directorio para la base de datos persistente SQLite
RUN mkdir -p /app/data && chown -R node:node /app

# Usar usuario no root por seguridad
USER node

# Puerto expuesto por la app
EXPOSE 3000

# Volumen persistente para almacenar SQLite
VOLUME ["/app/data"]

# Healthcheck para servicios cloud y orquestadores
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicio del servidor
CMD ["node", "src/server.js"]
