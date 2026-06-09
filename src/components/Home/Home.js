import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useScroll from '../../hooks/useScrollDetection';
import './Home.css';
import '../../styles/fonts.css';

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

    const COUNT = 75;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.8 + 0.5,
    }));

    let animId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = dx * dx + dy * dy;
          if (dist < 18000) {
            const alpha = (1 - Math.sqrt(dist) / 134) * 0.45;
            ctx.strokeStyle = `rgba(0,255,255,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gradient.addColorStop(0, 'rgba(0,255,255,0.9)');
        gradient.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

function Home({ onNavigate }) {
  const handleIconClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
      transition={{ duration: 0.6 }}
    >
      <ParticleCanvas />

      <motion.div
        className="content"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1>Full Stack Developer</h1>

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
      </motion.div>
    </motion.div>
  );
}

export default Home;
