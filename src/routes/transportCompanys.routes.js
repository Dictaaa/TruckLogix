const express = require('express');
const router = express.Router();
const controller = require('../controllers/transportCompanys.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /transportCompanies
  .post(auth, controller.create);      // POST /transportCompanies

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /transportCompanies/:id
  .put(auth, controller.update)        // PUT /transportCompanies/:id
  .delete(auth, controller.remove);    // DELETE /transportCompanies/:id

module.exports = router;
