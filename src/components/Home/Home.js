import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useScrollDirection from "../../hooks/useScroll";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useScroll from '../../hooks/useScrollDetection';
import './Home.css';
import '../../styles/fonts.css';
function Home({ onNavigate }) {

  const handleIconClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const [canNavigate, setCanNavigate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanNavigate(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  
  const handleScroll = (event) => {
    if (!canNavigate) return; 
    if (event.deltaY > 0) {
      onNavigate("#aboutMe");
    } else if (event.deltaY < 0) {
    }
  };

  useScroll(handleScroll);

  return (
    <motion.div
      id="home"
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >

      <motion.div
        className="video-background"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >

        <video src="../../assets/video/code.mp4" autoPlay loop muted />
        <div className="overlay"></div>

      </motion.div>


        <motion.div
          className="content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* <h1>Jhoan Stiven Laiton</h1> */}
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

          {/* <motion.div
            className="arrow-button"
            initial={{ y: 0 }}
            animate={{ y: [0, 10, 0] }} // Animación de movimiento
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: 'loop',
            }}
            onClick={() => {
              scrollAbout()
            }}
          >
          </motion.div> */}


        </motion.div>

    </motion.div>
  );
}

export default Home;