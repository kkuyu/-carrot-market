import { useState, useEffect } from "react";
// @libs
import { getDiffTimeStr as getTimeDiff } from "@libs/utils";

const useTimeDiff = (timeTarget: string | null) => {
  const [isMounted, setIsMounted] = useState(false);
  const [timeState, setTimeState] = useState<{ today: Date | null; diffStr: string }>({ today: null, diffStr: "" });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!timeTarget) return;
    setTimeState(() => {
      const today = new Date();
      return { today, diffStr: getTimeDiff(new Date(timeTarget).getTime(), today?.getTime()) };
    });
  }, [timeTarget]);

  return { isMounted, timeState };
};

export default useTimeDiff;
