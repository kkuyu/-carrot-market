import { useEffect, useState } from "react";

interface UseCoordsState {
  state: "denied" | "granted" | "error";
  latitude: number;
  longitude: number;
}

function useCoords() {
  const [coords, setCoords] = useState<UseCoordsState>({ state: "denied", latitude: 0, longitude: 0 });

  const onSuccess = ({ coords: { latitude, longitude } }: GeolocationPosition) => {
    setCoords({ state: "granted", latitude, longitude });
  };
  const onError = (error: GeolocationPositionError) => {
    setCoords({
      state: error.code == error.PERMISSION_DENIED ? "denied" : "error",
      latitude: 0,
      longitude: 0,
    });
  };
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);

  return coords;
}

export default useCoords;
