// frontend/src/components/LoginForm.jsx
import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import API from '../services/api';

function LoginForm({ onLoginSuccess }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await API.post('/auth/login', { login, password });
      
      // Сохраняем токен и данные пользователя
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      setMessage(`✅ Добро пожаловать, ${response.data.user.full_name}!`);
      
      // Через 1.5 сек — переходим к выбору места
      setTimeout(() => {
        onLoginSuccess(response.data.user);
      }, 1500);

    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error || 'Ошибка подключения'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <Paper elevation={6} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Вход в кассовую систему
          </Typography>

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
            </Button>
          </Box>

          {message && (
            <Alert severity={message.includes('✅') ? 'success' : 'error'} sx={{ mt: 3 }}>
              {message}
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginForm;