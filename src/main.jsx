import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { initApi } from './api/index.js';
import App from './App.jsx';
import './index.css';
import { applyTheme, loadTheme } from './lib/theme.js';

applyTheme(loadTheme());

const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';
const root = createRoot(document.getElementById('root'));

initApi()
  .then((api) => {
    window.sproutApi = api; // handy for debugging & the verify script
    root.render(
      <React.StrictMode>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  })
  .catch((e) => {
    console.error(e);
    root.render(
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '3rem' }}>🌧️</div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sprout couldn't wake up</h1>
        <p style={{ color: '#888', marginTop: '0.5rem' }}>{String(e.message || e)}</p>
        <p style={{ color: '#888', marginTop: '0.5rem' }}>
          Try closing and reopening the app. Your data is safe.
        </p>
      </div>
    );
  });
