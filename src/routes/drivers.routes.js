const { Router } = require('express');
const controller = require('../controllers/drivers.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/company/:companyId', auth, controller.listByCompany);
router.get('/driverVehicle-company/:companyId', auth, controller.listDriverWithVehiclesByCompany);

module.exports = router;