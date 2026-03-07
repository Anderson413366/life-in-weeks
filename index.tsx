
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// These global variables are expected to be injected by the environment
// Fallback to empty JSON string if not defined, then parse.
const firebaseConfigJson = typeof (window as any).__firebase_config !== 'undefined' ? (window as any).__firebase_config : '{}';
(window as any).firebaseConfig = JSON.parse(firebaseConfigJson);

(window as any).appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-life-in-weeks';
(window as any).initialAuthToken = typeof (window as any).__initial_auth_token !== 'undefined' ? (window as any).__initial_auth_token : null;


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);