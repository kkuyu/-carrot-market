import useSWR, { KeyedMutator } from "swr";
import { GetUserResponse } from "@api/users/my";

export interface UserProfile {
  mutate: KeyedMutator<GetUserResponse>;
  loading: boolean;
  user: Partial<GetUserResponse["profile"]> | null;
  currentAddr: {
    emdAddrNm: string | null;
    emdPosNm: string | null;
    emdPosDx: number | null;
    emdPosX: number | null;
    emdPosY: number | null;
  };
}

const useUser = (): UserProfile => {
  const { data, error, mutate } = useSWR<GetUserResponse>("/api/users/my");

  return {
    mutate,
    loading: !data && !error,
    user: data?.profile || data?.dummyProfile || null,
    currentAddr: {
      emdAddrNm: data?.profile?.[`${data?.profile.emdType}_emdAddrNm`] || data?.dummyProfile?.MAIN_emdAddrNm || null,
      emdPosNm: data?.profile?.[`${data?.profile.emdType}_emdPosNm`] || data?.dummyProfile?.MAIN_emdPosNm || null,
      emdPosDx: data?.profile?.[`${data?.profile.emdType}_emdPosDx`] || data?.dummyProfile?.MAIN_emdPosDx || null,
      emdPosX: data?.profile?.[`${data?.profile.emdType}_emdPosX`] || data?.dummyProfile?.MAIN_emdPosX || null,
      emdPosY: data?.profile?.[`${data?.profile.emdType}_emdPosY`] || data?.dummyProfile?.MAIN_emdPosY || null,
    },
  };
};

export default useUser;
