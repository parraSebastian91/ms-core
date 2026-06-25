const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
ds.initialize().then(async () => {
  const rows = await ds.query(`
    SELECT ma.id, SUBSTRING(ma.storage_key,1,90) sk, ma.original_name, ma.category, ma.status,
           SUBSTRING(COALESCE(mv.url_path,'---'),1,90) url_path
    FROM media.media_assets ma
    LEFT JOIN media.media_variants mv ON mv.asset_id = ma.id
    WHERE ma.category IN ('DTE-factura-respaldo','DTE-factura')
    ORDER BY ma.created_at DESC LIMIT 8
  `);
  rows.forEach(r => console.log(JSON.stringify(r)));
  await ds.destroy();
}).catch(e => console.error('ERR', e.message));
