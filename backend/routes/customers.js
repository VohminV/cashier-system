// backend/routes/customers.js
import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

/**
 * GET /api/v1/customers/search?q=...
 * Поиск абонентов по ФИО, адресу или лицевому счёту
 */
router.get('/customers/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Параметр "q" обязателен и должен быть не короче 2 символов' });
  }

  try {
    const query = `
      SELECT 
        customer_id AS id,
        full_name,
        account_number,
        address,
        phone
      FROM customers 
      WHERE 
        full_name ILIKE $1 OR
        account_number ILIKE $1 OR
        address ILIKE $1
      ORDER BY 
        SIMILARITY(full_name, $2) DESC,
        SIMILARITY(address, $2) DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [`%${q.trim()}%`, q.trim()]);

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка поиска абонентов:', err);
    res.status(500).json({ error: 'Ошибка сервера при поиске абонентов' });
  }
});

export default router;