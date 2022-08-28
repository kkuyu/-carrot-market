import type { ReactElement } from "react";
import { Children, cloneElement, isValidElement } from "react";
// @components
import { ToastComponentProps } from "@components/commons";

interface ToastContainerProps {
  children: ReactElement | ReactElement[];
}

const ToastContainer = (props: ToastContainerProps) => {
  const { children } = props;

  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<ToastComponentProps>, {
        order: (child as ReactElement<ToastComponentProps>)?.props?.placement === "top" ? index : 100 - index,
      });
    }
    return child;
  });

  return (
    <section id="layout-toast" className="fixed-container top-0 bottom-0 z-[300] pointer-events-none">
      <div className="fixed-inner h-full flex flex-col px-5 py-6">
        {childrenWithProps}
        <div className="grow-full" style={{ order: 50 }} />
      </div>
    </section>
  );
};

export default ToastContainer;
