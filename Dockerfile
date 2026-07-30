
# Configuración global para habilitar pnpm via Corepack en Alpine
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


RUN corepack enable && corepack prepare pnpm@9 --activate

# ============================================
# Stage 1: Dependencies
# ============================================
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de pnpm para cachear dependencias
COPY package.json pnpm-lock.yaml* ./

# Instalar dependencias de producción usando caché montado
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    if [ -f pnpm-lock.yaml ]; then \
        pnpm i --frozen-lockfile --prod --ignore-scripts; \
    else \
        pnpm install --prod --ignore-scripts; \
    fi

# ============================================
# Stage 2: Builder
# ============================================
FROM base AS builder

WORKDIR /app

# Copiar archivos de pnpm
COPY package.json pnpm-lock.yaml* ./

# Instalar TODAS las dependencias (necesarias para build) usando el mismo caché
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    if [ -f pnpm-lock.yaml ]; then \
        pnpm i --frozen-lockfile; \
    else \
        pnpm install; \
    fi

# Copiar archivos de configuración
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copiar configuración de app
COPY config ./config

# Copiar código fuente
COPY src ./src

# Build de la aplicación
RUN pnpm run build

# ============================================
# Stage 3: Runner con Vault Integration
# ============================================
FROM node:20-alpine AS runner

# Instalar dependencias + Vault tools
RUN apk add --no-cache \
    libc6-compat \
    curl \
    jq \
    bash \
    dumb-init

# Crear usuario no-root
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nestjs

WORKDIR /app

# Copiar node_modules de producción
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar build compilado
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copiar package.json
COPY --chown=nestjs:nodejs package.json ./

# Copiar configuración (si existe)
COPY --chown=nestjs:nodejs config ./config

# ============================================
# VAULT INTEGRATION
# ============================================

# Copiar entrypoint Vault (antes de cambiar a nestjs)
COPY entrypoint-with-vault.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown nestjs:nodejs /entrypoint.sh

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# ============================================
# ENTRYPOINT CON VAULT
# ============================================
# El entrypoint carga secrets de Vault antes de iniciar la app
ENTRYPOINT ["/entrypoint.sh"]

# Comando original (ejecutado por entrypoint)
CMD ["dumb-init", "--", "node", "dist/src/main.js"]
