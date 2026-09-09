// src/routes/maintenanceTypes.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/maintenanceTypes.controller');
const auth   = require('../middlewares/auth.middleware');

// ─── Tipos de Mantenimiento ───────────────────────────────────────────────────
router.get('/',      auth, ctrl.getMaintenanceTypes);
router.post('/',     auth, ctrl.createMaintenanceType);
router.put('/:id',   auth, ctrl.updateMaintenanceType);
router.delete('/:id',auth, ctrl.deleteMaintenanceType);

module.exports = router;