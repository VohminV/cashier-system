// frontend/src/components/CashierScreen.tsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Alert,
} from '@mui/material';
import { searchCustomers, Customer } from '../services/customerService';
import { createCheck } from '../services/checkService';
import CustomerSearchModal from './CustomerSearchModal';
import API from '../services/api'; // ✅ Импорт добавлен

interface Service {
  id: number;
  name: string;
  recipient: string;
  balance: number;
  penalty: number;
  accrued: number;
  to_pay: number;
  paid: number;
  commission: number;
  total: number;
}

export default function CashierScreen() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [comment, setComment] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [error, setError] = useState('');

  const loadServices = async (customerId: number) => {
    try {
      setServices([
        {
          id: 1,
          name: 'Отопление',
          recipient: 'ГорТеплоЭнерго',
          balance: 1500.0,
          penalty: 200.0,
          accrued: 800.0,
          to_pay: 2500.0,
          paid: 0,
          commission: 0,
          total: 2500.0,
        },
        {
          id: 2,
          name: 'Вода',
          recipient: 'Водоканал',
          balance: 500.0,
          penalty: 50.0,
          accrued: 300.0,
          to_pay: 850.0,
          paid: 0,
          commission: 0,
          total: 850.0,
        },
      ]);
    } catch (err) {
      setError('Не удалось загрузить задолженности');
    }
  };

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadServices(customer.id);
    setIsSearchOpen(false);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
  };

  const handleCashPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;

    try {
      const user = JSON.parse(localStorage.getItem('user')!);
      const ws = JSON.parse(localStorage.getItem('workstation')!);

      const checkData = {
        ws_id: ws.ws_id,
        payment_type: 'cash',
        positions: services.map(s => ({
          name: s.name,
          price: s.to_pay,
          quantity: 1,
          tax: 'none'
        })),
        total_amount: Number(paymentAmount),
      };

      const check = await createCheck(checkData); // ✅ Получаем check_id
      alert('✅ Чек отправлен на печать');
      setPaymentAmount('');
      setComment('');
    } catch (err: any) {
      setError(`❌ Ошибка оформления чека: ${err.message}`);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;

    try {
      const user = JSON.parse(localStorage.getItem('user')!);
      const ws = JSON.parse(localStorage.getItem('workstation')!);

      const checkData = {
        ws_id: ws.ws_id,
        payment_type: 'card',
        positions: services.map(s => ({
          name: s.name,
          price: s.to_pay,
          quantity: 1,
          tax: 'none'
        })),
        total_amount: Number(paymentAmount),
      };

      const check = await createCheck(checkData);
      // Инициируем оплату картой
      await API.post(`/checks/${check.check_id}/process-payment`); // ✅ Исправлено
      alert('✅ Оплата инициирована. Чек отправлен на печать.');
    } catch (err: any) {
      setError(`❌ Ошибка оплаты картой: ${err.message}`);
    }
  };

  const totalToPay = services.reduce((sum, s) => sum + s.to_pay, 0);
  const paidAmount = Number(paymentAmount) || 0;

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6">Абонент: {selectedCustomer?.full_name || 'Не выбран'}</Typography>
          <Typography variant="body2">Счёт: {selectedCustomer?.account_number || '—'}</Typography>
          <Typography variant="body2">Адрес: {selectedCustomer?.address || '—'}</Typography>
        </Box>
        <Button variant="contained" onClick={() => setIsSearchOpen(true)}>
          Поиск абонента
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Услуга</TableCell>
                <TableCell>Получатель</TableCell>
                <TableCell align="right">Сальдо</TableCell>
                <TableCell align="right">Пени</TableCell>
                <TableCell align="right">Начислено</TableCell>
                <TableCell align="right">К оплате</TableCell>
                <TableCell align="right">Оплата</TableCell>
                <TableCell align="right">Комиссия</TableCell>
                <TableCell align="right">Сумма</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.recipient}</TableCell>
                  <TableCell align="right">{s.balance.toFixed(2)} ₽</TableCell>
                  <TableCell align="right">{s.penalty.toFixed(2)} ₽</TableCell>
                  <TableCell align="right">{s.accrued.toFixed(2)} ₽</TableCell>
                  <TableCell align="right">{s.to_pay.toFixed(2)} ₽</TableCell>
                  <TableCell align="right">{s.paid.toFixed(2)} ₽</TableCell>
                  <TableCell align="right">{s.commission.toFixed(2)} ₽</TableCell>
                  <TableCell align="right">{s.total.toFixed(2)} ₽</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} sm={6}>
          <TextField
            label="Комментарий"
            fullWidth
            multiline
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography variant="body2">
              Сальдо: <strong>{totalToPay.toFixed(2)} ₽</strong>
            </Typography>
            <TextField
              label="Оплата"
              type="number"
              size="small"
              value={paymentAmount}
              onChange={handlePaymentChange}
              fullWidth
            />
            <Typography variant="body2">
              Итого к оплате: <strong>{paidAmount.toFixed(2)} ₽</strong>
            </Typography>

            <Box display="flex" gap={1} mt={1}>
              <Button variant="contained" color="success" onClick={handleCashPayment}>
                Наличная
              </Button>
              <Button variant="contained" color="primary" onClick={handleCardPayment}>
                Безналичная
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <CustomerSearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </Box>
  );
}