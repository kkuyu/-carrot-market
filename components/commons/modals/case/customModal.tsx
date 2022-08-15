import type { ReactElement } from "react";
// @components
import { ModalComponentProps } from "@components/commons";

export interface CustomModalProps {
  children?: ReactElement;
}

const CustomModal = (props: CustomModalProps & ModalComponentProps) => {
  const { name, scrim, children, onOpen, onClose } = props;

  return (
    <>
      {scrim === "modal" && <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 pointer-events-auto" onClick={onClose} />}
      {children ? children : <>CustomModal</>}
    </>
  );
};

export default CustomModal;
