import { useEffect } from 'react';

/**
 * Hook to keep CSS variable --vh in sync with the visual viewport height.
 * Useful for mobile browsers where the virtual keyboard changes the viewport size.
 */
export function useViewportHeight() {
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setVh);
    }
    return () => {
      window.removeEventListener('resize', setVh);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setVh);
      }
    };
  }, []);
}
