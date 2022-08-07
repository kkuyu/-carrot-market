import { useState, useEffect, MutableRefObject } from "react";

interface useOnScreenProps {
  ref: MutableRefObject<HTMLDivElement | null>;
  rootMargin: string;
}

export default function useOnScreen({ ref, rootMargin = "0px" }: useOnScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [observer, setObserver] = useState<null | IntersectionObserver>(null);

  const updateObserver = () => {
    if (!ref.current) {
      setObserver(() => null);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin });
    io.observe(ref.current);
    setObserver(() => io);
  };

  const removeObserver = () => {
    if (!observer) return;
    observer.disconnect();
  };

  useEffect(() => {
    updateObserver();
    return () => {
      removeObserver();
    };
  }, []);

  useEffect(() => {
    removeObserver();
    updateObserver();
  }, [ref.current]);

  return { isVisible };
}
