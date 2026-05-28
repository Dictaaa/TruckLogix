const { Router } = require('express');
const ctrl = require('../controllers/vehicles.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router
  .route('/')
  .get(ctrl.list)          // GET /vehicles
  .post(auth, ctrl.create);      // POST /vehicles

router
  .route('/:id')
  .get(auth, ctrl.getOne)        // GET /vehicles/:id
  .put(auth, ctrl.update)        // PUT /vehicles/:id
  .delete(auth, ctrl.remove);    // DELETE /vehicles/:id

router.get('/byCompany/:companyId', ctrl.listByCompany);
router.get('/byCompanyAndUnassigned/:companyId/:userId', ctrl.listUnassignedVehiclesByCompanyAndUser);


module.exports = router;
