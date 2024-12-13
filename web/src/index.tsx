import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import debug from 'debug';

// Enable debug logging in development
if (process.env.NODE_ENV !== 'production') {
  debug.enable('pcc:web:*');
  localStorage.setItem('debug', 'pcc:web:*');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 