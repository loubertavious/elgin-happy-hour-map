import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const Map = ({ coords, places }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]); // Store place marker instances
  const userMarkerRef = useRef(null); // Store user location marker instance

  // Initialize the map after the component mounts
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [0, 0],
        zoom: 1,
      });

      // Disable interactions AFTER the map has fully loaded
      mapRef.current.on('load', () => {
        if (mapRef.current) {
          mapRef.current.dragRotate.disable();
          mapRef.current.touchZoomRotate.disableRotation();
          mapRef.current.keyboard.disable();
        }
      });
    }
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      // Remove all place markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      // Remove user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Center the map on user location and add user marker when available
  useEffect(() => {
    if (coords && mapRef.current) {
      const [lng, lat] = [coords.lng, coords.lat];
      console.log('Map centering to:', lng, lat);
      mapRef.current.setZoom(14);
      mapRef.current.setCenter([lng, lat]);

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
    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    // Add new markers
    places.forEach(place => {
      const location = place.location;
      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        const marker = new maplibregl.Marker()
          .setLngLat([location.longitude, location.latitude])
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      }
    });
  }, [places]);

  return (
    <div
      ref={mapContainerRef}
      id="map"
      style={{ width: '100%', height: '80vh' }}
    />
  );
};

export default Map; 