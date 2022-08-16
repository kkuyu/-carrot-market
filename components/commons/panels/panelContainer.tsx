import type { ReactElement } from "react";
import React, { useEffect } from "react";
// @libs
import useFocusTrap from "@libs/client/useFocusTrap";
// @components
import { PanelComponentProps } from "@components/commons";

interface PanelContainerProps extends Pick<PanelComponentProps, "onClose"> {
  children: ReactElement;
}

const PanelContainer = (props: PanelContainerProps) => {
  const { children, onClose } = props;

  const { focusTrapContainer, baseEl } = useFocusTrap({
    keyListeners: [["Escape", (event: KeyboardEvent) => onClose()]],
  });

  useEffect(() => {
    return () => {
      baseEl?.current?.focus();
    };
  }, []);

  return (
    <section ref={focusTrapContainer} id="layout-panel" className="fixed-container top-0 bottom-0 z-[200] pointer-events-none">
      <div className="fixed-inner h-full">{children}</div>
    </section>
  );
};

export default PanelContainer;
