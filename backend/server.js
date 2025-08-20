// backend/server.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js'; 
import workstationsRoutes from './routes/workstations.js';
import customerRoutes from './routes/customers.js';
import checksRoutes from './routes/checks.js'; 
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', workstationsRoutes);
app.use('/api/v1', customerRoutes);
app.use('/api/v1', checksRoutes);
// Защита других маршрутов будет добавлена позже

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'cashier-backend' });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});