import { useEffect, useState } from "react";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";

interface UseMutationState<T> {
  pending: boolean;
  loading: boolean;
  data?: T | undefined;
  error?: Error | undefined;
}

const useMutation = <T extends ResponseDataType>(
  url: string,
  options?: { onSuccess?: (data: T) => void; onError?: (data: T) => void; onCompleted?: (data: T) => void }
): [(data: any) => void, UseMutationState<T>] => {
  const [state, setState] = useState<UseMutationState<T>>({
    pending: false,
    loading: false,
    data: undefined,
    error: undefined,
  });

  const fetchState = (name: keyof UseMutationState<T>, value: any) => {
    setState((state) => ({ ...state, [name]: value }));
  };

  const mutation = (data: any) => {
    fetchState("pending", true);
    fetchState("loading", true);

    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json().catch((error) => fetchState("error", error)))
      .then((json) => fetchState("data", json))
      .catch((error) => fetchState("error", error))
      .finally(() => fetchState("pending", false));
  };

  useEffect(() => {
    if (state.pending || !state.loading) return;
    (async () => {
      if (state.error) {
        console.error(state.error);
      }
      if (state.data) {
        if (state.data?.error) options?.onError ? await options.onError(state.data) : console.error(state.data);
        if (state.data?.success) options?.onSuccess && (await options.onSuccess(state.data));
        options?.onCompleted && (await options.onCompleted(state.data));
      }
      fetchState("loading", false);
    })();
  }, [state]);

  return [mutation, { ...state }];
};

export default useMutation;
