const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Store your key in .env

router.get('/places/nearby', async (req, res) => {
  const { lat, lng, radius, type, keyword } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ error: 'lat, lng, and radius are required' });
  }

  try {
    const url = `https://places.googleapis.com/v1/places:searchNearby?key=${GOOGLE_API_KEY}`;
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
    if (type) {
      body.includedTypes = type.split(',');
    }
    if (keyword) body.query = keyword;

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location'
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching places:', error.response?.data || error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch places', details: error.response?.data || error.message });
  }
});

module.exports = router;
