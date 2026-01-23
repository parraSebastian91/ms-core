import { registerAs } from "@nestjs/config";


export default registerAs('database', () => ({
   type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USER || 'desarrollo',
    password: process.env.DATABASE_PASSWORD || '071127',
    database: process.env.DATABASE_NAME || 'core_erp',
    schema: process.env.DATABASE_SCHEMA || 'core',
    synchronize: true,
}));