import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useScroll from '../../hooks/useScrollDetection';
import { sendEmail } from '../../api/api';

import '../../styles/fonts.css';
import './Contact.css';

function Contact({ onNavigate }) {
  const [canNavigate, setCanNavigate] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleIconClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo no es válido.';
    }
    if (!formData.message.trim()) newErrors.message = 'El mensaje es obligatorio.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setStatus('sending');
    try {
      await sendEmail({
        to: 'jstivenlaiton@gmail.com',
        subject: `Contacto de ${formData.name}`,
        text: `De: ${formData.name} (${formData.email})\n\n${formData.message}`,
      });
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setCanNavigate(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = (event) => {
    if (!canNavigate) return;
    if (event.deltaY < 0) onNavigate('#projects');
  };

  useScroll(handleScroll);

  return (
    <motion.section
      initial={{ y: '-100vh', opacity: 0 }}
      animate={{ y: '0', opacity: 1 }}
      exit={{ y: '-100vh', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      id="contact" className="contact">

      <motion.div
        className="contact-container"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h2 className="title-container">Contacto</h2>

        <ul className="contact-info" style={{ textAlign: 'center', fontSize: '1.2rem', listStyle: 'none', padding: 0, color: '#FFF', marginBottom: '1rem' }}>
          <motion.li whileHover={{ scale: 1.1 }}>
            📧 <a href="mailto:jstivenlaiton@gmail.com" style={{ color: 'white', textDecoration: 'none' }}>jstivenlaiton@gmail.com</a>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }}>
            📱 +57 304 641 5909
          </motion.li>
        </ul>

        <div className="form-container visible">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <input
                type="text"
                id="name"
                name="name"
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
              />
              <label htmlFor="name">Nombre</label>
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
              />
              <label htmlFor="email">Correo Electrónico</label>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder=" "
                value={formData.message}
                onChange={handleChange}
              />
              <label htmlFor="message">Mensaje</label>
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>

            <button type="submit" className="submit-button" disabled={status === 'sending'}>
              {status === 'sending' ? 'Enviando...' : 'Enviar'}
            </button>
            {status === 'success' && <p className="form-feedback success">¡Mensaje enviado correctamente!</p>}
            {status === 'error' && <p className="form-feedback error">Error al enviar. Intenta de nuevo.</p>}
          </form>
        </div>

        <div className="social-links" style={{ marginTop: '1rem' }}>
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
    </motion.section>
  );
}

export default Contact;
