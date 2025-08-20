// frontend/src/App.tsx
import { useState } from 'react';
import LoginForm from './components/LoginForm';
import WorkstationSelection from './components/WorkstationSelection';
import CashierScreen from './components/CashierScreen'; 
import { unassignWorkstation } from './services/workstationService';

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

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (!workstation) {
    return <WorkstationSelection onSelect={handleWorkstationSelect} />;
  }

  return <CashierScreen workstation={workstation} user={user} onLogout={handleLogout} />;
}

export default App;