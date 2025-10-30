
import { useState, useCallback } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Geolocation permission denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('The request to get user location timed out.');
            break;
          default:
            setError('An unknown error occurred.');
            break;
        }
      }
    );
  }, []);

  return { location, error, requestLocation };
};

export default useGeolocation;
