const { Router } = require('express');
const controller = require('../controllers/patios.controller');
const auth = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;