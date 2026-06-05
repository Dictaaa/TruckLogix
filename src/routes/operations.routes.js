const express = require('express');
const router = express.Router();
const controller = require('../controllers/operations.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /operations
  .post(auth, controller.create);      // POST /operations

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /operations/:id
  .put(auth, controller.update)        // PUT /operations/:id
  .delete(auth, controller.remove);    // DELETE /operations/:id

module.exports = router;
