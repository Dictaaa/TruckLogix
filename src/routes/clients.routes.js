const express = require('express');
const router = express.Router();
const controller = require('../controllers/clients.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /clients
  .post(auth, controller.create);      // POST /clients

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /clients/:id
  .put(auth, controller.update)        // PUT /clients/:id
  .delete(auth, controller.remove);    // DELETE /clients/:id

module.exports = router;
