import React from 'react';
import ReactDOM from 'react-dom/client';
// We'll create App.js next
import App from './App';
// Basic styling (optional, create this file if needed)
// import './styles/global.css';

// Check if the electronAPI is exposed via preload.js
if (window.electronAPI) {
  console.log('electronAPI found on window object.');
  // You could potentially pass the API down via props or context here
} else {
  console.error('Error: electronAPI not found. Check preload.js and contextIsolation settings.');
  // Handle the error appropriately - maybe display a message to the user
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('React app mounted.');