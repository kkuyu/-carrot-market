// @components
import { ModalComponentProps } from "@components/commons";

export interface MessageModalProps {
  type: "alert" | "confirm";
  hasBackdrop?: boolean;
  message: string;
  cancelBtn?: string;
  confirmBtn?: string;
  onCancel?: () => void;
  onConfirm: () => void;
}

const MessageModal = (props: MessageModalProps & ModalComponentProps) => {
  const { name, type, hasBackdrop = true, message = "message", cancelBtn = "취소", confirmBtn = "확인", onCancel, onConfirm, onOpen, onClose } = props;

  const clickConfirm = async () => {
    if (onConfirm) await onConfirm();
    onClose();
  };

  const clickCancel = async () => {
    if (onCancel) await onCancel();
    onClose();
  };

  return (
    <>
      {hasBackdrop ? <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50" /> : <></>}
      <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
        <div role="dialog" aria-modal="true" aria-labelledby={`${name}-TITLE`} tabIndex={0} className="relative w-72 rounded-lg bg-white border border-gray-300">
          <div id={`${name}-TITLE`} className="px-6 py-8 text-center">
            {message}
          </div>
          <div className="flex border-t divide-x divide-gray-300 border-gray-300">
            {type === "alert" ? (
              <>
                <button className="px-3 py-3 flex-1 text-orange-500" onClick={clickConfirm}>
                  {confirmBtn}
                </button>
              </>
            ) : type === "confirm" ? (
              <>
                <button className="px-3 py-3 flex-1" onClick={clickCancel}>
                  {cancelBtn}
                </button>
                <button className="px-3 py-3 flex-1 text-orange-500" onClick={clickConfirm}>
                  {confirmBtn}
                </button>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageModal;
