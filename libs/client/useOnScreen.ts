import { useState, useEffect, useRef } from "react";

interface UseOnScreenState {
  isVisible: boolean;
}

const useOnScreen = () => {
  const [screenState, setScreenState] = useState<UseOnScreenState>({ isVisible: false });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const infiniteRef = useRef<HTMLDivElement | null>(null);

  const resetScreenState = () => {
    setScreenState(() => ({ isVisible: false }));
  };

  const updateObserver = () => {
    if (!infiniteRef.current) return;
    const io = new IntersectionObserver(
      ([entry], observer) => {
        setScreenState((prev) => ({ ...prev, isVisible: entry.isIntersecting }));
      },
      { rootMargin: "100px" }
    );
    io.observe(infiniteRef.current);
    observerRef.current = io;
  };

  const removeObserver = () => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
    resetScreenState();
  };

  useEffect(() => {
    updateObserver();
    return () => {
      removeObserver();
    };
  }, []);

  return { infiniteRef, ...screenState, resetScreenState };
};

export default useOnScreen;
