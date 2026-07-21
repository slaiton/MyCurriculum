import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useScroll from '../../hooks/useScrollDetection';
import useStrapi from '../../hooks/useStrapi';
import { sendEmail } from '../../api/api';

import '../../styles/fonts.css';
import './Contact.css';

const FALLBACK_CONTACT = {
  email: 'jstivenlaiton@gmail.com',
  phone: '+57 304 641 5909',
  linkedinUrl: 'https://www.linkedin.com/in/stiven-laiton-3020a615a/',
  githubUrl: 'https://github.com/slaiton',
};

function Contact({ onNavigate }) {
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const strapiData = useStrapi('contact-info');
  const contact = {
    email:       strapiData?.email       || FALLBACK_CONTACT.email,
    phone:       strapiData?.phone       || FALLBACK_CONTACT.phone,
    linkedinUrl: strapiData?.linkedinUrl || FALLBACK_CONTACT.linkedinUrl,
    githubUrl:   strapiData?.githubUrl   || FALLBACK_CONTACT.githubUrl,
  };

  const handleIconClick = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio.';
    if (!formData.email.trim()) {
      errs.email = 'El correo es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'El correo no es válido.';
    }
    if (!formData.message.trim()) errs.message = 'El mensaje es obligatorio.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus('sending');
    try {
      await sendEmail({
        to: contact.email,
        subject: `Contacto de ${formData.name}`,
        text: `De: ${formData.name} (${formData.email})\n\n${formData.message}`,
      });
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleScroll = (event) => {
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
            📧 <a href={`mailto:${contact.email}`} style={{ color: 'white', textDecoration: 'none' }}>{contact.email}</a>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }}>
            📱 {contact.phone}
          </motion.li>
        </ul>

        <div className="form-container visible">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <input type="text" id="name" name="name" placeholder=" " value={formData.name} onChange={handleChange} />
              <label htmlFor="name">Nombre</label>
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <input type="email" id="email" name="email" placeholder=" " value={formData.email} onChange={handleChange} />
              <label htmlFor="email">Correo Electrónico</label>
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <textarea id="message" name="message" rows="4" placeholder=" " value={formData.message} onChange={handleChange} />
              <label htmlFor="message">Mensaje</label>
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>

            <button type="submit" className="submit-button" disabled={status === 'sending'}>
              {status === 'sending' ? 'Enviando...' : 'Enviar'}
            </button>
            {status === 'success' && <p className="form-feedback success">¡Mensaje enviado correctamente!</p>}
            {status === 'error'   && <p className="form-feedback error">Error al enviar. Intenta de nuevo.</p>}
          </form>
        </div>

        <div className="social-links" style={{ marginTop: '1rem' }}>
          <span className="social-icon linkedin" onClick={() => handleIconClick(contact.linkedinUrl)} aria-label="LinkedIn">
            <FontAwesomeIcon icon={['fab', 'linkedin']} />
          </span>
          <span className="social-icon github" onClick={() => handleIconClick(contact.githubUrl)} aria-label="GitHub">
            <FontAwesomeIcon icon={['fab', 'github']} />
          </span>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default Contact;
