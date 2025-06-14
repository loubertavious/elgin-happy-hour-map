import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { getNearbyPlaces } from '../../api/places';
import Map from '../../components/Map'; // Import the new Map component
import './style.css';

const GEOLOCATION_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
let geolocationCache = { coords: null, timestamp: 0 };

const Home = () => {
	const [places, setPlaces] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [coords, setCoords] = useState(null);
	
	// Function to fetch places using given coordinates
	const fetchPlaces = async (lat, lng) => {
		setLoading(true);
		setError('');
		try {
			console.log('Fetching places for:', lat, lng);
			const data = await getNearbyPlaces(lat, lng, 1500, 'bar');
			console.log('Fetched data:', data);
			setPlaces(data.places || []);
		} catch (err) {
			setError('Failed to fetch places.');
			console.error('Fetch places error:', err);
		}
		setLoading(false);
	};

	// Handler for button click to get geolocation and fetch places
	const handleFetchNearby = () => {
		console.log('Button clicked');

		// Check cache first
		const now = Date.now();
		if (geolocationCache.coords && (now - geolocationCache.timestamp < GEOLOCATION_CACHE_EXPIRY_MS)) {
			console.log('Using cached geolocation:', geolocationCache.coords.lat, geolocationCache.coords.lng);
			setCoords(geolocationCache.coords);
			fetchPlaces(geolocationCache.coords.lat, geolocationCache.coords.lng);
			return;
		}

		if (!navigator.geolocation) {
			setError('Geolocation is not supported by your browser.');
			return;
		}
		setError('');
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				console.log('Got position:', latitude, longitude);
				const newCoords = { lat: latitude, lng: longitude };
				setCoords(newCoords);
				fetchPlaces(latitude, longitude);

				// Update cache
				geolocationCache = { coords: newCoords, timestamp: now };
			},
			(err) => {
				setError('Unable to retrieve your location.');
				console.log('Geolocation error:', err);
			}
		);
	};

	return (
		<div className="home" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
			<Map coords={coords} places={places} />
			<div style={{ padding: '1em', overflowY: 'auto', width: '100%' }}>
				<h1>Nearby Bars</h1>
				{error && <p style={{ color: 'red' }}>{error}</p>}
				{loading && <p>Loading...</p>}
				<ul>
					{places.map(place => (
						<li key={place.id} style={{ marginBottom: '1em' }}>
							<strong>{place.displayName?.text || 'No Name'}</strong><br />
							<span>ID: {place.id}</span><br />
							{place.formattedAddress && <span>Address: {place.formattedAddress}</span>}
						</li>
					))}
				</ul>
				<button onClick={handleFetchNearby}>
					Fetch Nearby Bars (Current Location)
				</button>
			</div>
		</div>
	);
};

export default Home;