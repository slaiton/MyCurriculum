import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import './Header.css';

function Header({ onNavigate }) {
  const [isVisible, setIsVisible] = useState(true);
  const [animateIcon, setAnimateIcon] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateIcon((prev) => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleHeaderClick = (targetId) => {
    onNavigate(targetId);
    setIsVisible(false);
  };

  return (
    <div className="menu-container">
      {!isVisible && (
        <motion.img 
        src="/icon.png" 
        alt="Menu" 
        className="menu-icon" 
        onClick={() => setIsVisible(true)} 
        whileHover={{ scale: 1.2, rotate: 360 }}
        animate={animateIcon ? { rotate: [0, 70, -80, 0] } : {}}
        transition={{ duration: 0.5 }}
      />
      )}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className="bottom-menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <motion.span 
              className="menu-item" 
              onClick={() => handleHeaderClick("#home")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >Inicio</motion.span> |
            <motion.span 
              className="menu-item" 
              onClick={() => handleHeaderClick("#aboutMe")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >Acerca de mí</motion.span> |
            <motion.span 
              className="menu-item" 
              onClick={() => handleHeaderClick("#experience")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >Experiencia</motion.span> |
            <motion.span 
              className="menu-item" 
              onClick={() => handleHeaderClick("#skills")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >Habilidades</motion.span> |
            <motion.span 
              className="menu-item" 
              onClick={() => handleHeaderClick("#contact")}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >Contacto</motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Header;