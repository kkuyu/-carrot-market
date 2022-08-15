import { useState, useEffect, useRef } from "react";

interface UseOnScreenProps {
  rootMargin: string;
}

export default function useOnScreen({ rootMargin = "0px" }: UseOnScreenProps) {
  const infiniteRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [observer, setObserver] = useState<null | IntersectionObserver>(null);

  const updateObserver = () => {
    if (!infiniteRef.current) return;
    const io = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin });
    io.observe(infiniteRef.current);
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

  return { infiniteRef, isVisible };
}
