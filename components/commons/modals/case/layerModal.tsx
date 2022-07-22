import React from "react";
// @components
import { ModalComponentProps } from "@components/commons";

export interface LayerModalProps {
  headerType: "default" | "transparent";
  title?: string;
  closeColor?: string;
  contents: React.ReactNode;
}

const LayerModal = (props: LayerModalProps & ModalComponentProps) => {
  const { name, headerType, title = "", closeColor = "black", contents, onOpen, onClose } = props;

  const clickClose = () => {
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={`${name}-TITLE`} tabIndex={0} className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-white z-1">
      {headerType === "default" && (
        <div className="flex-none w-full h-12 pl-5 pr-12 flex items-center border-b">
          <strong id={`${name}-TITLE`} className="text-base font-semibold font-semibold truncate">
            {title}
          </strong>
        </div>
      )}
      <div className="relative grow overflow-auto">{contents}</div>
      <button type="button" className={`absolute top-0 right-0 p-3 ${closeColor ? `text-${closeColor}` : ""}`} onClick={clickClose}>
        <svg className="block mx-auto w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
};

export default LayerModal;
