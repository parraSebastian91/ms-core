# Conexión a Servicios Externos desde Docker

## Configuración Actual
El contenedor NestJS está configurado para conectarse a PostgreSQL y Redis externos usando `host.docker.internal`.

## Escenarios de Conexión

### 1. Servicios en la misma máquina (Host Local)
```yaml
environment:
  DATABASE_HOST: host.docker.internal
  REDIS_HOST: host.docker.internal
```

### 2. Servicios en otra máquina/servidor
```yaml
environment:
  DATABASE_HOST: 192.168.1.100  # IP del servidor PostgreSQL
  REDIS_HOST: 192.168.1.101     # IP del servidor Redis
```

### 3. Servicios en otros contenedores Docker (misma red)
```yaml
environment:
  DATABASE_HOST: postgres-container-name
  REDIS_HOST: redis-container-name
networks:
  - external-network  # Red compartida
```

## Para que los servicios puedan conversar necesitas:

### 1. **Conectividad de Red**
```bash
# Si están en la misma máquina
# Los servicios deben estar expuestos en los puertos correctos:
# PostgreSQL: puerto 5432
# Redis: puerto 6379
```

### 2. **Red Docker Compartida** (si están en contenedores)
```yaml
# En el docker-compose.yml de PostgreSQL/Redis
networks:
  erp-shared:
    external: true

# En tu docker-compose.yml de NestJS
networks:
  erp-shared:
    external: true

services:
  nestjs-app:
    networks:
      - erp-shared
```

### 3. **Crear red compartida**
```bash
# Crear la red externa
docker network create erp-shared

# En el proyecto de PostgreSQL/Redis
docker-compose --network=erp-shared up

# En tu proyecto NestJS
docker-compose up
```

### 4. **Variables de entorno para diferentes entornos**

#### Desarrollo local (servicios en host)
```bash
export DATABASE_HOST=localhost
export REDIS_HOST=localhost
```

#### Docker con servicios externos
```bash
export DATABASE_HOST=host.docker.internal
export REDIS_HOST=host.docker.internal
```

#### Producción (servicios remotos)
```bash
export DATABASE_HOST=db.empresa.com
export REDIS_HOST=cache.empresa.com
```

## Comandos para ejecutar

### Solo el contenedor NestJS
```bash
docker-compose up --build
```

### Con variables de entorno específicas
```bash
# Usar archivo de entorno personalizado
docker-compose --env-file .env.docker up --build

# O sobrescribir variables específicas
DATABASE_HOST=192.168.1.100 REDIS_HOST=192.168.1.101 docker-compose up
```

### Verificar conectividad
```bash
# Desde dentro del contenedor
docker exec -it nestjs-erp-core sh
ping host.docker.internal
telnet host.docker.internal 5432
telnet host.docker.internal 6379
```

## Configuración de Firewall/Seguridad

Si los servicios están en servidores diferentes, asegúrate de:

1. **PostgreSQL**: Permitir conexiones desde la IP del contenedor
   ```sql
   # En postgresql.conf
   listen_addresses = '*'
   
   # En pg_hba.conf
   host all all 172.17.0.0/16 md5  # Red Docker por defecto
   ```

2. **Redis**: Configurar bind y protected-mode
   ```conf
   # En redis.conf
   bind 0.0.0.0
   protected-mode no  # O configurar autenticación
   ```

3. **Firewall**: Abrir puertos 5432 (PostgreSQL) y 6379 (Redis)

## Prueba de Conexión

```bash
# Construir y ejecutar
docker-compose up --build

# Verificar logs
docker-compose logs -f nestjs-app

# Debe mostrar conexión exitosa a PostgreSQL y Redis
```