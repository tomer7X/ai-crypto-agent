import pkg from 'pg';
const { Pool } = pkg;

export const getPool = () => new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default getPool;