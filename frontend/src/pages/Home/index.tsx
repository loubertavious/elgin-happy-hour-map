import React, { useEffect, useState } from 'react';
import { getNearbyPlaces } from '../../api/places';
import './style.css';

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
			const data = await getNearbyPlaces(lat, lng, 1500, 'bar');
			setPlaces(data.places || []);
		} catch (err) {
			setError('Failed to fetch places.');
			console.error(err);
		}
		setLoading(false);
	};

	// Ask for geolocation on mount
	useEffect(() => {
		if (!navigator.geolocation) {
			setError('Geolocation is not supported by your browser.');
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				setCoords({ lat: latitude, lng: longitude });
				fetchPlaces(latitude, longitude);
			},
			(err) => {
				setError('Unable to retrieve your location.');
			}
		);
	}, []);

	return (
		<div className="home">
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
			<button
				onClick={() => {
					if (coords) {
						fetchPlaces(coords.lat, coords.lng);
					} else {
						setError('Location not available.');
					}
				}}
			>
				Fetch Nearby Bars (Current Location)
			</button>
		</div>
	);
};

export default Home;