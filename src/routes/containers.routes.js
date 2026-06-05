const express = require('express');
const router = express.Router();
const controller = require('../controllers/containers.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /containers
  .post(auth, controller.create);      // POST /containers

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /containers/:id
  .put(auth, controller.update)        // PUT /containers/:id
  .delete(auth, controller.remove);    // DELETE /containers/:id

  // Buscar por número o crear si no existe
router.post('/find-or-create', auth, controller.findOrCreate);

module.exports = router;
