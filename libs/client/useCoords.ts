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
    if (error.code == error.PERMISSION_DENIED) {
      setCoords({ state: "denied", latitude: null, longitude: null });
    } else {
      setCoords({ state: "error", latitude: null, longitude: null });
    }
  };
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);
  return coords;
}

export default useCoords;
