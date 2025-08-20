// backend/services/authService.js
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;

export const login = async (login, password) => {
  const result = await pool.query(
    `SELECT cashier_id, login, full_name, role, password_hash 
     FROM cashiers 
     WHERE login = $1`,
    [login]
  );

  if (result.rows.length === 0) {
    throw new Error('Пользователь не найден');
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Неверный пароль');
  }

  // Генерация JWT
  const token = jwt.sign(
    { id: user.cashier_id, login: user.login, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  return {
    user: {
      cashier_id: user.cashier_id,
      login: user.login,
      full_name: user.full_name,
      role: user.role
    },
    token
  };
};