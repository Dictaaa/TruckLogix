// src/routes/vehicleDowntime.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/vehicleDowntime.controller');
const auth   = require('../middlewares/auth.middleware');

// ─── Sugerencias (días sin viajes detectados) ─────────────────────────────────
router.get('/suggestions',        auth, ctrl.getSuggestions);

// ─── Crear desde sugerencia (un registro) ────────────────────────────────────
router.post('/from-suggestion',   auth, ctrl.createFromSuggestion);

// ─── CRUD Registros ───────────────────────────────────────────────────────────
router.get('/',                   auth, ctrl.getDowntimes);
router.post('/',                  auth, ctrl.createDowntime);
router.put('/:id',                auth, ctrl.updateDowntime);
router.delete('/:id',             auth, ctrl.deleteDowntime);

// ─── Maestro Estados ──────────────────────────────────────────────────────────
router.get('/statuses',           auth, ctrl.getStatuses);
router.post('/statuses',          auth, ctrl.createStatus);
router.put('/statuses/:id',       auth, ctrl.updateStatus);
router.delete('/statuses/:id',    auth, ctrl.deleteStatus);

module.exports = router;