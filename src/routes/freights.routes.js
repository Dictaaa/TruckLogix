const express = require('express');
const router = express.Router();
const controller = require('../controllers/freights.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /freights
  .post(auth, controller.create);      // POST /freights

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /freights/:id
  .put(auth, controller.update)        // PUT /freights/:id
  .delete(auth, controller.remove);    // DELETE /freights/:id

module.exports = router;
