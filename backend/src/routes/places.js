const express = require('express');
const axios = require('axios');
const router = express.Router();
const config = require('../config/config');

// Check for required API key
if (!config.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY is not set in environment variables');
}

router.get('/places/nearby', async (req, res) => {
  const { lat, lng, radius, type, keyword } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ error: 'lat, lng, and radius are required' });
  }

  if (!config.GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'Google Places API key is not configured' });
  }

  try {
    const url = `https://places.googleapis.com/v1/places:searchNearby?key=${config.GOOGLE_API_KEY}`;
    const body = {
      locationRestriction: {
        circle: {
          center: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
          },
          radius: parseInt(radius)
        }
      }
    };
    if (type) body.includedTypes = [type];
    if (keyword) body.query = keyword;

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location'
      },
    });
    res.json(response.data);
    console.log('Got position:', latitude, longitude);
  } catch (error) {
    console.error('Error fetching places:', error.response?.data || error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch places', details: error.response?.data || error.message });
  }
});

module.exports = router;
