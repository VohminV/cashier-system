// frontend/src/components/CustomerSearchModal.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { searchCustomers, Customer } from '../services/customerService';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export default function CustomerSearchModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await searchCustomers(query.trim());
      setResults(data);
    } catch (err) {
      setError('Ошибка при поиске абонента. Проверьте подключение.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Поиск абонента</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="ФИО / Адрес / Лицевой счёт"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          sx={{ mt: 2 }}
        >
          Найти
        </Button>

        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
          {results.length === 0 && !loading && !error && (
            <ListItemText primary="Введите данные для поиска" />
          )}
          {results.map((cust) => (
            <ListItem
              button
              key={cust.id}
              onClick={() => {
                onSelect(cust);
                onClose();
              }}
            >
              <ListItemText
                primary={cust.full_name}
                secondary={`Счёт: ${cust.account_number} | Адрес: ${cust.address}`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Отмена
        </Button>
      </DialogActions>
    </Dialog>
  );
}