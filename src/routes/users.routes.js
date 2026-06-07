// routes/trucks.routes.js
const { Router } = require('express');
const ctrl = require('../controllers/users.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router
  .route('/')
  .get(ctrl.list)          // GET /trucks
  .post(auth, ctrl.create);      // POST /trucks

router
  .route('/:id')
  .put(auth, ctrl.update)        // PUT /trucks/:id
  .delete(auth, ctrl.remove);    // DELETE /trucks/:id

module.exports = router;
