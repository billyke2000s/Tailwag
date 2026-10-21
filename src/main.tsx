import { handleBack } from './utils/navigation';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

window.addEventListener('tailwag-back', event => { if (handleBack()) event.preventDefault(); });
window.addEventListener('keydown', event => { if (event.key === 'Escape' && handleBack()) event.preventDefault(); });
