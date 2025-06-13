const express = require('express');
const placesRouter = require('./places');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('hello world!');
});

router.use(placesRouter);

module.exports = router;