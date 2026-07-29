
export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    ttlGetObject: parseInt(process.env.TTL_GET_OBJECT ?? '300', 10) || 300, // seconds — matches orchestrator PresignedGetObject TTL (5 min). Angular multiplies by 1000 on its side.
 },
  database: {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    schema: process.env.DATABASE_SCHEMA,
    ssl: process.env.DATABASE_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    ttl: parseInt(process.env.REDIS_TTL, 10) * 1000 || 3600 * 1000, // 1 hora por defecto
  },
  vault: {
    addr: process.env.VAULT_ADDR || 'http://vault:8200',
    token: process.env.VAULT_TOKEN || 'myroot',
  },
  jwtConfig: {
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    access_secret: process.env.JWT_ACCESS_SECRET,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
    admin_expires_in: process.env.JWT_ACCESS_ADMIN_EXPIRES_IN,
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST,
    port: parseInt(process.env.RABBITMQ_PORT, 10) || 5672,
    user: process.env.RABBITMQ_USER ,
    pass: process.env.RABBITMQ_PASS,
    queue: process.env.RABBITMQ_QUEUE || 'notify_queue',
    exchange: process.env.RABBITMQ_EXCHANGE || 'storage_notifications_exchange',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'dte.process.notification',
    routingKeyFail: process.env.RABBITMQ_ROUTING_KEY_FAIL || 'external',
  },
  externalServices: {
    core: {
      baseUrl: process.env.CORE_SERVICE_BASE_URL,
      timeout: parseInt(process.env.CORE_SERVICE_TIMEOUT ?? '8000', 10),
    },
    storage: {
      baseUrl: process.env.STORAGE_SERVICE_BASE_URL,
      timeout: parseInt(process.env.STORAGE_SERVICE_TIMEOUT ?? '8000', 10),
    },
  },
});