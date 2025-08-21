// frontend/src/components/CashierScreen.tsx
import { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
} from '@mui/material';
import { searchCustomers, Customer } from '../services/customerService';
import { createCheck } from '../services/checkService';
import API from '../services/api';
import CustomerSearchModal from './CustomerSearchModal';

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
  const [tab, setTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [comment, setComment] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [error, setError] = useState('');

  const workstation = JSON.parse(localStorage.getItem('workstation') || 'null');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Обработчик выбора абонента
  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadServices(customer.id);
    setIsSearchOpen(false);
  };

  // Загрузка услуг абонента
  const loadServices = async (customerId: number) => {
    try {
      const mockServices: Service[] = [
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
        {
          id: 3,
          name: 'Электричество',
          recipient: 'Энергосбыт',
          balance: 300.0,
          penalty: 30.0,
          accrued: 200.0,
          to_pay: 530.0,
          paid: 0,
          commission: 0,
          total: 530.0,
        },
      ];
      setServices(mockServices);
    } catch (err) {
      setError('Не удалось загрузить задолженности');
    }
  };

  // Распределение оплаты по услугам
  const handleDistribute = () => {
    const amount = Number(paymentAmount) || 0;
    if (amount === 0) return;

    let remaining = amount;
    const updated = services.map((s) => {
      let paid = 0;
      let commission = 0;

      if (remaining > 0 && s.penalty > 0) {
        const payPenalty = Math.min(remaining, s.penalty);
        paid += payPenalty;
        remaining -= payPenalty;
      }

      if (remaining > 0) {
        const totalDebt = s.balance + s.accrued;
        const payDebt = Math.min(remaining, totalDebt);
        paid += payDebt;
        remaining -= payDebt;
      }

      if (user.role === 'cashier') {
        commission = paid * 0.015;
      }

      return { ...s, paid, commission, total: paid + commission };
    });

    setServices(updated);
  };

  // Обработчик изменения суммы
  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
  };

  // Обработчик кнопки "Наличная"
  const handleCashPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    handleDistribute();

    try {
      const checkData = {
        ws_id: workstation.ws_id,
        payment_type: 'cash',
        positions: services
          .filter(s => s.paid > 0)
          .map(s => ({
            name: s.name,
            price: s.paid,
            quantity: 1,
            tax: 'none',
            commission: s.commission,
          })),
        total_amount: Number(paymentAmount),
      };

      const response = await createCheck(checkData);
      alert(`✅ Чек отправлен на печать. №${response.check_id}`);
      resetForm();
    } catch (err: any) {
      setError(`❌ Ошибка оформления чека: ${err.message}`);
    }
  };

  // Обработчик кнопки "Безналичная"
  const handleCardPayment = async () => {
    if (!selectedCustomer || !paymentAmount) return;
    handleDistribute();

    try {
      const checkData = {
        ws_id: workstation.ws_id,
        payment_type: 'card',
        positions: services
          .filter(s => s.paid > 0)
          .map(s => ({
            name: s.name,
            price: s.paid,
            quantity: 1,
            tax: 'none',
            commission: s.commission,
          })),
        total_amount: Number(paymentAmount),
      };

      const response = await createCheck(checkData);
      await API.post(`/checks/${response.check_id}/process-payment`);
      alert(`✅ Оплата инициирована. Чек №${response.check_id}`);
      resetForm();
    } catch (err: any) {
      setError(`❌ Ошибка оплаты картой: ${err.message}`);
    }
  };

  // Сброс формы
  const resetForm = () => {
    setPaymentAmount('');
    setComment('');
    setServices(prev => prev.map(s => ({ ...s, paid: 0, commission: 0, total: 0 })));
  };

  // ✅ Правильный useEffect для ping
  useEffect(() => {
    const ping = async () => {
      try {
        await API.post('/workstations/ping');
      } catch (err) {
        console.error('Не удалось обновить активность');
      }
    };

    const interval = setInterval(ping, 60_000); // Каждую минуту

    return () => clearInterval(interval); // Очистка при размонтировании
  }, []);

  // Итоговые суммы
  const totalToPay = services.reduce((sum, s) => sum + s.to_pay, 0);
  const paidAmount = services.reduce((sum, s) => sum + s.paid, 0);
  const totalCommission = services.reduce((sum, s) => sum + s.commission, 0);

  return (
    <Box sx={{ p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Вкладки */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Оплата ЖКУ" />
        <Tab label="История платежей" disabled />
      </Tabs>

      {/* Панель: Информация об абоненте и рабочем месте */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Абонент</Typography>
            <Typography>ФИО: {selectedCustomer?.full_name || 'Не выбран'}</Typography>
            <Typography>Счёт: {selectedCustomer?.account_number || '—'}</Typography>
            <Typography>Адрес: {selectedCustomer?.address || '—'}</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsSearchOpen(true)}
              sx={{ mt: 1 }}
            >
              Выбрать абонента
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Рабочее место</Typography>
            <Typography>Место: {workstation?.name || '—'}</Typography>
            <Typography>ККТ: {workstation?.kkt_name} ({workstation?.kkt_status})</Typography>
            <Typography>Пин-пад: {workstation?.pinpad_name} ({workstation?.bank_name})</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Таблица услуг */}
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

      {/* Нижняя панель */}
      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} sm={6}>
          <TextField
            label="Комментарий"
            fullWidth
            multiline
            rows={10}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                overflow: 'auto',
              },
            }}
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
            <Button variant="outlined" size="small" onClick={handleDistribute} sx={{ mt: 1 }}>
              Распределить
            </Button>
            <Typography variant="body2">
              Итого к оплате: <strong>{paidAmount.toFixed(2)} ₽</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Комиссия: {totalCommission.toFixed(2)} ₽
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

      {/* Модальное окно поиска */}
      <CustomerSearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </Box>
  );
}