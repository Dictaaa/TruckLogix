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

module.exports = router;
