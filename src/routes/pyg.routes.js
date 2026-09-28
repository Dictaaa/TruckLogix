const express = require('express');
const router = express.Router();
const controller = require('../controllers/pyg.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router.get('/dashboard/pyg',             auth, controller.getPyg);

router.get('/',            auth, controller.listParameters);
router.get('/resolved',   auth, controller.getResolved);   // antes de '/:id'
router.post('/',           auth, controller.createParameters);
router.put('/:id',        auth, controller.updateParameters);
router.delete('/:id',     auth, controller.deleteParameters);

module.exports = router;
