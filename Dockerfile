# Usar imagen base de Node.js
FROM node:20-alpine AS base

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat curl

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm install
# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Etapa de desarrollo
FROM base AS development

RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]