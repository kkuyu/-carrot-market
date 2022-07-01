import useSWR from "swr";
import { GetUserResponse } from "@api/users/my";

export interface UserProfile {
  loading: boolean;
  user: Partial<GetUserResponse["profile"]> | null;
  currentAddr: {
    emdPosNm: string | null;
    emdPosDx: number | null;
    emdPosX: number | null;
    emdPosY: number | null;
  };
}

const useUser = (): UserProfile => {
  const { data, error } = useSWR<GetUserResponse>("/api/users/my");

  return {
    loading: !data && !error,
    user: data?.profile || data?.dummyProfile || null,
    currentAddr: {
      emdPosNm: data?.profile?.[`${data?.profile.emdType}_emdPosNm`] || data?.dummyProfile?.MAIN_emdPosNm || null,
      emdPosDx: data?.profile?.[`${data?.profile.emdType}_emdPosDx`] || data?.dummyProfile?.MAIN_emdPosDx || null,
      emdPosX: data?.profile?.[`${data?.profile.emdType}_emdPosX`] || data?.dummyProfile?.MAIN_emdPosX || null,
      emdPosY: data?.profile?.[`${data?.profile.emdType}_emdPosY`] || data?.dummyProfile?.MAIN_emdPosY || null,
    },
  };
};

export default useUser;
