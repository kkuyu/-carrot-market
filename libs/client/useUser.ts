import { useEffect, useState } from "react";
import { User } from "@prisma/client";
import useSWR from "swr";

interface UserResponse {
  success: boolean;
  profile: User;
}

function useUser() {
  const { data, error } = useSWR<UserResponse>("/api/users/my");

  return {
    isLoading: !data && !error,
    user: data?.profile,
  };
}

export default useUser;
