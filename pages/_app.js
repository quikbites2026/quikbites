import { CartProvider } from '../context/CartContext';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('QuikBites SW registered:', reg.scope);
          })
          .catch((err) => {
            console.log('SW registration failed:', err);
          });
      });
    }
  }, []);

  return (
    <CartProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 600,
            borderRadius: '12px',
          },
          success: {
            style: { background: '#2D7A40', color: 'white' },
          },
          error: {
            style: { background: '#C0392B', color: 'white' },
          },
        }}
      />
      <Component {...pageProps} />
    </CartProvider>
  );
}
