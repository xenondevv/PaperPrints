'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useGoogleMaps from '../hooks/useGoogleMaps';

export default function LocationPicker({
  initialLat,
  initialLng,
  initialAddress,
  onLocationSelect,
}) {
  const { isLoaded, loadError } = useGoogleMaps();

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const geocoderRef = useRef(null);

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India
  const defaultZoom = 5;
  const selectedZoom = 17;

  // Sync initial props into state (handles async profile fetch in settings page)
  const initialSyncedRef = useRef(false);
  useEffect(() => {
    if (initialSyncedRef.current) return;
    if (initialLat != null && initialLng != null) {
      setLat(parseFloat(initialLat));
      setLng(parseFloat(initialLng));
      setAddress(initialAddress || '');
      initialSyncedRef.current = true;

      // If map is already loaded, pan to the initial location
      if (mapRef.current && markerRef.current) {
        const pos = { lat: parseFloat(initialLat), lng: parseFloat(initialLng) };
        mapRef.current.setCenter(pos);
        mapRef.current.setZoom(selectedZoom);
        markerRef.current.setPosition(pos);
        markerRef.current.setMap(mapRef.current);
      }
    }
  }, [initialLat, initialLng, initialAddress]);

  // Reverse geocode a lat/lng and update state
  const reverseGeocode = useCallback((latLng, newLat, newLng) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
    geocoderRef.current.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setAddress(results[0].formatted_address);
        if (searchInputRef.current) {
          searchInputRef.current.value = results[0].formatted_address;
        }
      } else {
        setAddress(`${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
      }
    });
  }, []);

  // Handle map click or marker drag
  const handleLocationChange = useCallback((latLng) => {
    const newLat = latLng.lat();
    const newLng = latLng.lng();
    setLat(newLat);
    setLng(newLng);
    setLocationError('');
    setConfirmed(false);

    if (markerRef.current && mapRef.current) {
      markerRef.current.setPosition(latLng);
      markerRef.current.setMap(mapRef.current);
    }

    reverseGeocode(latLng, newLat, newLng);
  }, [reverseGeocode]);

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialized

    const hasInitial = lat != null && lng != null;
    const center = hasInitial ? { lat: parseFloat(lat), lng: parseFloat(lng) } : defaultCenter;
    const zoom = hasInitial ? selectedZoom : defaultZoom;

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: hasInitial ? mapRef.current : null,
      draggable: true,
    });

    // Map click event
    mapRef.current.addListener('click', (e) => {
      handleLocationChange(e.latLng);
    });

    // Marker drag end event
    markerRef.current.addListener('dragend', (e) => {
      handleLocationChange(e.latLng);
    });

  }, [isLoaded, handleLocationChange, lat, lng]);

  // Initialize Autocomplete
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current) return;
    if (autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'formatted_address', 'name'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const newLatLng = place.geometry.location;
      setLat(newLatLng.lat());
      setLng(newLatLng.lng());
      setAddress(place.formatted_address || place.name);
      setLocationError('');
      setConfirmed(false);

      if (mapRef.current && markerRef.current) {
        mapRef.current.setCenter(newLatLng);
        mapRef.current.setZoom(selectedZoom);
        markerRef.current.setPosition(newLatLng);
        markerRef.current.setMap(mapRef.current);
      }
    });

  }, [isLoaded]);

  // Handle Get Current Location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        handleLocationChange(latLng);
        if (mapRef.current) {
          mapRef.current.setCenter(latLng);
          mapRef.current.setZoom(selectedZoom);
        }
        setIsDetecting(false);
      },
      () => {
        setLocationError("Could not get your location. Please search or click on the map.");
        setIsDetecting(false);
      }
    );
  };

  const handleConfirm = () => {
    if (lat != null && lng != null) {
      onLocationSelect({ address, lat, lng });
      setConfirmed(true);
    }
  };

  if (loadError) {
    return <div style={{ color: '#B91C1C', padding: 16 }}>Error loading Google Maps: {loadError}</div>;
  }

  const hasLocation = lat != null && lng != null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Search Input */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Search Location</label>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for your shop..."
          defaultValue={initialAddress || ''}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid #D1D5DB', fontSize: 14, color: '#111',
            outline: 'none', boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = '#0D9488'}
          onBlur={e => e.target.style.borderColor = '#D1D5DB'}
        />
      </div>

      {/* Map Display */}
      <div
        ref={mapContainerRef}
        style={{
          height: 350,
          width: '100%',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          background: '#F9FAFB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!isLoaded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 14 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #E5E7EB', borderTopColor: '#0D9488', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading Map...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      {/* Use Current Location Button & Error */}
      <div>
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isDetecting || !isLoaded}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            color: '#374151', background: '#FFFFFF', border: '1px solid #D1D5DB',
            cursor: (isDetecting || !isLoaded) ? 'not-allowed' : 'pointer',
            opacity: (isDetecting || !isLoaded) ? 0.7 : 1, transition: 'background 0.15s'
          }}
          onMouseEnter={e => { if (!isDetecting && isLoaded) e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseLeave={e => { if (!isDetecting && isLoaded) e.currentTarget.style.background = '#FFFFFF'; }}
        >
          {isDetecting ? (
            <>
              <div style={{ width: 14, height: 14, border: '2px solid #D1D5DB', borderTopColor: '#6B7280', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Detecting...
            </>
          ) : (
            <>
              <svg style={{ width: 16, height: 16, color: '#4B5563' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Use My Current Location
            </>
          )}
        </button>
        {locationError && <p style={{ fontSize: 12, color: '#B91C1C', marginTop: 6 }}>{locationError}</p>}
      </div>

      {/* Selected Address Display */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Selected Address</label>
        <textarea
          readOnly
          value={address}
          placeholder="Search above or click on the map"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1px solid #E5E7EB', fontSize: 14, color: '#111',
            background: '#F9FAFB', outline: 'none', boxSizing: 'border-box',
            resize: 'vertical', minHeight: 60, fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!hasLocation}
        style={{
          width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          color: '#FFFFFF', background: confirmed ? '#16A34A' : '#16A34A', border: 'none',
          cursor: !hasLocation ? 'not-allowed' : 'pointer',
          opacity: !hasLocation ? 0.5 : 1, transition: 'background 0.2s'
        }}
        onMouseEnter={e => { if (hasLocation) e.currentTarget.style.background = '#15803D'; }}
        onMouseLeave={e => { if (hasLocation) e.currentTarget.style.background = '#16A34A'; }}
      >
        {confirmed ? '✓ Location Confirmed' : 'Confirm Location'}
      </button>

    </div>
  );
}
