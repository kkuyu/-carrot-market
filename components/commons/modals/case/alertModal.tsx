import type { HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
// @libs
import { TimerRef, setTimer, clearTimer } from "@libs/utils";
// @components
import { ModalComponentProps } from "@components/commons";
import Buttons from "@components/buttons";

export const AlertStyleEnum = {
  ["default"]: "default",
  ["destructive"]: "destructive",
  ["primary"]: "primary",
  ["cancel"]: "cancel",
} as const;

export type AlertStyleEnum = typeof AlertStyleEnum[keyof typeof AlertStyleEnum];

export interface AlertModalProps {
  title?: string;
  message?: string;
  actions: { key: string; style: AlertStyleEnum; text: string; handler: (() => void) | null }[];
}

const AlertModal = (props: AlertModalProps & ModalComponentProps) => {
  const { name, scrim, title, message, actions, onOpen, onClose } = props;

  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const transitionDuration = useRef(120);
  const destroyTimer: TimerRef = useRef(null);

  const normalActions = actions.filter((action) => action.style !== "cancel");
  const cancelActions = actions.filter((action) => action.style === "cancel");

  const destroyAlertModal = async () => {
    await setTimer(destroyTimer, transitionDuration.current);
    const [cancelAction] = cancelActions;
    if (cancelAction?.handler) await cancelAction.handler();
    onClose();
  };

  const openAlertModal = async () => {
    setIsVisible(true);
  };

  const closeAlertModal = () => {
    setIsVisible(false);
    destroyAlertModal();
  };

  const ActionGroups = (groupProps: { groupActions: AlertModalProps["actions"] } & HTMLAttributes<HTMLDivElement>) => {
    const { groupActions, className: groupClassName = "" } = groupProps;
    if (!groupActions.length) return null;
    return (
      <div className={`flex divide-gray-300 ${groupActions.length <= 2 ? "divide-x" : "flex-col divide-y"} ${groupClassName}`}>
        {groupActions.map((action) => (
          <Buttons
            key={action.key}
            tag="button"
            type="button"
            sort="text-link"
            status={action.style === "destructive" ? "danger" : action.style === "primary" ? "primary" : "unset"}
            onClick={async () => {
              if (action?.handler) await action?.handler();
              onClose();
            }}
            className="flex-1 pl-3 pr-3 py-2.5 text-center font-normal"
          >
            {action.text}
          </Buttons>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (cancelActions.length <= 1) return;
    console.error("AlertModal", cancelActions);
  }, [cancelActions]);

  useEffect(() => {
    openAlertModal();
    () => {
      clearTimer(destroyTimer);
    };
  }, []);

  return (
    <>
      {scrim === "modal" && (
        <div
          className={`absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 pointer-events-auto
          transition-all duration-${transitionDuration.current} ${isVisible ? "bg-opacity-50" : "bg-opacity-0"}`}
          onClick={closeAlertModal}
        />
      )}
      <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${name}-TITLE`}
          tabIndex={0}
          className={`relative w-72 rounded-lg bg-white border border-gray-300 pointer-events-auto
          [&>div]:border [&>div]:border-gray-300 [&>div]:bg-white [&>div]:rounded-lg
          transition-all duration-${transitionDuration.current} ${isVisible ? "scale-100 opacity-100" : "scale-105 opacity-0"}
          `}
        >
          <div>
            {Boolean(title || message) && (
              <div id={`${name}-TITLE`} className="flex flex-col justify-center min-h-[5.25rem] px-5 py-5 text-center border-b border-gray-300 whitespace-pre-wrap">
                {title && <strong>{title}</strong>}
                {message && <span className="block">{message}</span>}
              </div>
            )}
            {Boolean([...normalActions, ...cancelActions].length) && <ActionGroups groupActions={[...normalActions, ...cancelActions]} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertModal;
