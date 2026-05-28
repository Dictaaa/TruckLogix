// src/routes/document_type.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/document_type.controller');
const auth = require('../middlewares/auth.middleware'); // opcional

const router = Router();

router.route('/')
  .get(ctrl.list)
  .post(auth, ctrl.create);

router.route('/:id')
  .get(ctrl.getOne)
  .put(auth, ctrl.update)
  .delete(auth, ctrl.remove);

module.exports = router;
