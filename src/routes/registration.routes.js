const { Router } = require('express');
const registrationCtrl = require('../controllers/registration.controller');

const router = Router();

// POST /api/registration
router.post('/', registrationCtrl.register);

module.exports = router;
