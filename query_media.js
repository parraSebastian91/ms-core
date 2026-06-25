const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  schema: process.env.DATABASE_SCHEMA,
});
pool.query(`
  SELECT ma.id,
    SUBSTRING(ma.storage_key, 1, 90) AS storage_key,
    ma.original_name,
    ma.category,
    ma.status,
    SUBSTRING(COALESCE(mv.url_path,'NULL'), 1, 90) AS url_path
  FROM media.media_assets ma
  LEFT JOIN media.media_variants mv ON mv.asset_id = ma.id
  WHERE ma.category IN ('DTE-factura-respaldo','DTE-factura')
  ORDER BY ma.created_at DESC LIMIT 8
`).then(r => { r.rows.forEach(row => console.log(JSON.stringify(row))); process.exit(0); })
.catch(e => { console.error('ERROR:', e.message); process.exit(1); });
