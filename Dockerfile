# 1. Imagen base: Usamos la versión 'slim' para reducir el peso y mejorar la seguridad
FROM node:24-slim

# 2. Crear y definir el directorio de trabajo
WORKDIR /app

# 3. Copiar package.json y package-lock.json primero
# Esto permite que Docker cachee las dependencias si estos archivos no cambian
COPY package*.json ./

# 4. Instalar solo dependencias de producción
# Omitimos herramientas de desarrollo como nodemon o jest para una imagen más ligera
RUN npm install --omit=dev

# 5. Copiar el resto del código de la aplicación
COPY . .

# 6. Exponer el puerto en el que corre tu app
# Render asignará su propio puerto, pero esto sirve como documentación y puente
EXPOSE 3000

# 7. Comando de arranque
# Asegúrate de tener definido un script "start" en tu package.json (ej: "node src/server.js")
CMD ["npm", "start"]