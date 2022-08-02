import useSWR, { KeyedMutator } from "swr";
import { User } from "@prisma/client";
// @api
import { GetUserResponse } from "@api/users/my";

export interface UserProfile {
  mutate: KeyedMutator<GetUserResponse>;
  loading: boolean;
  user: (Pick<User, "id" | "name" | "avatar"> & Partial<User>) | null;
  currentAddr: GetUserResponse["currentAddr"];
}

const useUser = (): UserProfile => {
  const { data, error, mutate } = useSWR<GetUserResponse>("/api/users/my");

  return {
    mutate,
    loading: !data && !error,
    user: data?.profile || data?.dummyProfile || null,
    currentAddr: data?.currentAddr!,
  };
};

export default useUser;
