import React, { Children, cloneElement, isValidElement } from "react";

interface ToastContainerProps {
  children: React.ReactNode;
}

export interface ToastExtraProps {
  order: number;
}

const ToastContainer = ({ children }: ToastContainerProps) => {
  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as React.ReactElement<ToastExtraProps>, { order: child.props.placement === "top" ? index : 100 - index });
    }
    return child;
  });

  return (
    <section id="layout-toast" className="fixed top-0 left-0 right-0 bottom-0 w-full z-[300] pointer-events-none">
      <div className="relative mx-auto w-full max-w-xl h-full flex flex-col px-5 py-6">
        {childrenWithProps}
        <div className="grow" style={{ order: 50 }} />
      </div>
    </section>
  );
};

export default ToastContainer;
