
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process.env for browser environments
if (typeof window['process'] === 'undefined') {
  window['process'] = { env: {} };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// Using React.createElement instead of JSX to avoid browser parsing errors
root.render(
  React.createElement(React.StrictMode, null, 
    React.createElement(App, null)
  )
);
