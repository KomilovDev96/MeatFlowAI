import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/AppProviders';
import { AppRoutes } from './routes/AppRoutes';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </React.StrictMode>,
);
