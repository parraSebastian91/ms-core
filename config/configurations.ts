
export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    ttlAuthCode: parseInt(process.env.TTL_AUTH_CODE ?? '60', 10) * 1000 || 60 * 1000, // 1 minutos por defecto
    ttlGetObject: parseInt(process.env.TTL_GET_OBJECT ?? '60', 10) * 1000 || 60 * 1000, // 1 minutos por defecto
    ttlSession: parseInt(process.env.TTL_SESSION ?? '3600', 10) * 1000 || 3600 * 1000, // 1 hora por defecto
    ttlRefreshSession: parseInt(process.env.TTL_REFRESH_SESSION ?? '86400', 10) * 1000 || 86400 * 1000, // 1 día por defecto
  },
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    schema: process.env.DATABASE_SCHEMA,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
    ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10) * 1000 || 3600 * 1000, // 1 hora por defecto
  },
  vault: {
    addr: process.env.VAULT_ADDR || 'http://vault:8200',
    token: process.env.VAULT_TOKEN || 'myroot',
  },
  jwtConfig: {
    refresh_secret: process.env.JWT_REFRESH_SECRET || 'jwt_refresh_secret',
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '86400',
    access_secret: process.env.JWT_ACCESS_SECRET || 'jwt_access_secret',
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '3600',
    admin_expires_in: process.env.JWT_ACCESS_ADMIN_EXPIRES_IN || '7200',
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'rabbitmq',
    port: parseInt(process.env.RABBITMQ_PORT ?? '5672', 10) || 5672,
    user: process.env.RABBITMQ_USER || 'core',
    pass: process.env.RABBITMQ_PASS || 'core-123',
    queue: process.env.RABBITMQ_QUEUE || 'notify_queue',
    exchange: process.env.RABBITMQ_EXCHANGE || 'storage_notifications_exchange',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'dte.process.notification',
    routingKeyFail: process.env.RABBITMQ_ROUTING_KEY_FAIL || 'dte.process.notification.fail',
  },
  externalServices: {
    core: {
      baseUrl: process.env.CORE_SERVICE_BASE_URL || 'http://ms_core:3001',
      timeout: parseInt(process.env.CORE_SERVICE_TIMEOUT ?? '8000', 10),
    },
    storage: {
      baseUrl: process.env.STORAGE_SERVICE_URL || 'http://ms-storage-service:3100',
      timeout: parseInt(process.env.STORAGE_SERVICE_TIMEOUT ?? '8000', 10),
    }
  }
});

