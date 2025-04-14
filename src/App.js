import React, { useEffect, useState } from 'react';
import Header from './components/Header/Header';
import Home from './components/Home/Home';
import AboutMe from './components/AboutMe/AboutMe';
import Skills from './components/Skills/Skills';
import Experience from './components/Experience/Experience';
import ProjectReview from './components/Projects/Projects';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
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
      console.log(event);
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
      <a
        href="#"
        className="floating-name"
        style={{ color: sectionColors[currentSection] || "#000" }}
        >
          Stiven Laiton

      </a>

      <a 
        href="../../assets/files/HV.pdf" 
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
      {/* <Footer /> */}
    </div>
  );
}

export default App;