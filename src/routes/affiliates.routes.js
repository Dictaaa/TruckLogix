const express = require('express');
const router = express.Router();
const controller = require('../controllers/affiliates.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /affiliates
  .post(auth, controller.create);      // POST /affiliates

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /affiliates/:id
  .put(auth, controller.update)        // PUT /affiliates/:id
  .delete(auth, controller.remove);    // DELETE /affiliates/:id

module.exports = router;
