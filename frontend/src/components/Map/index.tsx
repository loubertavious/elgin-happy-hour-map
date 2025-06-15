import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const OTTAWA_COORDS = {
  lat: 45.4215,
  lng: -75.6972
};

// Animation timing configuration
const ZOOM_CONFIG = {
  maxZoom: 8, // Less dramatic zoom out
  targetZoom: 14, // End zoomed in
  duration: 4500, // 4.5 seconds total for slower animation
  stutterIntensity: 0.03, // Very subtle stutter
  bearingStart: 0,
  bearingMax: 45, // Reduced rotation
  bearingEnd: 0 // Always end north
};

const FLASH_MESSAGE_DURATION = 5000; // 5 seconds

const FlashMessage = ({ visible }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#FFD700',
      padding: '20px 40px',
      borderRadius: '10px',
      fontSize: '48px',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      animation: 'fadeInOut 5s ease-in-out',
      fontFamily: 'Arial, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    }}>
      <span>IT'S BEER TIME</span>
      <span style={{ fontSize: '56px' }}>🍺</span>
    </div>
  );
};

const Map = ({ coords, places }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const popupsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const [showFlashMessage, setShowFlashMessage] = useState(false);

  // Add styles for the flash message animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Initialize the map after the component mounts
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [OTTAWA_COORDS.lng, OTTAWA_COORDS.lat],
        zoom: 10, // Initial zoom for Ottawa overview
        bearing: ZOOM_CONFIG.bearingStart
      });

      mapRef.current.on('load', () => {
        if (mapRef.current) {
          mapRef.current.dragRotate.disable();
          mapRef.current.touchZoomRotate.disableRotation();
          mapRef.current.keyboard.disable();
        }
      });
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      popupsRef.current.forEach(popup => popup.remove());
      popupsRef.current = [];
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // GTA V character swap style animation function
  const animateZoom = (startZoom, targetZoom, startCenter, targetCenter, startTime) => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / ZOOM_CONFIG.duration, 1);

    // Custom easing functions for GTA V style movement
    const easeInOutCubic = (t) => t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const easeInOutQuart = (t) => t < 0.5 
      ? 8 * t * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 4) / 2;

    // Combine easing functions for more dramatic effect
    const easedProgress = easeInOutQuart(easeInOutCubic(progress));

    // Calculate zoom with a more subtle zoom out and in
    let currentZoom;
    if (progress < 0.5) {
      // First half: zoom out
      const zoomOutProgress = progress * 2;
      currentZoom = startZoom + (ZOOM_CONFIG.maxZoom - startZoom) * easeInOutCubic(zoomOutProgress);
    } else {
      // Second half: zoom in
      const zoomInProgress = (progress - 0.5) * 2;
      currentZoom = ZOOM_CONFIG.maxZoom + (targetZoom - ZOOM_CONFIG.maxZoom) * easeInOutCubic(zoomInProgress);
    }

    // Calculate bearing with a more subtle rotation
    const currentBearing = ZOOM_CONFIG.bearingStart + 
      (ZOOM_CONFIG.bearingMax - ZOOM_CONFIG.bearingStart) * Math.sin(progress * Math.PI) +
      (ZOOM_CONFIG.bearingEnd - ZOOM_CONFIG.bearingMax) * easedProgress;

    // Add very subtle stutter effect
    const stutter = Math.sin(progress * Math.PI * 8) * ZOOM_CONFIG.stutterIntensity * (1 - easedProgress);
    const finalZoom = currentZoom + stutter;

    // Interpolate between start and target centers
    const currentCenter = [
      startCenter[0] + (targetCenter[0] - startCenter[0]) * easedProgress,
      startCenter[1] + (targetCenter[1] - startCenter[1]) * easedProgress
    ];

    if (mapRef.current) {
      mapRef.current.setZoom(finalZoom);
      mapRef.current.setCenter(currentCenter);
      mapRef.current.setBearing(currentBearing);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(() => 
          animateZoom(startZoom, targetZoom, startCenter, targetCenter, startTime)
        );
      } else {
        // Show flash message when animation completes
        setShowFlashMessage(true);
        setTimeout(() => {
          setShowFlashMessage(false);
        }, FLASH_MESSAGE_DURATION);
      }
    }
  };

  // Center the map on user location and add user marker when available
  useEffect(() => {
    if (coords && mapRef.current) {
      const [lng, lat] = [coords.lng, coords.lat];
      console.log('Map centering to:', lng, lat);

      // Cancel any existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Get current map state
      const currentZoom = mapRef.current.getZoom();
      const currentCenter = mapRef.current.getCenter().toArray();

      // Start the GTA V character swap style animation
      const startTime = Date.now();
      animateZoom(
        currentZoom,
        ZOOM_CONFIG.targetZoom,
        currentCenter,
        [lng, lat],
        startTime
      );

      // Remove old user marker if exists
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      // Create and add new user marker
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.backgroundColor = 'blue';
      el.style.width = '15px';
      el.style.height = '15px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }
  }, [coords]);

  // Add markers for each place
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    popupsRef.current.forEach(popup => popup.remove());
    popupsRef.current = [];

    places.forEach(place => {
      const location = place.location;
      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
          className: 'bar-popup'
        }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px;">${place.displayName?.text || 'Unnamed Bar'}</h3>
          </div>
        `);

        const marker = new maplibregl.Marker()
          .setLngLat([location.longitude, location.latitude])
          .setPopup(popup)
          .addTo(mapRef.current);

        markersRef.current.push(marker);
        popupsRef.current.push(popup);
      }
    });
  }, [places]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '80vh' }}>
      <div
        ref={mapContainerRef}
        id="map"
        style={{ width: '100%', height: '100%' }}
      />
      <FlashMessage visible={showFlashMessage} />
    </div>
  );
};

export default Map; 