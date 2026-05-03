import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setLoadError('Failed to load Google Maps script'));
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      setLoadError('Google Maps API key is missing');
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps script');
    };

    document.head.appendChild(script);

  }, []);

  return { isLoaded, loadError };
}
