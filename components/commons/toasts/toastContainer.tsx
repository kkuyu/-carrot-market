import React, { Children, cloneElement, isValidElement } from "react";

interface ToastContainerProps {
  children: React.ReactNode;
}

export interface ToastExtraProps {
  order: number;
}

const ToastContainer = (props: ToastContainerProps) => {
  const { children } = props;

  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as React.ReactElement<ToastExtraProps>, { order: child.props.placement === "top" ? index : 100 - index });
    }
    return child;
  });

  return (
    <section id="layout-toast" className="fixed-container top-0 bottom-0 z-[300] pointer-events-none">
      <div className="fixed-inner h-full flex flex-col px-5 py-6">
        {childrenWithProps}
        <div className="grow" style={{ order: 50 }} />
      </div>
    </section>
  );
};

export default ToastContainer;
