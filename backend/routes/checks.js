// backend/routes/checks.js
import { Router } from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/v1/checks
 * Создаёт новый чек со статусом 'pending'
 * Возвращает check_id
 */
router.post('/checks', async (req, res) => {
  const { ws_id, payment_type, positions, total_amount } = req.body;
  const user = req.user; // из JWT middleware

  // Валидация
  if (!ws_id || !payment_type || !Array.isArray(positions) || !total_amount) {
    return res.status(400).json({ error: 'Все поля обязательны: ws_id, payment_type, positions, total_amount' });
  }

  try {
    // Начинаем транзакцию
    await pool.query('BEGIN');

    // 1. Создаём чек
    const checkResult = await pool.query(
      `INSERT INTO checks 
       (cashier_id, ws_id, positions, total_amount, payment_type, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) 
       RETURNING check_id`,
      [user.id, ws_id, JSON.stringify(positions), total_amount, payment_type]
    );

    const checkId = checkResult.rows[0].check_id;

    // 2. Определяем target_id (kkt_id или pinpad_id)
    const wsResult = await pool.query(
      `SELECT kkt_id, pinpad_id FROM workstations WHERE ws_id = $1`,
      [ws_id]
    );

    if (wsResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Кассовое место не найдено' });
    }

    const { kkt_id, pinpad_id } = wsResult.rows[0];

    // 3. Создаём фоновую задачу
    if (payment_type === 'cash') {
      // Наличные: сразу отправляем в ККТ
      await pool.query(
        `INSERT INTO background_tasks 
         (task_type, target_id, payload, status, created_at, related_check_id) 
         VALUES ('send_to_kkt', $1, $2, 'pending', NOW(), $3)`,
        [kkt_id, JSON.stringify({ check_id: checkId, amount: total_amount }), checkId]
      );
    } else if (payment_type === 'card') {
      // Безналичные: сначала оплата
      await pool.query(
        `INSERT INTO background_tasks 
         (task_type, target_id, payload, status, created_at, related_check_id) 
         VALUES ('process_payment', $1, $2, 'pending', NOW(), $3)`,
        [pinpad_id, JSON.stringify({ check_id: checkId, amount: total_amount }), checkId]
      );
    }

    await pool.query('COMMIT');

    // ✅ Успешный ответ
    res.status(201).json({
      check_id: checkId,
      status: 'pending',
      message: 'Чек создан, обработка в фоне'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Ошибка создания чека:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании чека' });
  }
});

export default router;