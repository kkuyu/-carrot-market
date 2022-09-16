import { useEffect, useState } from "react";

export const CoordsStateEnum = {
  ["loading"]: "loading",
  ["denied"]: "denied",
  ["granted"]: "granted",
  ["error"]: "error",
} as const;

export type CoordsStateEnum = typeof CoordsStateEnum[keyof typeof CoordsStateEnum];

interface UseCoordsState {
  state: CoordsStateEnum;
  latitude: number;
  longitude: number;
}

const useCoords = (): UseCoordsState & { mutate: () => void } => {
  const [coords, setCoords] = useState<UseCoordsState>({ state: CoordsStateEnum.loading, latitude: 0, longitude: 0 });

  const onSuccess = ({ coords: { latitude, longitude } }: GeolocationPosition) => {
    setCoords({ state: CoordsStateEnum.granted, latitude, longitude });
  };

  const onError = (error: GeolocationPositionError) => {
    setCoords({
      state: error.code == error.PERMISSION_DENIED ? CoordsStateEnum.denied : CoordsStateEnum.error,
      latitude: 0,
      longitude: 0,
    });
  };

  const mutate = () => {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  };

  useEffect(() => {
    mutate();
  }, []);

  return { ...coords, mutate };
};

export default useCoords;
