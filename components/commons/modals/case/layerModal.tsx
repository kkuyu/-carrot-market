import type { ReactElement } from "react";
// @components
import { ModalComponentProps } from "@components/commons";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

export interface LayerModalProps {
  headerType: "default" | "transparent";
  title?: string;
  closeBtnColor?: "text-black" | "text-white";
  closeModal?: () => void;
  children?: ReactElement;
}

const LayerModal = (props: LayerModalProps & ModalComponentProps) => {
  const { name, headerType, title = "", closeBtnColor = "text-black", children, closeModal, onOpen, onClose } = props;

  const closeLayerModal = () => {
    if (closeModal) closeModal();
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={`${name}-TITLE`} tabIndex={0} className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-white pointer-events-auto">
      {headerType === "default" && (
        <div className="flex-none w-full h-12 pl-5 pr-12 flex items-center border-b">
          <strong id={`${name}-TITLE`} className="text-base font-semibold truncate">
            {title}
          </strong>
        </div>
      )}
      <div className="relative grow-full overflow-auto">{children ? children : <>LayerModal</>}</div>
      <Buttons tag="button" type="button" sort="icon-block" size="lg" status="unset" className={`absolute top-0 right-0 ${closeBtnColor}`} onClick={closeLayerModal} aria-label="닫기">
        <Icons name="XMark" className="block mx-auto w-6 h-6" />
      </Buttons>
    </div>
  );
};

export default LayerModal;
