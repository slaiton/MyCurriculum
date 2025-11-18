import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useScroll from '../../hooks/useScrollDetection';
import { sendEmail } from '../../api/api';

import '../../styles/fonts.css';
import './Contact.css';

function Contact({ onNavigate }) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [errors, setErrors] = useState({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    text: '',
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });



  const handleIconClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData({ ...emailData, [name]: value });
  };
  const [canNavigate, setCanNavigate] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    try {

      if (Object.keys(newErrors).length === 0) {
        const response = await sendEmail(emailData);
        alert(response.message);
        setFormData({ name: "", email: "", message: "" });
        setErrors({});
      } else {
        setErrors(newErrors);
      }


    } catch (error) {
      alert('Error sending email');
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "El mensaje es obligatorio.";
    }

    return newErrors;
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      setCanNavigate(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);


  const handleScroll = (event) => {
    if (!canNavigate) return;
    if (event.deltaY > 0) {

    } else if (event.deltaY < 0) {
      onNavigate("#skills");
    }
  };

  useScroll(handleScroll);

  return (
    <motion.section
      initial={{ y: '-100vh', opacity: 0 }}
      animate={{ y: isVisible ? '0' : '-100vh', opacity: isVisible ? 1 : 0 }}
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
        <ul className="contact-info" style={{ textAlign: 'center', fontSize: '1.5rem', listStyle: 'none', padding: 0, color: '#FFF' }}>
          <motion.li whileHover={{ scale: 1.1 }}>
            📧 <a href="mailto:slaiton@example.com" style={{ color: 'white', textDecoration: 'none' }}>jstivenlaiton@gmail.com</a>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }}>
            📱 +57 304 641 5909
          </motion.li>
        </ul>
        <div className="social-links" style={{ marginTop: '150px'}}>
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


      {/* 
      <div className={`form-container ${isVisible ? "visible" : ""}`}>
        <div className="title-container">
          <h2>Contacto</h2>
        </div>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <p style={{ color: "red" }}>{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p style={{ color: "red" }}>{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
            ></textarea>
            {errors.message && <p style={{ color: "red" }}>{errors.message}</p>}
          </div>

          <button type="submit" className="submit-button">Enviar</button>
        </form>
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

          <span
            className="social-icon file"
            onClick={() => handleIconClick('https://github.com/slaiton')}
            aria-label="File"
          >
            <FontAwesomeIcon icon={['fab', 'fa-file']} />
          </span>
        </div>

      </div> */}

    </motion.section>
  );

}

export default Contact;
