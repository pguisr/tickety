import { useEffect } from 'react';
import Lenis from 'lenis';

export const useSmoothScroll = () => {
  useEffect(() => {
    // Inicializar Lenis para scroll suave
    const lenis = new Lenis({
      duration: 0.8, // Reduzido de 1.2 para 0.8 para scroll mais rápido
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -8 * t)), // Ajustado para ser mais responsivo
      infinite: false,
    });

    // Função de animação
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    // Iniciar loop de animação
    requestAnimationFrame(raf);

    // Cleanup ao desmontar
    return () => {
      lenis.destroy();
    };
  }, []);
};
