// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Бэкенд
        changeOrigin: true,               // Важно для правильной маршрутизации
        secure: false,                    // Отключает проверку SSL (для локальной разработки)
        // logLevel: 'debug'              // Раскомментируйте для отладки прокси
      },
    },
  },
});