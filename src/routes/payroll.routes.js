const router = require('express').Router();
const ctrl = require('../controllers/payroll.controller');
const auth = require('../middlewares/auth.middleware');

router.use(auth);

router.get('/settings', ctrl.getSettings);
router.patch('/settings', ctrl.updateSettings);

router.get('/periods', ctrl.listPeriods);
router.get('/periods/:id/entries', ctrl.listPeriodEntries);
router.post('/periods/:id/pay', ctrl.payPeriod);

router.get('/preview', ctrl.previewDriverPayroll);
router.post('/entries', ctrl.saveDriverEntry);

module.exports = router;