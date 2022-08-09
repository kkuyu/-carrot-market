import useSWR, { KeyedMutator } from "swr";
import { User } from "@prisma/client";
// @api
import { GetUserResponse } from "@api/user";

export interface UserProfile {
  loading: boolean;
  user: (Pick<User, "id" | "name" | "avatar"> & Partial<User>) | null;
  currentAddr: GetUserResponse["currentAddr"];
  type: "member" | "non-member" | "guest" | null;
  mutate: KeyedMutator<GetUserResponse>;
}

const useUser = (): UserProfile => {
  const { data, error, mutate } = useSWR<GetUserResponse>("/api/user");

  return {
    loading: !data && !error,
    user: data?.profile || data?.dummyProfile || null,
    currentAddr: data?.currentAddr!,
    type: !data ? null : data?.profile?.id ? "member" : data?.dummyProfile?.id ? "non-member" : "guest",
    mutate,
  };
};

export default useUser;
