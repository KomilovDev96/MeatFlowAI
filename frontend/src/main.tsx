import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/AppProviders';
import { AuthBootstrap } from './app/AuthBootstrap';
import { AppRoutes } from './routes/AppRoutes';
import './i18n';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AuthBootstrap>
        <AppRoutes />
      </AuthBootstrap>
    </AppProviders>
  </React.StrictMode>,
);
