import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import { getWorkstations, assignWorkstation, getWorkstationById } from '../services/workstationService';

interface Workstation {
  ws_id: number;
  name: string;
  kkt_name: string;
  kkt_status: string;
  pinpad_name: string;
  bank_name: string;
}

function WorkstationSelection({ onSelect }: { onSelect: (ws: Workstation) => void }) {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWorkstations = async () => {
      try {
        const response = await getWorkstations();
        setWorkstations(response.data);
      } catch (err: any) {
        setError('Не удалось загрузить кассовые места. Проверьте подключение.');
      } finally {
        setLoading(false);
      }
    };
    loadWorkstations();
  }, []);

  const handleSelect = async (workstation) => {
    try {
      const user = JSON.parse(localStorage.getItem('user')!);
      
      // 1. Привязываем кассира
      await assignWorkstation(workstation.ws_id, user.cashier_id);

      // 2. Загружаем полные данные места
      const response = await getWorkstationById(workstation.ws_id);
      const fullWorkstation = response.data;

      // 3. Сохраняем в localStorage
      localStorage.setItem('workstation', JSON.stringify(fullWorkstation));

      // 4. Передаём в App
      onSelect(fullWorkstation);

    } catch (err) {
      setError(`❌ Не удалось занять место: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography>Загрузка кассовых мест...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (workstations.length === 0) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Alert severity="info">Нет доступных кассовых мест.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}> {/* Изменено my={4} на my={4} (локальный отступ, можно адаптировать) */}
        <Typography variant="h5" align="center" gutterBottom>
          Выберите кассовое место
        </Typography>
        {workstations.map((ws) => (
          <Card key={ws.ws_id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{ws.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                ККТ: {ws.kkt_name} ({ws.kkt_status})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Пин-пад: {ws.pinpad_name} ({ws.bank_name})
              </Typography>
              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => handleSelect(ws)}
              >
                Занять место
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}

export default WorkstationSelection;