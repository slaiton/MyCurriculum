import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useScroll from '../../hooks/useScrollDetection';
import { useSpring, animated } from "@react-spring/web";
import './AboutMe.css';


const AnimatedNumber = ({ targetNumber }) => {
    
    const { number } = useSpring({
        from: { number: 0 },
        to: { number: targetNumber },
        config: { duration: 1500 },
    });

    return (
        <div className='d-flex  justify-content-center align-center'>
            <h1> + </h1>
            <animated.h1>
                {number.to((value) => value.toFixed(0))}
            </animated.h1>
        </div>
    );
};

function AboutMe({ onNavigate }) {
    const [isVisible, setIsVisible] = React.useState(true);
    const navigate = (hash) => {
        // Cambia el hash en la URL
        window.location.hash = hash;

        onNavigate(hash)
    };
    const [canNavigate, setCanNavigate] = useState(false);



    useEffect(() => {
      const timer = setTimeout(() => {
        setCanNavigate(true);
      }, 2500);
  
      return () => clearTimeout(timer);
    }, []);

  
    const handleScroll = (event) => {
      if (!canNavigate) return; 
        if (event.deltaY > 0) {
            navigate("#experience");
        } else if (event.deltaY < 0) {
            navigate("#home");
        }
    };

    useScroll(handleScroll);

    return (
        <motion.section
            initial={{ y: '-100vh', opacity: 0 }}
            animate={{ y: isVisible ? '0' : '-100vh', opacity: isVisible ? 1 : 0 }}
            exit={{ y: '-100vh', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            id="aboutMe" className="about">
            <div
                className="profile"
            >

                <div className='profile-container'>
                    <div className="profile-image"></div>
                    <div className="profile-description">
                        <h2>Sobre mí</h2>
                        <p>
                            Ingeniero de Software Full Stack con habilidades para
                            desarrollar soluciones tecnológicas innovadoras y a medida,
                            con un enfoque en la optimización de procesos y la creación
                            de aplicaciones robustas y eficientes. Soy una persona
                            proactiva, creativa y orientada a cumplir con los objetivos de la
                            empresa, adaptándome rápidamente a los cambios del
                            entorno. Destaco por mi capacidad para trabajar en equipo y
                            establecer relaciones interpersonales constructivas, así como
                            por mi facilidad para aprender nuevas tecnologías y enfrentar
                            desafíos técnicos con iniciativa.
                        </p>
                    </div>
                </div>

                <div className='profile-expirence'>

                    <div className='years-expirence'>
                        <AnimatedNumber targetNumber={6} />
                        <span>
                            años de experiencia trabajando en
                        </span>
                    </div>


                    <div className="profile-grid">
    
                        <div className="grid-item">
                            <h3>Frontend</h3>
                            <p>
                                Experiencia con React, Angular y creación de interfaces de usuario
                                dinámicas y responsivas.
                            </p>
                        </div>
                        <div className="grid-item">
                            <h3>Backend</h3>
                            <p>
                                Diseño y construcción de APIs RESTful utilizando Node.js, Express y
                                Laravel.
                            </p>
                        </div>
                        <div className="grid-item">
                            <h3>Bases de Datos</h3>
                            <p>
                                Gestión y optimización de bases de datos relacionales (PostgreSQL,
                                MySQL) y no relacionales (MongoDB).
                            </p>
                        </div>
                        <div className="grid-item">
                            <h3>DevOps</h3>
                            <p>
                                Implementación de entornos con Docker, CI/CD, y manejo de servidores en
                                AWS.
                            </p>
                        </div>
                        
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

export default AboutMe;