const { Router } = require('express');
const controller = require('../controllers/vehicleDriverAssignment.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();


router.get('/', controller.listAll);
router.get('/driver/:driverId', controller.listByDriver);
router.post('/', controller.createOrReactivate);
router.put('/delete/:id', controller.deactivate);

module.exports = router;
