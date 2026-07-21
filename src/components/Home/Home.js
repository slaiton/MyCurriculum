import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useScroll from '../../hooks/useScrollDetection';
import useStrapi from '../../hooks/useStrapi';
import './Home.css';
import '../../styles/fonts.css';

/* ---------- Iconos ---------- */

const ICONS = {
  cube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" />
      <path d="m3 7 9 5 9-5" />
      <path d="M12 12v10" />
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  app: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
};

const FALLBACK_APPS = [
  {
    name: 'Tienda 3D',
    description: 'Marketplace con catálogo y visualización 3D de productos.',
    url: 'https://market.slaiton.com',
    iconKey: 'cube',
    accent: '#00e5ff',
  },
  {
    name: 'ScrapTools',
    description: 'Suite de herramientas de scraping y automatización de datos.',
    url: 'https://scraptool.slaiton.com/',
    iconKey: 'wrench',
    accent: '#4ade80',
  },
  {
    name: 'CargoApp',
    description: 'Gestión logística de cargas, rutas y seguimiento de envíos.',
    url: 'https://cargo.slaiton.com',
    iconKey: 'truck',
    accent: '#fbbf24',
  },
];

/* ---------- Fondo de partículas ---------- */

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = window.innerWidth < 768 ? 30 : 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
    }));

    let animId = null;

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            ctx.strokeStyle = `rgba(0,229,255,${(1 - Math.sqrt(d2) / 126) * 0.22})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, 'rgba(0,229,255,0.55)');
        g.addColorStop(1, 'rgba(0,229,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
    };

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loop = () => {
      drawFrame();
      animId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (animId === null) animId = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    if (prefersReduced) {
      drawFrame();
    } else {
      start();
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}

/* ---------- Tarjeta de aplicación ---------- */

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '0, 229, 255';
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
};

function AppCard({ app, index }) {
  const icon = ICONS[app.iconKey] || ICONS.app;
  const accent = app.accent || '#00e5ff';

  const open = () => window.open(app.url, '_blank', 'noopener,noreferrer');

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  return (
    <motion.div
      className="app-card"
      style={{ '--accent': accent, '--accent-rgb': hexToRgb(accent) }}
      role="link"
      tabIndex={0}
      aria-label={`Abrir ${app.name}`}
      onClick={open}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 + index * 0.09, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="app-card-glow" aria-hidden="true" />

      <div className="app-icon">{icon}</div>

      <div className="app-meta">
        <h3 className="app-name">{app.name}</h3>
        {app.description && <p className="app-desc">{app.description}</p>}
      </div>

      <span className="app-launch" aria-hidden="true">
        Abrir
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </span>
    </motion.div>
  );
}

/* ---------- Home ---------- */

function Home({ onNavigate }) {
  const strapiApps = useStrapi('apps?sort=order:asc&pagination[pageSize]=20');
  const apps = strapiApps?.length ? strapiApps : FALLBACK_APPS;

  const handleIconClick = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const handleScroll = (event) => {
    if (event.deltaY > 0) onNavigate('#aboutMe');
  };

  useScroll(handleScroll);

  return (
    <motion.div
      id="home"
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ParticleCanvas />

      <div className="home-content">
        <motion.header
          className="home-hero"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1>Full Stack Developer</h1>
          <p className="hero-sub">Aplicaciones en producción</p>
        </motion.header>

        <div className="apps-grid">
          {apps.map((app, i) => (
            <AppCard key={app.id ?? app.name} app={app} index={i} />
          ))}
        </div>

        <motion.div
          className="home-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="social-links">
            <span
              className="social-icon linkedin"
              onClick={() => handleIconClick('https://www.linkedin.com/in/stiven-laiton-3020a615a/')}
              aria-label="LinkedIn"
            >
              <FontAwesomeIcon icon={['fab', 'linkedin']} />
            </span>
            <span
              className="social-icon github"
              onClick={() => handleIconClick('https://github.com/slaiton')}
              aria-label="GitHub"
            >
              <FontAwesomeIcon icon={['fab', 'github']} />
            </span>
          </div>

          <button className="scroll-hint" onClick={() => onNavigate('#aboutMe')}>
            <span>Conoce mi perfil</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Home;
