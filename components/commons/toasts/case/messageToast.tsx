import React, { useEffect, useRef, useState } from "react";
// @libs
import { TimerRef, setTimer, clearTimer } from "@libs/utils";
// @components
import { ToastComponentProps } from "@components/commons";

export interface MessageToastProps {
  type?: "default";
  message: string;
}

const MessageToast = (props: MessageToastProps & ToastComponentProps) => {
  const { name, type = "default", placement, message, isAutoHide = true, duration = 1800, delay = 0, order, onClose } = props;

  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const transitionDuration = useRef(120);
  const invisibleTimer: TimerRef = useRef(null);
  const destroyTimer: TimerRef = useRef(null);

  const destroyMessageToast = async () => {
    await setTimer(destroyTimer, transitionDuration.current);
    onClose();
  };

  const openMessageToast = async () => {
    setIsVisible(true);
    if (isAutoHide && duration) {
      await setTimer(invisibleTimer, duration);
      setIsVisible(false);
      destroyMessageToast();
    }
  };

  const closeMessageToast = () => {
    if (invisibleTimer.current) clearTimer(invisibleTimer);
    setIsVisible(false);
    destroyMessageToast();
  };

  useEffect(() => {
    openMessageToast();
    () => {
      if (invisibleTimer.current) clearTimer(invisibleTimer);
      if (destroyTimer.current) clearTimer(destroyTimer);
    };
  }, []);

  return (
    <div
      className={`max-h-0 opacity-0 ${placement === "top" ? "mb-2 ease-out" : "mt-2 ease-in"} pointer-events-auto
      transition-all duration-${transitionDuration.current} ${isVisible ? "!max-h-60 !opacity-100" : ""}`}
      style={{ order }}
    >
      {type === "default" && (
        <div className="flex px-4 py-2 text-white bg-black bg-opacity-70 rounded-md">
          <span className="grow text-sm font-semibold">{message}</span>
        </div>
      )}
    </div>
  );
};

export default MessageToast;
