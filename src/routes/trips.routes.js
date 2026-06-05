const express = require('express');
const router = express.Router();
const controller = require('../controllers/trips.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router.post('/', auth, controller.createTrip);
router.get('/', auth, controller.getTripsByCompany);
router.get('/:id', auth, controller.getTripById);
router.put('/:id', auth, controller.updateTripById);
router.delete('/:id', auth, controller.deleteTripById);


module.exports = router;
