import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from './components/Header/Header';
import Home from './components/Home/Home';
import AboutMe from './components/AboutMe/AboutMe';
import Skills from './components/Skills/Skills';
import Experience from './components/Experience/Experience';
import ProjectReview from './components/Projects/Projects';
import Contact from './components/Contact/Contact';
import { initGA, logPageView } from "./utils/analytics";

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faCheckSquare, faCoffee } from '@fortawesome/free-solid-svg-icons'

import './styles/global.css';
import './App.css';

library.add(fab, faCheckSquare, faCoffee)

function App() {
  const [currentSection, setCurrentSection] = React.useState("#home");
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const sectionColors = {
    "#home": "#00ffff",
    "#aboutMe": "#000000",
    "#skills": "#6BCB77",
    "#experience": "#FFD93D",
    "#projects": "#ff2858",
    "#contact": "#A66DD4"
  };
  
  useEffect(() => {
    initGA()
    logPageView()

    const handleMouseMove = (event) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleNavigate = (sectionId) => {

    setCurrentSection(sectionId);
  };

  return (
    <>
      <Helmet>
        <title>Stiven Laiton — Full Stack Developer</title>
        <meta name="description" content="Portafolio de Jhoan Stiven Laiton, Ingeniero de Software Full Stack con 6+ años de experiencia en Laravel, React, Angular, Kotlin, AWS y Docker." />
        <meta property="og:title" content="Stiven Laiton — Full Stack Developer" />
        <meta property="og:description" content="Portafolio profesional: proyectos, experiencia y habilidades de un Full Stack Developer." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://slaiton.com" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Stiven Laiton — Full Stack Developer" />
        <meta name="twitter:description" content="Portafolio profesional: proyectos, experiencia y habilidades de un Full Stack Developer." />
      </Helmet>
    <div className="app">
      <div className="mouse-follower">
        <div
          className="circle"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        ></div>
      </div>
      <Header onNavigate={handleNavigate} />
      <span
        className="floating-name"
        style={{ color: sectionColors[currentSection] || "#000" }}
        >
          Stiven Laiton
      </span>

      <a 
        href="/assets/files/HV.pdf"
        download 
        className="floating-button"
        title="Descargar CV"
      >
        📄 Descargar CV
      </a>
      <div className="sections">
        {currentSection === "#home" && <Home onNavigate={handleNavigate} />}
        {currentSection === "#aboutMe" && <AboutMe onNavigate={handleNavigate} />}
        {currentSection === "#skills" && <Skills onNavigate={handleNavigate} />}
        {currentSection === "#experience" && <Experience onNavigate={handleNavigate} />}
        {currentSection === "#contact" && <Contact onNavigate={handleNavigate} />}
        {currentSection === "#projects" && <ProjectReview onNavigate={handleNavigate} />}
      </div>
    </div>
    </>
  );
}

export default App;