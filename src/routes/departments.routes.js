// src/routes/departments.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/departments.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router.route('/')
  .get(ctrl.list)
  .post(auth, ctrl.create);

router.route('/:id')
  .get(auth, ctrl.getOne)
  .put(auth, ctrl.update)
  .delete(auth, ctrl.remove);

module.exports = router;
