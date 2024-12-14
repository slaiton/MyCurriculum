import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useScrollDirection from "../../hooks/useScroll";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useScroll from '../../hooks/useScrollDetection';
import './Home.css';
import '../../styles/fonts.css';
function Home({ onNavigate }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { scrollDirection, scrollDistance } = useScrollDirection();

  const handleIconClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleScroll = (event) => {
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

        <video src="../../assets/video/giphy.mp4" autoPlay loop muted />

        <motion.div
          className="overlay"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h1>Jhoan Stiven Laiton</h1>
          <p>Full Stack Developer</p>

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

    </motion.div>
  );
}

export default Home;