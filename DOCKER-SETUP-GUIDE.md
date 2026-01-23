# Configuración para Contenedores Separados

## Pasos para configurar la comunicación entre contenedores:

### 1. Crear la red compartida
```bash
docker network create erp-shared
```

### 2. Verificar que existe la red
```bash
docker network ls
# Deberías ver "erp-shared" en la lista
```

### 3. Conectar tus contenedores existentes a la red

#### Para PostgreSQL:
```bash
# Si ya tienes el contenedor corriendo
docker network connect erp-shared postgres-erp

# O al iniciar el contenedor
docker run -d --name postgres-erp --network erp-shared postgres:15
```

#### Para Redis:
```bash
# Si ya tienes el contenedor corriendo
docker network connect erp-shared redis-erp

# O al iniciar el contenedor
docker run -d --name redis-erp --network erp-shared redis:7
```

### 4. Modificar tu docker-compose de PostgreSQL/Redis

Si usas docker-compose para PostgreSQL/Redis, agrégales la red:

```yaml
# En tu docker-compose.yml de PostgreSQL/Redis
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: postgres-erp  # IMPORTANTE: Este nombre debe coincidir
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: desarrollo
      POSTGRES_PASSWORD: 071127
    networks:
      - erp-shared

  redis:
    image: redis:7
    container_name: redis-erp     # IMPORTANTE: Este nombre debe coincidir
    networks:
      - erp-shared

networks:
  erp-shared:
    external: true
```

### 5. Ejecutar tu aplicación NestJS
```bash
# En tu proyecto NestJS
docker-compose up --build
```

## Verificación de conectividad

### Verificar que los contenedores están en la misma red:
```bash
docker network inspect erp-shared
```

### Probar conectividad desde el contenedor NestJS:
```bash
# Acceder al contenedor
docker exec -it nestjs-erp-core sh

# Probar ping a PostgreSQL
ping postgres-erp

# Probar ping a Redis
ping redis-erp

# Probar conexión PostgreSQL
telnet postgres-erp 5432

# Probar conexión Redis
telnet redis-erp 6379
```

## Resolución de problemas

### Si no puede conectarse:

1. **Verificar nombres de contenedores:**
   ```bash
   docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
   ```

2. **Verificar que están en la misma red:**
   ```bash
   docker network inspect erp-shared
   ```

3. **Actualizar variables de entorno si los nombres son diferentes:**
   ```bash
   # Si tu contenedor PostgreSQL se llama diferente
   DATABASE_HOST=mi-postgres-container

   # Si tu contenedor Redis se llama diferente  
   REDIS_HOST=mi-redis-container
   ```

## Comandos útiles

### Iniciar todo el stack:
```bash
# 1. Crear red (solo una vez)
docker network create erp-shared

# 2. Iniciar PostgreSQL/Redis (en su proyecto)
docker-compose up -d

# 3. Iniciar NestJS (en este proyecto)
docker-compose up --build
```

### Ver logs de todos los servicios:
```bash
docker logs postgres-erp
docker logs redis-erp
docker logs nestjs-erp-core
```

### Parar todo:
```bash
# Parar NestJS
docker-compose down

# Parar PostgreSQL/Redis (en su proyecto)
docker-compose down

# Opcional: Eliminar la red
docker network rm erp-shared
```