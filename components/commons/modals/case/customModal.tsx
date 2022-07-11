// @components
import { ModalComponentProps } from "@components/commons";

export interface CustomModalProps {
  hasBackdrop?: boolean;
  contents: React.ReactNode;
}

const CustomModal = (props: CustomModalProps & ModalComponentProps) => {
  const { name, hasBackdrop = true, contents, onOpen, onClose } = props;

  return (
    <>
      {hasBackdrop ? <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 pointer-events-auto" onClick={() => onClose()} /> : <></>}
      {contents}
    </>
  );
};

export default CustomModal;
