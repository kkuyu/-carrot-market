import { useState } from "react";
interface UseMutationState<T> {
  loading: boolean;
  data?: T;
  error?: object;
}

type UseMutationResult<T> = [(data: any) => void, UseMutationState<T>];

const useMutation = <T,>(url: string): UseMutationResult<T> => {
  const [state, setState] = useState<UseMutationState<T>>({
    loading: false,
    data: undefined,
    error: undefined,
  });

  const fetchState = (name: keyof UseMutationState<T>, value: any) => {
    setState((state) => ({ ...state, [name]: value }));
  };

  const mutation = (data: any) => {
    fetchState("loading", true);

    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json().catch(() => {}))
      .then((json) => fetchState("data", json))
      .catch((error) => fetchState("error", error))
      .finally(() => fetchState("loading", false));
  };

  return [mutation, { ...state }];
};

export default useMutation;
