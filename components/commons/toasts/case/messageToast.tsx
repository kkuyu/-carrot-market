import React, { useEffect, useRef, useState } from "react";
import { clearTimer, setTimer, TimerRef } from "@libs/utils";

import { ToastComponentProps } from "@components/commons";
import { ToastExtraProps } from "@components/commons/toasts/toastContainer";

export interface MessageToastProps {
  type?: "default";
  message: string;
}

const MessageToast = (props: MessageToastProps & ToastComponentProps & ToastExtraProps) => {
  const { name, type = "default", placement, message, isAutoHide = true, duration = 1800, delay = 0, order, onClose } = props;

  const [isShow, setIsShow] = useState<boolean | null>(null);

  const transitionDuration = useRef(120);
  const visibleTimer: TimerRef = useRef(null);
  const invisibleTimer: TimerRef = useRef(null);
  const destroyTimer: TimerRef = useRef(null);

  const initToast = async () => {
    // visible
    await setTimer(visibleTimer, delay);
    setIsShow(true);
    // invisible
    if (isAutoHide && duration) {
      await setTimer(invisibleTimer, duration);
      setIsShow(false);
    }
  };

  const destroyToast = async () => {
    // destroy
    await setTimer(destroyTimer, transitionDuration.current);
    onClose();
  };

  const clickClose = () => {
    // close
    if (visibleTimer.current) clearTimer(visibleTimer);
    if (invisibleTimer.current) clearTimer(invisibleTimer);
    setIsShow(false);
  };

  useEffect(() => {
    if (isShow === false) destroyToast();
  }, [isShow]);

  useEffect(() => {
    initToast();
    () => {
      if (visibleTimer.current) clearTimer(visibleTimer);
      if (invisibleTimer.current) clearTimer(invisibleTimer);
      if (destroyTimer.current) clearTimer(destroyTimer);
    };
  }, []);

  return (
    <div
      className={`max-h-0 opacity-0 pointer-events-auto ${placement === "top" ? "mb-2 ease-out" : "mt-2 ease-in"}
        transition-all duration-${transitionDuration.current} ${isShow ? "!max-h-60 !opacity-100" : ""}`}
      style={{ order }}
    >
      {type === "default" ? (
        <div className="flex px-4 py-2 text-white bg-black bg-opacity-70 rounded-md">
          <span className="grow text-sm font-semibold">{message}</span>
        </div>
      ) : (
        <>
          <button type="button" className="" onClick={clickClose}>
            <svg className="block mx-auto w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default MessageToast;
