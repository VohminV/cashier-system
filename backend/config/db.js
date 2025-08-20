// backend/config/db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Загружаем .env в этом файле
dotenv.config();


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

export default pool;