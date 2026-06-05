const express = require('express');
const router = express.Router();
const controller = require('../controllers/patios.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /patios
  .post(auth, controller.create);      // POST /patios

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /patios/:id
  .put(auth, controller.update)        // PUT /patios/:id
  .delete(auth, controller.remove);    // DELETE /patios/:id

module.exports = router;
