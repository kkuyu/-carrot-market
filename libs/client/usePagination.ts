import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface UsePaginationState {
  isInfiniteScroll?: boolean;
}

interface UsePaginationReturn {
  page: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function usePagination({ isInfiniteScroll = false }: UsePaginationState): UsePaginationReturn {
  const [page, setPage] = useState(1);

  const increment = () => setPage((x) => x + 1);
  const decrement = () => setPage((x) => x - 1);
  const reset = () => setPage(1);

  const handleScroll = () => {
    const { innerHeight } = window;
    const { scrollTop, scrollHeight } = document.documentElement;

    if (scrollTop + innerHeight === scrollHeight) {
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (isInfiniteScroll) window.addEventListener("scroll", handleScroll);
    return () => {
      if (isInfiniteScroll) window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { page, increment, decrement, reset, setPage };
}
