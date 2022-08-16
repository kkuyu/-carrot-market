import { useState, useEffect, useRef } from "react";

interface TouchStateType {
  start: { touchX: number; touchY: number };
  moved: { movedX: number; movedY: number; directionX: "none" | "left" | "right"; directionY: "none" | "up" | "down" };
}

interface UseTouchProps {
  updateTouch?: (params: { currentState: TouchStateType }) => void;
  afterTouch?: (params: { currentState: TouchStateType }) => void;
}

const useTouch = (props: UseTouchProps) => {
  const { updateTouch, afterTouch } = props;

  const [touchState, setTouchState] = useState<TouchStateType>({
    start: { touchX: 0, touchY: 0 },
    moved: { movedX: 0, movedY: 0, directionX: "none", directionY: "none" },
  });

  const touchContainer = useRef<HTMLDivElement | null>(null);
  const touchSeparateContainer = useRef<HTMLDivElement | null>(null);

  const touchStartHandler = (e: TouchEvent | MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!touchContainer.current) return;
    if (touchSeparateContainer.current?.contains(e?.target as HTMLElement)) return;
    setTouchState((prev) => {
      const currentTouch = e instanceof TouchEvent ? e.touches?.[0] : e;
      const touchX = currentTouch.clientX;
      const touchY = currentTouch.clientY;
      return prev && { ...prev, start: { touchX, touchY } };
    });
    document.addEventListener("mousemove", touchMoveHandler);
    document.addEventListener("mouseup", touchEndHandler, { once: true });
    document.addEventListener("touchmove", touchMoveHandler, { passive: false });
    document.addEventListener("touchend", touchEndHandler, { once: true });
  };

  const touchMoveHandler = (e: TouchEvent | MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!touchContainer.current) return;
    setTouchState((prev) => {
      const currentTouch = e instanceof TouchEvent ? e.touches?.[0] : e;
      const [prevX, prevY] = [prev?.start?.touchX || currentTouch.clientX, prev?.start?.touchY || currentTouch.clientY];
      const directionX = prevX > currentTouch.clientX ? "left" : "right";
      const directionY = prevY > currentTouch.clientY ? "up" : "down";
      const movedX = currentTouch.clientX - prevX;
      const movedY = currentTouch.clientY - prevY;
      return prev && { ...prev, moved: { directionX, directionY, movedX, movedY } };
    });
  };

  const touchEndHandler = (e: TouchEvent | MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!touchContainer.current) return;
    setTouchState((prev) => {
      if (afterTouch) afterTouch({ currentState: { ...prev } });
      return {
        start: { touchX: 0, touchY: 0 },
        moved: { movedX: 0, movedY: 0, directionX: "none", directionY: "none" },
      };
    });
    document.removeEventListener("mousemove", touchMoveHandler);
    document.removeEventListener("mouseup", touchEndHandler);
    document.removeEventListener("touchmove", touchMoveHandler);
    document.removeEventListener("touchend", touchEndHandler);
  };

  const updateTouchEvent = () => {
    if (!touchContainer.current) return;
    touchContainer.current.addEventListener("touchstart", touchStartHandler);
    touchContainer.current.addEventListener("mousedown", touchStartHandler);
  };

  const removeTouchEvent = () => {
    if (!touchContainer.current) return;
    touchContainer.current.removeEventListener("touchstart", touchStartHandler);
    touchContainer.current.removeEventListener("mousedown", touchStartHandler);
  };

  useEffect(() => {
    if (updateTouch) updateTouch({ currentState: touchState });
  }, [touchState]);

  useEffect(() => {
    updateTouchEvent();
    return () => {
      removeTouchEvent();
    };
  }, []);

  return { touchState, touchContainer, touchSeparateContainer };
};

export default useTouch;
