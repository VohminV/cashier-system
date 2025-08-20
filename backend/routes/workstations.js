// backend/routes/workstations.js
import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

/**
 * GET /api/v1/workstations
 * Возвращает список активных и свободных кассовых мест
 */
router.get('/workstations', async (req, res) => {
  try {
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

  try {
    const result = await pool.query(
      `UPDATE workstations 
       SET cashier_id = $1 
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

router.get('/workstations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        ws.ws_id, ws.name, ws.cashier_id,
        k.logical_name AS kkt_name,
        p.logical_name AS pinpad_name
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

export default router;