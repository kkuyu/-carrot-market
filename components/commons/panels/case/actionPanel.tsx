import { useEffect, useRef, useState } from "react";
import { clearTimer, setTimer, TimerRef } from "@libs/utils";

import { PanelComponentProps } from "@components/commons";

export interface ActionPanelProps {
  hasBackdrop?: boolean;
  actions: { key: string; text: string; onClick: () => void }[];
  cancelBtn?: string;
}

const ActionPanel = (props: ActionPanelProps & PanelComponentProps) => {
  const { name, hasBackdrop = true, actions = [], cancelBtn = "닫기", onOpen, onClose } = props;

  const [isShow, setIsShow] = useState<boolean | null>(null);

  const transitionDuration = useRef(120);
  const visibleTimer: TimerRef = useRef(null);
  const destroyTimer: TimerRef = useRef(null);

  const initPanel = async () => {
    // visible
    await setTimer(visibleTimer, 0);
    setIsShow(true);
  };

  const destroyPanel = async () => {
    // destroy
    await setTimer(destroyTimer, transitionDuration.current);
    onClose();
  };

  const clickClose = () => {
    // close
    if (visibleTimer.current) clearTimer(visibleTimer);
    setIsShow(false);
  };

  useEffect(() => {
    if (isShow === false) destroyPanel();
  }, [isShow]);

  useEffect(() => {
    initPanel();
    () => {
      if (visibleTimer.current) clearTimer(visibleTimer);
      if (destroyTimer.current) clearTimer(destroyTimer);
    };
  }, []);

  return (
    <>
      {hasBackdrop ? <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 pointer-events-auto" onClick={clickClose} /> : <></>}
      <div
        tabIndex={0}
        className={`absolute -bottom-5 left-5 right-5 z-1 opacity-0
          transition-all duration-${transitionDuration.current} ${isShow ? "!bottom-5 !opacity-100" : ""}`}
      >
        <div className="bg-white rounded-lg divide-y">
          {actions.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                item.onClick();
                clickClose();
              }}
              className={`block w-full px-2 py-3 text-center ${item.key === "delete" ? "text-red-500" : ""} ${item.key === "welcome" ? "text-orange-500" : ""}`}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-lg">
          <button type="button" onClick={clickClose} className="mt-3 block w-full px-2 py-3 text-center">
            {cancelBtn}
          </button>
        </div>
      </div>
    </>
  );
};

export default ActionPanel;
