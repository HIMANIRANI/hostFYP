import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { UserProvider } from './context/UserContext';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Router>
        <UserProvider>
          <App />
        </UserProvider>
      </Router>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
