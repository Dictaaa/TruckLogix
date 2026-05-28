// src/routes/municipalities.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/municipalities.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router.route('/')
  .get(ctrl.list)
  .post(auth, ctrl.create);

router.route('/:id')
  .get(auth, ctrl.getOne)
  .put(auth, ctrl.update)
  .delete(auth, ctrl.remove);

  router.get('/department/:department_id', ctrl.getByDepartment);

module.exports = router;
