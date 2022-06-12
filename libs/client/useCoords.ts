import { useEffect, useState } from "react";

interface UseCoordsState {
  state: "denied" | "granted" | "error";
  latitude: number | null;
  longitude: number | null;
}

function useCoords() {
  const [coords, setCoords] = useState<UseCoordsState>({ state: "denied", latitude: null, longitude: null });
  const onSuccess = ({ coords: { latitude, longitude } }: GeolocationPosition) => {
    setCoords({ state: "granted", latitude, longitude });
  };
  const onError = (error: GeolocationPositionError) => {
    setCoords({
      state: error.code == error.PERMISSION_DENIED ? "denied" : "error",
      latitude: null,
      longitude: null,
    });
  };
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);
  return coords;
}

export default useCoords;
