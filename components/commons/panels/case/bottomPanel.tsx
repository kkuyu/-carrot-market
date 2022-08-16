import type { ReactElement } from "react";
import { useEffect, useRef, useState, cloneElement } from "react";
// @libs
import { TimerRef, setTimer, clearTimer } from "@libs/utils";
import useTouch from "@libs/client/useTouch";
// @components
import { PanelComponentProps } from "@components/commons";

export interface BottomSheetProps {
  isVisible: boolean | null;
  closeBottomPanel: () => void;
}

export interface BottomPanelProps {
  hasHandleBar?: boolean;
  closePanel?: () => void;
  children?: ReactElement<BottomSheetProps>;
}

const BottomPanel = (props: BottomPanelProps & PanelComponentProps) => {
  const { scrim, hasHandleBar = true, closePanel, children, onOpen, onClose } = props;

  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const transitionDuration = useRef(120);
  const destroyTimer: TimerRef = useRef(null);

  const { touchState, touchContainer, touchSeparateContainer } = useTouch({
    updateTouch: ({ currentState }) => {
      if (!touchContainer.current) return;
      if (currentState.moved.directionY === "none") {
        touchContainer.current.style.removeProperty("transition");
        touchContainer.current.style.removeProperty("transform");
      } else if (currentState.moved.directionY === "down") {
        const translateY = `${currentState.moved.movedY || 0}px`;
        touchContainer.current.style.setProperty("transition", "none");
        touchContainer.current.style.setProperty("transform", `translateY(${translateY})`);
      } else {
        const translateY = `${(currentState.moved.movedY || 0) / 3}px`;
        touchContainer.current.style.setProperty("transition", "none");
        touchContainer.current.style.setProperty("transform", `translateY(${translateY})`);
      }
    },
    afterTouch: ({ currentState }) => {
      if (currentState.moved.movedY > 100) closeBottomPanel();
    },
  });

  const destroyBottomPanel = async () => {
    await setTimer(destroyTimer, transitionDuration.current);
    if (closePanel) closePanel();
    onClose();
  };

  const openBottomPanel = () => {
    setIsVisible(true);
  };

  const closeBottomPanel = async () => {
    setIsVisible(false);
    await destroyBottomPanel();
  };

  useEffect(() => {
    openBottomPanel();
    () => {
      clearTimer(destroyTimer);
    };
  }, []);

  return (
    <>
      {scrim === "modal" && (
        <div
          className={`absolute top-0 left-0 right-0 bottom-0 bg-black pointer-events-auto transition-all
          duration-${transitionDuration.current} ${isVisible ? "bg-opacity-50" : "bg-opacity-0"}`}
          onClick={closeBottomPanel}
        />
      )}
      <div
        role="dialog"
        ref={hasHandleBar ? touchContainer : null}
        tabIndex={0}
        className={`absolute bottom-0 left-0 right-0 flex flex-col pt-5 pb-3 max-h-[80%] rounded-t-xl bg-white pointer-events-auto
        before:absolute before:top-5 before:left-0 before:right-0 before:h-2 before:bg-gradient-to-b before:from-white before:z-[1]
        after:absolute after:bottom-3 after:left-0 after:right-0 after:h-2 after:bg-gradient-to-t after:from-white after:z-[1] after:shadow-[0_50vh_0_50vh_rgba(255,255,255,1)]
        transition-all duration-${transitionDuration.current} ${isVisible ? "translate-y-0" : "translate-y-full"}`}
      >
        {hasHandleBar && <span className="absolute top-2.5 left-0 right-0 after:mx-auto after:block after:w-9 after:h-1 after:bg-gray-400 after:rounded-sm" />}
        <div ref={hasHandleBar ? touchSeparateContainer : null} className="relative container grow overflow-auto">
          {children ? cloneElement(children, { isVisible, closeBottomPanel }) : null}
        </div>
      </div>
    </>
  );
};

export default BottomPanel;
