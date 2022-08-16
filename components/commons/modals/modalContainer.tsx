import type { ReactElement } from "react";
import { useEffect } from "react";
// @libs
import useFocusTrap from "@libs/client/useFocusTrap";
// @components
import { ModalComponentProps } from "@components/commons";

interface ModalContainerProps extends Pick<ModalComponentProps, "onClose"> {
  children: ReactElement;
}

const ModalContainer = (props: ModalContainerProps) => {
  const { children, onClose } = props;

  const { focusTrapContainer, baseEl } = useFocusTrap({
    keyListeners: [["Escape", (event: KeyboardEvent) => onClose()]],
  });

  useEffect(() => {
    return () => {
      baseEl.current?.focus();
    };
  }, []);

  return (
    <section ref={focusTrapContainer} id="layout-modal" className="fixed-container top-0 bottom-0 z-[200] pointer-events-none">
      <div className="fixed-inner h-full">{children}</div>
    </section>
  );
};

export default ModalContainer;
