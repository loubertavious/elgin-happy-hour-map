import axios from 'axios';

export async function getNearbyPlaces(lat, lng, radius = 1500, type = 'bar', keyword = '') {
  const response = await axios.get('/places/nearby', {
    params: { lat, lng, radius, type, keyword }
  });
  return response.data;
}
