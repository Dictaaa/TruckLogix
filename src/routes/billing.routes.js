// src/routes/billing.routes.js  (o agrégalo a tu archivo de rutas)
const router = require('express').Router();
const controller = require('../controllers/billing.controller');
// usa tu mismo middleware de autenticación
const auth = require('../middlewares/auth.middleware'); // JWT auth

router.get('/trips',              auth, controller.getTrips);
router.get('/trips/:id/history',  auth, controller.getTripHistory);
router.get('/summary',            auth, controller.getSummary);
router.get('/temp-orders',        auth, controller.getTempOrders);

router.post('/temp-orders',       auth, controller.createTempOrder);
router.post('/purchase-orders',   auth, controller.assignPurchaseOrder);
router.post('/invoices',          auth, controller.assignInvoice);
router.post('/revert',            auth, controller.revert);

module.exports = router;