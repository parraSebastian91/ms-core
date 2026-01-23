# Docker Commands Guide

## Build and Run with Docker Compose

### Development
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f nestjs-app

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production
```bash
# Use production environment file
docker-compose --env-file .env.docker up -d --build
```

## Individual Docker Commands

### Build the NestJS app image
```bash
docker build -t nestjs-erp-core .
```

### Run the app container
```bash
docker run -p 3001:3001 --name nestjs-app nestjs-erp-core
```

## Database Setup

### Run only database services
```bash
docker-compose up postgres redis -d
```

### Access PostgreSQL
```bash
docker exec -it postgres-erp psql -U desarrollo -d postgres
```

### Access Redis
```bash
docker exec -it redis-erp redis-cli
```

## Useful Commands

### View running containers
```bash
docker ps
```

### View logs
```bash
docker logs nestjs-erp-core
docker-compose logs nestjs-app
```

### Shell into container
```bash
docker exec -it nestjs-erp-core sh
```

### Remove all containers and images
```bash
docker-compose down --rmi all -v
```

## Environment Variables

The application uses these environment variables:
- `NODE_ENV`: Environment (development/production)
- `PORT`: Application port (default: 3001)
- `DATABASE_HOST`: PostgreSQL host
- `DATABASE_PORT`: PostgreSQL port
- `DATABASE_USER`: Database username
- `DATABASE_PASSWORD`: Database password
- `DATABASE_NAME`: Database name
- `DATABASE_SCHEMA`: Database schema
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `JWT_SECRET`: JWT secret key

## Health Checks

### Check if services are running
```bash
curl http://localhost:3001/health
```

### Check database connection
```bash
docker-compose exec postgres pg_isready -U desarrollo
```

### Check Redis connection
```bash
docker-compose exec redis redis-cli ping
```