import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Header.css';
function Header({ hideHeader, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false);
  const [language, setLanguage] = useState("ES");

  const toggleHeader = () => {
    setIsVisible(!isVisible);
  };

  const handleIconClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleHeaderClick = (targetId) => {
    onNavigate(targetId);
    setIsVisible(false); // Oculta el header al hacer clic en un enlace
  };

  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === "EN" ? "ES" : "EN"));
  };

  return (
    <div>
      {/* Botón para alternar el header */}
      <button className="toggle-button" onClick={toggleHeader}>
        {isVisible ? "❌" : "☰"}
      </button>

      {/* Menú vertical */}
      <header className={`vertical-header ${isVisible ? "show" : "hide"}`}>
        {/* <div className="language-toggle">
          <button
            className={`language-btn ${language === "EN" ? "selected" : ""}`}
            onClick={() => setLanguage("EN")}
          >
            EN
          </button>
          <button
            className={`language-btn ${language === "ES" ? "selected" : ""}`}
            onClick={() => setLanguage("ES")}
          >
            ES
          </button>
        </div> */}
        <nav>
          <ul className="menu">
            <li>
              <a href="#home" onClick={() => handleHeaderClick("#home")}>
                Home
              </a>
            </li>
            <li>
              <a href="#aboutMe" onClick={() => handleHeaderClick("#aboutMe")}>
                About Me
              </a>
            </li>
            <li>
              <a href="#experience" onClick={() => handleHeaderClick("#experience")}>
                Experience
              </a>
            </li>
            <li>
              <a href="#skills" onClick={() => handleHeaderClick("#skills")}>
                Skills
              </a>
            </li>
            <li>
              <a href="#contact" onClick={() => handleHeaderClick("#contact")}>
                Contact
              </a>
            </li>
          </ul>
        </nav>
        <div className="social-header-links">
          <span
            className="social-header-icon linkedin"
            onClick={() => handleIconClick('https://www.linkedin.com/in/stiven-laiton-3020a615a/')}
            aria-label="LinkedIn"
          >
            <FontAwesomeIcon icon={['fab', 'linkedin']} />
          </span>
          <span
            className="social-header-icon github"
            onClick={() => handleIconClick('https://github.com/slaiton')}
            aria-label="GitHub"
          >
            <FontAwesomeIcon icon={['fab', 'github']} />
          </span>
        </div>

      </header>
    </div>
  );
}

export default Header;