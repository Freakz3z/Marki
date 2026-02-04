import { useEffect, type RefObject } from 'react';

/**
 * Adds a class to the element when scrolling, and removes it after a delay.
 * Usage: To show scrollbars while scrolling.
 */
export function useScrollClass(ref: RefObject<HTMLElement | null>, className: string = 'is-scrolling', delay: number = 1000) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timeoutId: any;

    const handleScroll = () => {
      // Add class immediately
      if (!element.classList.contains(className)) {
        element.classList.add(className);
      }
      
      // Reset timeout
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Only remove if not hovering? The user wants "Stop scrolling: wait 1s, fade out".
        // If hovering, CSS :hover rule will keep it visible regardless of this class.
        // So safe to remove this class.
        element.classList.remove(className);
      }, delay);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      element.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [ref, className, delay]);
}
