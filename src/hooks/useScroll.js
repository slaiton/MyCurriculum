import { useState, useEffect } from "react";

const useScroll = () => {
  const [scrollDirection, setScrollDirection] = useState(null); // Dirección del scroll
  const [scrollDistance, setScrollDistance] = useState(0); // Distancia del scroll

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const distance = Math.abs(currentScrollY - lastScrollY); // Calcular distancia recorrida

      if (currentScrollY > lastScrollY) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection("up");
      }

      setScrollDistance(distance); // Actualizar distancia
      lastScrollY = currentScrollY; // Guardar la posición actual
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { scrollDirection, scrollDistance }; // Devolver dirección y distancia
};

export default useScroll;