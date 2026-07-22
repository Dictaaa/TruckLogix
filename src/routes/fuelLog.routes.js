const router = require('express').Router();
const ctrl   = require('../controllers/fuelLog.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router.get('/',        auth, ctrl.getFuelLogs);
router.post('/',       auth, ctrl.createFuelLog);
router.get('/:id',     auth, ctrl.getFuelLogById);
router.put('/:id',     auth, ctrl.updateFuelLog);
router.delete('/:id',  auth, ctrl.deleteFuelLog);

module.exports = router;