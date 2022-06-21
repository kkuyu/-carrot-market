import { useState, useEffect, MutableRefObject } from "react";

interface useOnScreenProps {
  ref: MutableRefObject<HTMLDivElement | null>;
  rootMargin: string;
}

export default function useOnScreen({ ref, rootMargin = "0px" }: useOnScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { isVisible };
}
