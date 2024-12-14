import { useEffect } from 'react';

const useScrollDetection = (callback) => {
  useEffect(() => {
    const handleWheel = (event) => {
      if (event.deltaY !== 0 || event.deltaX !== 0) {
        // Llama al callback con la dirección del desplazamiento
        callback({
          deltaX: event.deltaX,
          deltaY: event.deltaY,
        });
      }
    };

    // Agrega el listener para el evento `wheel` al documento
    window.addEventListener('wheel', handleWheel, { passive: true });

    // Limpieza del listener cuando el componente se desmonta
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [callback]);
};

export default useScrollDetection;