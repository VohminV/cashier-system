// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material'; // Добавьте эти импорты
import { createTheme } from '@mui/material/styles';
import LoginForm from './components/LoginForm';
import WorkstationSelection from './components/WorkstationSelection';
import CashierScreen from './components/CashierScreen';
import { unassignWorkstation } from './services/workstationService';

// Создайте тему (можно оставить по умолчанию)
const theme = createTheme();

function App() {
  const [user, setUser] = useState<{ cashier_id: number; full_name: string; login: string; role: string } | null>(null);
  const [workstation, setWorkstation] = useState<any>(null);

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleWorkstationSelect = (ws: any) => {
    setWorkstation(ws);
  };

  const handleLogout = async () => {
    if (workstation) {
      try {
        await unassignWorkstation(workstation.ws_id);
        console.log('Место успешно освобождено');
      } catch (err) {
        console.error('Не удалось отвязать место:', err);
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setWorkstation(null);
  };
  
	useEffect(() => {
	  const checkSession = async () => {
		const savedUser = localStorage.getItem('user');
		if (savedUser) {
		  const user = JSON.parse(savedUser);
		  try {
			const response = await API.get(`/workstations/by-cashier/${user.cashier_id}`);
			localStorage.setItem('workstation', JSON.stringify(response.data));
		  } catch (err) {
			console.log('Нет активной сессии');
		  }
		}
	  };
	  checkSession();
	}, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* 🔥 Это решит проблему с отступами и центрированием */}
      <div>
        {(!user) && <LoginForm onLoginSuccess={handleLoginSuccess} />}
        {(user && !workstation) && <WorkstationSelection onSelect={handleWorkstationSelect} />}
        {(user && workstation) && <CashierScreen workstation={workstation} user={user} onLogout={handleLogout} />}
      </div>
    </ThemeProvider>
  );
}

export default App;