import { useState, useEffect } from "react";
// @libs
import { getDiffTimeStr as getTimeDiff, TimeConfig } from "@libs/utils";

const useTimeDiff = (timeTarget: string | null, options?: { config?: TimeConfig }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [timeState, setTimeState] = useState<{ dateFrom: Date | null; dateTo: Date | null; diffStr: string }>({ dateFrom: null, dateTo: null, diffStr: "" });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!timeTarget) return;
    setTimeState(() => {
      const dateFrom = options?.config?.type !== "presentToPast" ? new Date(timeTarget) : new Date();
      const dateTo = options?.config?.type !== "presentToPast" ? new Date() : new Date(timeTarget);
      return { dateFrom, dateTo, diffStr: getTimeDiff(dateFrom.getTime(), dateTo.getTime(), options?.config) };
    });
  }, [timeTarget]);

  return { isMounted, timeState };
};

export default useTimeDiff;
