const express = require('express');
const router = express.Router();
const controller = require('../controllers/transportAssistants.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router
  .route('/')
  .get(controller.list)          // GET /transport-assistants
  .post(auth, controller.create);      // POST /transport-assistants

router
  .route('/:id')
  .get(auth, controller.getOne)        // GET /transport-assistants/:id
  .put(auth, controller.update)        // PUT /transport-assistants/:id
  .delete(auth, controller.remove);    // DELETE /transport-assistants/:id

module.exports = router;
