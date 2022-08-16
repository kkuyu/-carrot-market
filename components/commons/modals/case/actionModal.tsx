import type { HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
// @libs
import { TimerRef, setTimer, clearTimer } from "@libs/utils";
// @components
import Buttons from "@components/buttons";
import { ModalComponentProps } from "@components/commons";

export const ActionStyleEnum = {
  ["default"]: "default",
  ["destructive"]: "destructive",
  ["primary"]: "primary",
  ["cancel"]: "cancel",
} as const;

export type ActionStyleEnum = typeof ActionStyleEnum[keyof typeof ActionStyleEnum];

export interface ActionModalProps {
  title?: string;
  message?: string;
  actions: { key: string; style: ActionStyleEnum; text: string; handler: (() => void) | null }[];
}

const ActionModal = (props: ActionModalProps & ModalComponentProps) => {
  const { name, scrim, title, message, actions, onOpen, onClose } = props;

  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const transitionDuration = useRef(120);
  const destroyTimer: TimerRef = useRef(null);

  const normalActions = actions.filter((action) => action.style !== "cancel");
  const cancelActions = actions.filter((action) => action.style === "cancel");

  const destroyActionModal = async () => {
    await setTimer(destroyTimer, transitionDuration.current);
    const [cancelAction] = cancelActions;
    if (cancelAction?.handler) await cancelAction.handler();
    onClose();
  };

  const openActionModal = async () => {
    setIsVisible(true);
  };

  const closeActionModal = () => {
    setIsVisible(false);
    destroyActionModal();
  };

  const ActionGroups = (groupProps: { groupActions: ActionModalProps["actions"] } & HTMLAttributes<HTMLDivElement>) => {
    const { groupActions, className: groupClassName = "" } = groupProps;
    if (!groupActions.length) return null;
    return (
      <div className={`flex flex-col divide-y divide-gray-300 ${groupClassName}`}>
        {groupActions.map((action) => (
          <Buttons
            key={action.key}
            tag="button"
            type="button"
            sort="text-link"
            text={action.text}
            status={action.style === "destructive" ? "danger" : action.style === "primary" ? "primary" : "unset"}
            onClick={async () => {
              if (action?.handler) await action?.handler();
              onClose();
            }}
            className="flex-1 pl-3 pr-3 py-2.5 text-center font-normal"
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (cancelActions.length <= 1) return;
    console.error("ActionModal", cancelActions);
  }, [cancelActions]);

  useEffect(() => {
    openActionModal();
    () => {
      clearTimer(destroyTimer);
    };
  }, []);

  return (
    <>
      {scrim === "modal" && (
        <div
          className={`absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 pointer-events-auto
          transition-all duration-${transitionDuration.current} ${isVisible ? "bg-opacity-50" : "bg-opacity-0"}
          `}
          onClick={closeActionModal}
        />
      )}
      <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-end px-5 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${name}-TITLE`}
          tabIndex={0}
          className={`relative w-full pointer-events-auto
          [&>div]:border [&>div]:border-gray-300 [&>div]:bg-white [&>div]:rounded-lg
          transition-all duration-${transitionDuration.current} ${isVisible ? "-translate-y-5 opacity-100" : "translate-y-5 opacity-0"}
          `}
        >
          <div>
            {Boolean(title || message) && (
              <div id={`${name}-TITLE`} className="flex flex-col justify-center min-h-[5.25rem] px-5 py-5 text-center border-b border-gray-300 whitespace-pre-wrap">
                {title && <strong>{title}</strong>}
                {message && <span className="block">{message}</span>}
              </div>
            )}
            {Boolean(normalActions.length) && <ActionGroups groupActions={normalActions} />}
          </div>
          <div className="mt-3">{Boolean(cancelActions.length) && <ActionGroups groupActions={cancelActions} />}</div>
        </div>
      </div>
    </>
  );
};

export default ActionModal;
