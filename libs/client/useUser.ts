import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

function useUser() {
  const router = useRouter();

  const { data, error } = useSWR("/api/users/me");

  useEffect(() => {
    if (data && !data.success) {
      router.replace("/enter");
    }
  }, [data, router]);

  return {
    isLoading: !data && !error,
    user: data?.profile,
  };
}

export default useUser;
