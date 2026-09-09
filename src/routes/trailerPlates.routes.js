// src/routes/trailerPlates.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/maintenanceTypes.controller');
const auth   = require('../middlewares/auth.middleware');

// ─── Placas Trailer ───────────────────────────────────────────────────────────
router.get('/',      auth, ctrl.getTrailerPlates);
router.post('/',     auth, ctrl.createTrailerPlate);
router.put('/:id',   auth, ctrl.updateTrailerPlate);
router.delete('/:id',auth, ctrl.deleteTrailerPlate);

module.exports = router;