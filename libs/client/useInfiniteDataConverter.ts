import { useEffect, useMemo } from "react";
import { SWRInfiniteResponse } from "swr/infinite/dist/infinite";
// @libs
import useOnScreen from "@libs/client/useOnScreen";
import { ResponseDataType } from "@libs/server/withHandler";

interface UseConvertInfiniteState<T> {
  isReachingEnd: boolean | null;
  isLoading: boolean | null;
  collection: {
    singleValue: { [K in keyof T]: Exclude<T[K], Array<any>> };
    multiValues: { [K in keyof T]: T[K] extends Array<any> ? Array<T[K][number]> : never };
  };
}

const useInfiniteDataConverter = <T extends ResponseDataType>(props: { options?: { mutateConditions?: boolean[] } } & Pick<SWRInfiniteResponse<T>, "data" | "setSize">) => {
  const { data, setSize } = props;
  const { infiniteRef, isVisible, resetScreenState } = useOnScreen();

  const transformCollection = (data?: T[]) => {
    const collection = { singleValue: {}, multiValues: {} } as UseConvertInfiniteState<T>["collection"];
    return !data
      ? collection
      : data.reduce((acc, cur) => {
          Object.entries(cur).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length) {
              acc.multiValues[key as keyof T] = value.reduce((arr, val) => [...arr, val], []);
            } else {
              acc.singleValue[key as keyof T] = value;
            }
          });
          return acc;
        }, collection);
  };

  const currentState = useMemo<UseConvertInfiniteState<T>>(() => {
    return {
      isReachingEnd: (data && data?.[data.length - 1]?.lastCursor === -1) ?? null,
      isLoading: (data && typeof data?.[data.length - 1] === "undefined") ?? null,
      collection: transformCollection(data),
    };
  }, [data]);

  useEffect(() => {
    (async () => {
      if (isVisible && !currentState?.isReachingEnd) {
        await setSize((size) => size + 1);
        resetScreenState();
      }
    })();
  }, [isVisible, currentState?.isReachingEnd]);

  return { infiniteRef, isVisible, ...currentState };
};

export default useInfiniteDataConverter;
