const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA,
  ssl: { rejectUnauthorized: false },
});
ds.initialize().then(async () => {
  // Fix all url_paths that have spaces (worker sanitizes to _ but DB kept the original)
  const result = await ds.query(`
    UPDATE media.media_variants
    SET url_path = REPLACE(url_path, ' ', '_')
    WHERE url_path LIKE '% %'
    RETURNING id, url_path
  `);
  console.log('Fixed rows:', result.length);
  result.forEach(r => console.log(' ->', r.url_path));
  await ds.destroy();
}).catch(e => console.error('ERR', e.message, e.stack));
