import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// JSON-LD structured data
const jsonLd = document.createElement('script');
jsonLd.type = 'application/ld+json';
jsonLd.textContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Particle Life',
  description: 'Emergent behavior simulator — colored particles self-organize into living structures through configurable attraction and repulsion rules.',
  url: 'https://kai-claw.github.io/particle-life/',
  applicationCategory: 'Simulation',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
});
document.head.appendChild(jsonLd);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
