import React, { useRef, useEffect } from "react";

import { ModalComponentProps } from "@components/commons";

interface ModalContainerProps extends Pick<ModalComponentProps, "onClose"> {
  children: React.ReactNode;
}

const ModalContainer = ({ children, onClose }: ModalContainerProps) => {
  const container = useRef<HTMLDivElement>(null);
  const baseEl = useRef<HTMLElement | null>(null);
  const focusAbleEls = useRef<NodeListOf<HTMLElement> | null>(null);

  const keydownTab = (event: KeyboardEvent) => {
    if (!focusAbleEls.current?.length) return;

    if (event.target === focusAbleEls.current[0]) {
      if (!event.shiftKey) return;
      event.preventDefault();
      focusAbleEls.current[focusAbleEls.current.length - 1].focus();
    }

    if (event.target === focusAbleEls.current[focusAbleEls.current.length - 1]) {
      if (event.shiftKey) return;
      event.preventDefault();
      focusAbleEls.current[0].focus();
    }
  };

  const keydownEsc = (event: KeyboardEvent) => {
    onClose();
  };

  const keys = new Map([
    ["Escape", keydownEsc],
    ["Tab", keydownTab],
  ]);
  const keydownListener = (event: KeyboardEvent) => {
    const listener = keys.get(event.key);
    return listener && listener(event);
  };

  useEffect(() => {
    if (!container.current) return;
    baseEl.current = document.activeElement as HTMLElement | null;
    focusAbleEls.current = container.current.querySelectorAll("a, button, textarea, input, select, [tabIndex]");
    container.current.addEventListener("keydown", keydownListener);
    focusAbleEls.current[0]?.focus();
  }, [container]);

  useEffect(() => {
    return () => {
      baseEl.current?.focus();
    };
  }, []);

  return (
    <section ref={container} className="fixed top-0 left-0 w-full z-200">
      <div className="relative mx-auto w-full max-w-xl h-max-fullScreen">{children}</div>
    </section>
  );
};

export default ModalContainer;
