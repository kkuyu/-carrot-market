import { useEffect, useRef } from "react";

interface UseFocusTrapProps {
  keyListeners?: [string, (event: KeyboardEvent) => void][];
}

const useFocusTrap = (props: UseFocusTrapProps) => {
  const { keyListeners } = props;

  const focusTrapContainer = useRef<HTMLDivElement | null>(null);
  const focusAbleEls = useRef<NodeListOf<HTMLElement> | null>(null);
  const baseEl = useRef<HTMLElement | null>(null);

  const keydownTabHandler = (event: KeyboardEvent) => {
    if (!focusAbleEls.current?.length) return;
    const firstEl = focusAbleEls.current[0];
    const lastEl = focusAbleEls.current[focusAbleEls.current.length - 1];
    if (event.target === firstEl) {
      if (!event.shiftKey) return;
      event.preventDefault();
      lastEl.focus();
    }
    if (event.target === lastEl) {
      if (event.shiftKey) return;
      event.preventDefault();
      firstEl.focus();
    }
  };

  const keydownListener = (event: KeyboardEvent) => {
    const keys: UseFocusTrapProps["keyListeners"] = [["Tab", keydownTabHandler], ...(keyListeners ? [...keyListeners] : [])];
    const listener = new Map(keys).get(event.key);
    return listener && listener(event);
  };

  const updateTrapEvent = () => {
    if (!focusTrapContainer.current) return;
    baseEl.current = document.activeElement as HTMLElement | null;
    focusAbleEls.current = focusTrapContainer.current.querySelectorAll("a, button, textarea, input, select, [tabIndex]");
    focusTrapContainer.current.addEventListener("keydown", keydownListener);
    focusAbleEls.current[0]?.focus();
  };

  const removeTrapEvent = () => {
    focusTrapContainer?.current?.removeEventListener("keydown", keydownListener);
    baseEl.current?.focus();
  };

  useEffect(() => {
    updateTrapEvent();
    return () => {
      removeTrapEvent();
    };
  }, []);

  return { focusTrapContainer, focusAbleEls, baseEl };
};

export default useFocusTrap;
