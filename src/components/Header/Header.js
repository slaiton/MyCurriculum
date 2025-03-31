import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Header.css';
function Header({ hideHeader, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false);

    const handleHeaderClick = (targetId) => {
        onNavigate(targetId);
        setIsVisible(false);
      };
    

  return (
    <div className="bottom-menu">
      <span className="menu-item" href="#home" onClick={() => handleHeaderClick("#home")}>Inicio</span> |
      <span className="menu-item" href="#aboutMe" onClick={() => handleHeaderClick("#aboutMe")}>Acerca de mi</span> |
      <span className="menu-item" href="#experience" onClick={() => handleHeaderClick("#experience")}>Experiencia</span> |
      <span className="menu-item" href="#skills" onClick={() => handleHeaderClick("#skills")}>Habilidades</span> |
      <span className="menu-item" href="#contact" onClick={() => handleHeaderClick("#contact")}>Contacto</span>
    </div>
  );

}
  export default Header;