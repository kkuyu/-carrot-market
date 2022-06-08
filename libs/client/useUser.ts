import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { User } from "@prisma/client";
import useSWR from "swr";

interface UserResponse {
  success: boolean;
  profile: User;
}

function useUser() {
  const router = useRouter();

  const { data, error } = useSWR<UserResponse>("/api/users/me");

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
