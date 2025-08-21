// backend/routes/workstations.js
import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

/**
 * GET /api/v1/workstations
 * Возвращает список активных и свободных кассовых мест
 * + Сбрасывает cashier_id, если last_activity > 5 минут
 */
router.get('/workstations', async (req, res) => {
  try {
    // Автоматическое освобождение "залипших" мест (неактивных > 5 мин)
	await pool.query(`
	  UPDATE workstations 
	  SET cashier_id = NULL 
	  WHERE cashier_id IS NOT NULL 
		AND (
		  last_activity IS NULL OR 
		  last_activity < NOW() - INTERVAL '5 minutes'
		)
	`);

    const result = await pool.query(`
      SELECT 
        ws.ws_id,
        ws.name,
        k.logical_name AS kkt_name,
        k.status AS kkt_status,
        p.logical_name AS pinpad_name,
        p.status AS pinpad_status,
        p.bank_name,
        ws.is_active
      FROM workstations ws
      JOIN kkt_devices k ON ws.kkt_id = k.kkt_id
      JOIN pinpads p ON ws.pinpad_id = p.pinpad_id
      WHERE ws.is_active = true 
        AND ws.cashier_id IS NULL
      ORDER BY ws.name
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки кассовых мест' });
  }
});

/**
 * PUT /api/v1/workstations/:id/assign
 * Привязывает кассира к месту
 */
router.put('/workstations/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { cashier_id } = req.body;

  if (!cashier_id) {
    return res.status(400).json({ error: 'cashier_id обязателен' });
  }

  try {
    const result = await pool.query(
      `UPDATE workstations 
       SET cashier_id = $1, last_activity = NOW()
       WHERE ws_id = $2 AND cashier_id IS NULL
       RETURNING *`,
      [cashier_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Место недоступно' });
    }

    res.json({ success: true, workstation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при привязке' });
  }
});

/**
 * PUT /api/v1/workstations/:id/unassign
 * Отвязывает кассира от кассового места
 */
router.put('/workstations/:id/unassign', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE workstations 
       SET cashier_id = NULL 
       WHERE ws_id = $1 AND cashier_id IS NOT NULL
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Место уже свободно или не существует' });
    }

    res.json({ success: true, workstation: result.rows[0] });
  } catch (err) {
    console.error('Ошибка при отвязке кассира:', err);
    res.status(500).json({ error: 'Ошибка при отвязке от кассового места' });
  }
});

/**
 * GET /api/v1/workstations/:id
 * Возвращает детальную информацию о месте
 */
router.get('/workstations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        ws.ws_id, ws.name, ws.cashier_id, ws.last_activity,
        k.logical_name AS kkt_name, k.status AS kkt_status,
        p.logical_name AS pinpad_name, p.bank_name, p.status AS pinpad_status
      FROM workstations ws
      JOIN kkt_devices k ON ws.kkt_id = k.kkt_id
      JOIN pinpads p ON ws.pinpad_id = p.pinpad_id
      WHERE ws.ws_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Место не найдено' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки места' });
  }
});

/**
 * GET /api/v1/workstations/by-cashier/:cashierId
 * Проверяет, занято ли место кассиром
 */
router.get('/workstations/by-cashier/:cashierId', async (req, res) => {
  const { cashierId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        ws.ws_id, ws.name,
        k.logical_name AS kkt_name, k.status AS kkt_status,
        p.logical_name AS pinpad_name, p.bank_name
      FROM workstations ws
      JOIN kkt_devices k ON ws.kkt_id = k.kkt_id
      JOIN pinpads p ON ws.pinpad_id = p.pinpad_id
      WHERE ws.cashier_id = $1`,
      [cashierId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Место не занято' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки места' });
  }
});

/**
 * POST /api/v1/workstations/ping
 * Обновляет last_activity для текущего кассира
 */
router.post('/workstations/ping', async (req, res) => {
  const user = req.user; // из JWT
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const result = await pool.query(
      `UPDATE workstations 
       SET last_activity = NOW() 
       WHERE cashier_id = $1
       RETURNING ws_id`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Кассир не привязан к месту' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления активности' });
  }
});

export default router;