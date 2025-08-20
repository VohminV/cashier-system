// backend/routes/auth.js
import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/db.js'; // ✅ Импорт пула из db.js

const router = Router();

router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  try {
    const result = await pool.query(
      `SELECT cashier_id, login, full_name, role, password_hash 
       FROM cashiers 
       WHERE login = $1`,
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    const token = jwt.sign(
      { id: user.cashier_id, login: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      user: {
        cashier_id: user.cashier_id,
        login: user.login,
        full_name: user.full_name,
        role: user.role
      },
      token
    });

  } catch (err) {
    console.error('Ошибка авторизации:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;