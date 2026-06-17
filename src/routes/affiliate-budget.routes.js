const router = require('express').Router();
const ctrl   = require('../controllers/affiliate-budget.controller');
const auth = require('../middlewares/auth.middleware'); // JWT auth

router.get('/',        auth, ctrl.list);
router.post('/',       auth, ctrl.upsert);
router.post('/bulk',   auth, ctrl.upsertMany);
router.get('/:id',     auth, ctrl.getOne);
router.delete('/:id',  auth, ctrl.remove);

module.exports = router;