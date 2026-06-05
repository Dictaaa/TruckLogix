const express = require('express');
const router = express.Router();
const controller = require('../controllers/shippingLines.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /shippingLines
  .post(auth, controller.create);      // POST /shippingLines

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /shippingLines/:id
  .put(auth, controller.update)        // PUT /shippingLines/:id
  .delete(auth, controller.remove);    // DELETE /shippingLines/:id

module.exports = router;
