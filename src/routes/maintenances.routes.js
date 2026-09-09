const router = require('express').Router();
const ctrl   = require('../controllers/maintenance.controller');
const auth   = require('../middlewares/auth.middleware');

// ─── CRUD Mantenimientos ──────────────────────────────────────────────────────
router.get('/',      auth, ctrl.getMaintenances);
router.post('/',     auth, ctrl.createMaintenance);
router.get('/:id',   auth, ctrl.getMaintenanceById);
router.put('/:id',   auth, ctrl.updateMaintenance);
router.delete('/:id',auth, ctrl.deleteMaintenance);

// ─── Maestros ─────────────────────────────────────────────────────────────────
router.get('/masters/brands',         auth, ctrl.getBrands);
router.post('/masters/brands',        auth, ctrl.createBrand);
router.get('/masters/types',          auth, ctrl.getMaintenanceTypes);
router.post('/masters/types',         auth, ctrl.createMaintenanceType);
router.get('/masters/trailer-plates', auth, ctrl.getTrailerPlates);
router.post('/masters/trailer-plates',auth, ctrl.createTrailerPlate);

module.exports = router;