import { useEffect, useState } from "react";
// @libs
import { ResponseDataType } from "@libs/server/withHandler";

interface UseMutationState<T> {
  loading: boolean;
  data?: T | undefined;
  error?: Error | undefined;
}

const useMutation = <T extends ResponseDataType>(url: string, options?: { onSuccess?: (data: T) => void; onError?: (data: T) => void }): [(data: any) => void, UseMutationState<T>] => {
  // state
  const [state, setState] = useState<UseMutationState<T>>({
    loading: false,
    data: undefined,
    error: undefined,
  });
  const fetchState = (name: keyof UseMutationState<T>, value: any) => {
    setState((state) => ({ ...state, [name]: value }));
  };

  // data fetch
  const mutation = (data: any) => {
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
      .finally(() => fetchState("loading", false));
  };

  // options callback
  useEffect(() => {
    if (!Boolean(options)) return;
    if (!state || state.loading) return;
    if (state.data?.error?.timestamp) {
      options?.onError && options.onError(state.data);
    }
    if (state.data?.success) {
      options?.onSuccess && options.onSuccess(state.data);
    } else if (state?.data) {
      options?.onError && options.onError(state?.data);
    }
    if (state.error) {
      console.error(state.error);
    }
  }, [state]);

  return [mutation, { ...state }];
};

export default useMutation;
